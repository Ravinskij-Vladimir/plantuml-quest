import * as levels from './levels.js';

const STORAGE_KEY = 'plantuml-game';

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

  checkAchievements() {
    const old = new Set(this.data.achievements);
    const next = [];

    const allThreeStars = levels.LEVELS.every(
      (l) => this.getLevelProgress(l.id).stars === 3
    );
    if (allThreeStars) next.push('perfectionist');

    if (this.countCodeNoHints() >= Math.min(5, levels.LEVELS.length)) {
      next.push('code-master');
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
  }
};
