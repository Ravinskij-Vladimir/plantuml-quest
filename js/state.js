import * as levels from './levels.js';
import { THEORY } from './theory.js';
import { PROJECTS } from './projects.js';

const STORAGE_KEY = 'plantuml-game';

/** Full achievements registry — metadata for the badges screen */
export const ACHIEVEMENTS = [
  {
    key: 'first-steps',
    name: 'Первые шаги',
    icon: '🌱',
    description: 'Пройди свой первый уровень (Пазл)',
    category: 'progress'
  },
  {
    key: 'perfectionist',
    name: 'Перфекционист',
    icon: '💎',
    description: 'Получи 3 звезды на всех уровнях',
    category: 'skill'
  },
  {
    key: 'code-master',
    name: 'Мастер кода',
    icon: '⌨️',
    description: 'Пройди 5 уровней режима «Код» без подсказок',
    category: 'skill'
  },
  {
    key: 'puzzle-solver',
    name: 'Решатель пазлов',
    icon: '🧩',
    description: 'Пройди все пазлы (13 уровней)',
    category: 'progress'
  },
  {
    key: 'diagram-master',
    name: 'Мастер диаграмм',
    icon: '📊',
    description: 'Пройди все уровни до конца (все 3 режима)',
    category: 'completion'
  },
  {
    key: 'theory-lover',
    name: 'Знаток теории',
    icon: '📚',
    description: 'Прочитай все материалы теории',
    category: 'knowledge'
  },
  {
    key: 'practitioner',
    name: 'Практик',
    icon: '🛠️',
    description: 'Заверши хотя бы один практический проект',
    category: 'completion'
  },
  {
    key: 'project-master',
    name: 'Мастер проектов',
    icon: '🏗️',
    description: 'Заверши все практические проекты',
    category: 'completion'
  },
  {
    key: 'no-hints-hero',
    name: 'Без подсказок',
    icon: '🦸',
    description: 'Пройди 10 уровней без единой подсказки',
    category: 'skill'
  },
  {
    key: 'speed-runner',
    name: 'Спидраннер',
    icon: '⚡',
    description: 'Потрать менее 30 секунд на прохождение любого режима',
    category: 'skill'
  },
  {
    key: 'half-way',
    name: 'На полпути',
    icon: '🗺️',
    description: 'Пройди хотя бы половину уровней (7 из 13)',
    category: 'progress'
  },
  {
    key: 'triple-star',
    name: 'Три звезды!',
    icon: '🌟',
    description: 'Получи 3 звезды хотя бы на одном уровне',
    category: 'skill'
  },
  {
    key: 'all-types',
    name: 'Все типы',
    icon: '🎨',
    description: 'Пройди хотя бы один уровень каждого типа диаграмм (sequence, class, usecase, state, activity, component)',
    category: 'knowledge'
  }
];

export function getAchievementDef(key) {
  return ACHIEVEMENTS.find(a => a.key === key);
}

function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

export const GameState = {
  data: {
    settings: { theme: 'dark' },
    progress: {},
    theoryProgress: {},
    projectProgress: {},
    achievements: [],
    stats: { codeNoHints: 0, totalHints: 0, sessionsStarted: 0 }
  },

  init() {
    this.load();
    this.applyTheme();
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(this.data, parsed);
        if (!Array.isArray(this.data.achievements)) this.data.achievements = [];
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Не удалось прочитать сохранение:', err);
    }
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Не удалось сохранить прогресс:', err);
    }
  },

  reset() {
    this.data.settings.theme = 'dark';
    this.data.progress = {};
    this.data.theoryProgress = {};
    this.data.projectProgress = {};
    this.data.achievements = [];
    this.data.stats = { codeNoHints: 0, totalHints: 0, sessionsStarted: 0 };
    this.save();
  },

  theme() {
    return this.data.settings.theme || 'dark';
  },

  setTheme(theme) {
    this.data.settings.theme = theme;
    this.save();
    this.applyTheme();
  },

  applyTheme() {
    const theme = this.theme();
    document.documentElement.dataset.theme = theme;
  },

  getLevelProgress(id) {
    return (
      deepClone(this.data.progress[id]) || {
        puzzle: false,
        code: false,
        describe: false,
        stars: 0,
        hints: 0,
        attempts: 0,
        time: 0,
        codeNoHint: false,
        totalWrongAttempts: 0
      }
    );
  },

  completeMode(id, mode, { usedHint = false, timeSpent = 0, wrongAttempts = 0, showAnswer = false } = {}) {
    const p = this.getLevelProgress(id);
    const firstTime = !p[mode];

    p[mode] = true;
    p.time += timeSpent;

    if (firstTime) {
      p.attempts += 1;
    }

    // Накапливаем общее количество неправильных попыток
    p.totalWrongAttempts = (p.totalWrongAttempts || 0) + wrongAttempts;

    if (showAnswer) {
      // Показ ответа: завершаем режим без звёзд, но не сбрасываем текущие звёзды
    } else {
      if (!usedHint) {
        if (mode === 'code') p.codeNoHint = true;
      } else {
        p.hints += 1;
        this.data.stats.totalHints += 1;
      }

      p.stars = Math.max(p.stars, this.computeStars(usedHint, wrongAttempts));
    }

    this.data.progress[id] = p;
    this.save();
    this.checkAchievements();
    return p;
  },

  computeStars(usedHint, wrongAttempts = 0) {
    if (wrongAttempts >= 5) return 1;
    if (usedHint) return 2;
    if (wrongAttempts >= 2) return 2;
    return 3;
  },

  resetModeProgress(id, mode) {
    const p = this.getLevelProgress(id);
    p[mode] = false;
    // Не сбрасываем звёзды — они остаются как лучший результат
    this.data.progress[id] = p;
    this.save();
    return p;
  },

  isLevelUnlocked(id) {
    const idx = levels.LEVELS.findIndex((l) => l.id === Number(id));
    if (idx <= 0) return true;
    const prevId = levels.LEVELS[idx - 1].id;
    const pp = this.getLevelProgress(prevId);
    // Новый уровень открывается после прохождения первого этапа (Пазл)
    return pp.puzzle;
  },

  isModeUnlocked(id, mode) {
    const p = this.getLevelProgress(id);
    if (mode === 'puzzle') return true;
    if (mode === 'code') return p.puzzle;
    return p.puzzle && p.code;
  },

  getModeProgress(mode) {
    return levels.LEVELS.reduce((sum, l) => sum + (this.getLevelProgress(l.id)[mode] ? 1 : 0), 0);
  },

  countCodeNoHints() {
    return levels.LEVELS.reduce((sum, l) => sum + (this.getLevelProgress(l.id).codeNoHint ? 1 : 0), 0);
  },

  countAllModesCompleted() {
    return levels.LEVELS.reduce((sum, l) => {
      const p = this.getLevelProgress(l.id);
      return sum + (p.puzzle && p.code && p.describe ? 1 : 0);
    }, 0);
  },

  countNoHintLevels() {
    return levels.LEVELS.reduce((sum, l) => {
      const p = this.getLevelProgress(l.id);
      return sum + (p.hints === 0 && (p.puzzle || p.code || p.describe) ? 1 : 0);
    }, 0);
  },

  hasCompletedAnyMode() {
    return levels.LEVELS.some((l) => {
      const p = this.getLevelProgress(l.id);
      return p.puzzle || p.code || p.describe;
    });
  },

  getPuzzleCount() {
    return levels.LEVELS.reduce((sum, l) => sum + (this.getLevelProgress(l.id).puzzle ? 1 : 0), 0);
  },

  getCompletedLevelCount() {
    return levels.LEVELS.reduce((sum, l) => {
      const p = this.getLevelProgress(l.id);
      return sum + (p.puzzle && p.code && p.describe ? 1 : 0);
    }, 0);
  },

  hasAnyThreeStars() {
    return levels.LEVELS.some((l) => this.getLevelProgress(l.id).stars === 3);
  },

  hasCompletedType(type) {
    return levels.LEVELS.some((l) => l.type === type && this.getLevelProgress(l.id).puzzle);
  },

  getCompletedTypes() {
    const types = new Set();
    levels.LEVELS.forEach((l) => {
      if (this.getLevelProgress(l.id).puzzle) types.add(l.type);
    });
    return types;
  },

  hasFastCompletion() {
    return levels.LEVELS.some((l) => {
      const p = this.getLevelProgress(l.id);
      return p.time > 0 && p.time < 30 && (p.puzzle || p.code || p.describe);
    });
  },

  checkAchievements() {
    const old = new Set(this.data.achievements);
    const next = [];

    // First Steps — completed any level (puzzle mode)
    if (this.hasCompletedAnyMode()) next.push('first-steps');

    // Perfectionist — all 3 stars
    const allThreeStars = levels.LEVELS.every(
      (l) => this.getLevelProgress(l.id).stars === 3
    );
    if (allThreeStars) next.push('perfectionist');

    // Code Master — 5 levels code without hints
    if (this.countCodeNoHints() >= Math.min(5, levels.LEVELS.length)) {
      next.push('code-master');
    }

    // Puzzle Solver — all puzzles done
    if (this.getPuzzleCount() >= levels.LEVELS.length) {
      next.push('puzzle-solver');
    }

    // Diagram Master — all levels fully completed
    if (this.getCompletedLevelCount() >= levels.LEVELS.length) {
      next.push('diagram-master');
    }

    // Theory Lover — all theory read
    const theoryStats = this.getTheoryStats();
    if (theoryStats.total > 0 && theoryStats.read >= theoryStats.total) {
      next.push('theory-lover');
    }

    // Practitioner — completed at least one project
    const projectStats = this.getProjectStats();
    if (projectStats.completed >= 1) {
      next.push('practitioner');
    }

    // Project Master — all projects completed
    if (projectStats.total > 0 && projectStats.completed >= projectStats.total) {
      next.push('project-master');
    }

    // No Hints Hero — 10 levels without hints
    if (this.countNoHintLevels() >= 10) {
      next.push('no-hints-hero');
    }

    // Half Way — 7+ levels completed
    if (this.getCompletedLevelCount() >= 7) {
      next.push('half-way');
    }

    // Triple Star — any level with 3 stars
    if (this.hasAnyThreeStars()) {
      next.push('triple-star');
    }

    // All Types — one of each diagram type
    const allTypes = ['sequence', 'class', 'usecase', 'state', 'activity', 'component'];
    const completedTypes = this.getCompletedTypes();
    if (allTypes.every((t) => completedTypes.has(t))) {
      next.push('all-types');
    }

    // Speed Runner — any mode under 30s
    if (this.hasFastCompletion()) {
      next.push('speed-runner');
    }

    const unique = [...new Set([...this.data.achievements, ...next])];
    const newlyUnlocked = unique.filter((a) => !old.has(a));
    this.data.achievements = unique;

    if (newlyUnlocked.length) {
      this.save();
      window.dispatchEvent(
        new CustomEvent('achievements-unlocked', { detail: newlyUnlocked })
      );
    }
  },

  isAchievementUnlocked(key) {
    return this.data.achievements.includes(key);
  },

  getTheoryProgress(id) {
    return deepClone(this.data.theoryProgress[id]) || {
      read: false,
      completed: false,
      timeSpent: 0
    };
  },

  getProjectProgress(id) {
    return deepClone(this.data.projectProgress[id]) || {
      started: false,
      completed: false,
      diagramsCompleted: [],
      timeSpent: 0
    };
  },

  // Theory unlocking: theory unlocks when corresponding level's puzzle is completed
  // Theory #1 is always unlocked by default
  isTheoryUnlocked(theoryId) {
    const theory = THEORY.find(t => t.id === theoryId);
    if (!theory) return false;
    if (theory.id === 1) return true;
    // Теория N открывается после прохождения пазла уровня N-1
    const prevLevelId = theory.levelId - 1;
    if (prevLevelId < 1) return true;
    const levelProgress = this.getLevelProgress(prevLevelId);
    return levelProgress.puzzle === true;
  },

  // Project unlocking: projects unlock when specific theory is read
  isProjectUnlocked(projectId) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return false;
    if (!project.unlockCondition) return true;

    if (project.unlockCondition.startsWith('theory_')) {
      const theoryId = parseInt(project.unlockCondition.replace('theory_', ''));
      const theoryProgress = this.getTheoryProgress(theoryId);
      return theoryProgress.read === true;
    }
    return true;
  },

  completeTheory(theoryId) {
    const tp = this.getTheoryProgress(theoryId);
    tp.read = true;
    tp.completed = true;
    this.data.theoryProgress[theoryId] = tp;
    this.save();
    this.checkAchievements();
    return tp;
  },

  markTheoryRead(theoryId, timeSpent = 0) {
    const tp = this.getTheoryProgress(theoryId);
    tp.read = true;
    tp.timeSpent = (tp.timeSpent || 0) + timeSpent;
    this.data.theoryProgress[theoryId] = tp;
    this.save();
    this.checkAchievements();
    return tp;
  },

  startProject(projectId) {
    const pp = this.getProjectProgress(projectId);
    pp.started = true;
    this.data.projectProgress[projectId] = pp;
    this.save();
    return pp;
  },

  completeProjectDiagram(projectId, diagramType) {
    const pp = this.getProjectProgress(projectId);
    if (!pp.diagramsCompleted.includes(diagramType)) {
      pp.diagramsCompleted.push(diagramType);
    }
    const project = PROJECTS.find(p => p.id === projectId);
    if (project && project.expectedPatterns) {
      const allDone = project.expectedPatterns.every(p => pp.diagramsCompleted.includes(p));
      if (allDone) {
        pp.completed = true;
      }
    }
    this.data.projectProgress[projectId] = pp;
    this.save();
    this.checkAchievements();
    return pp;
  },

  getTheoryStats() {
    const total = THEORY.length;
    const read = THEORY.filter(t => this.getTheoryProgress(t.id).read).length;
    const completed = THEORY.filter(t => this.getTheoryProgress(t.id).completed).length;
    return { total, read, completed };
  },

  getProjectStats() {
    const total = PROJECTS.length;
    const started = PROJECTS.filter(p => this.getProjectProgress(p.id).started).length;
    const completed = PROJECTS.filter(p => this.getProjectProgress(p.id).completed).length;
    return { total, started, completed };
  }
};
