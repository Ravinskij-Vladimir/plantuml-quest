import { GameState } from './state.js';
import { LEVELS, getLevel } from './levels.js';
import { THEORY, getTheoryByLevel } from './theory.js';
import { PROJECTS, getProjectById } from './projects.js';
import { initUI, showToast, showModal, hideModal, confetti } from './ui.js';
import { initAccessibility } from './accessibility.js';
import * as GamePuzzle from './game-puzzle.js';
import * as GameCode from './game-code.js';
import * as GameDescribe from './game-describe.js';
import * as renderer from './renderer.js';
import { PlantUMLValidator } from './validator.js';
import { PlantUMLAPI } from './plantuml-api.js';

const MODULES = { puzzle: GamePuzzle, code: GameCode, describe: GameDescribe };
const MODE_META = {
  puzzle: { label: 'Пазл', icon: '🧩', desc: 'Собирай диаграммы из фрагментов, строк и ищи ошибки' },
  code: { label: 'Код', icon: '⌨️', desc: 'Пиши и исправляй PlantUML-код с подсветкой синтаксиса' },
  describe: { label: 'Описание', icon: '💬', desc: 'Выбирай тип диаграммы для сценария и генерируй код' }
};
const MODES = Object.keys(MODE_META);

let current = { levelId: null, mode: null, instance: null, startTime: 0 };

function init() {
  initUI();
  GameState.init();
  initAccessibility();
  bindEvents();
  handleHash();
  loadSharedDiagram();
  window.addEventListener('hashchange', handleHash);
  window.addEventListener('achievements-unlocked', (e) => showAchievements(e.detail));
}

function bindEvents() {
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('back-to-home').addEventListener('click', () => navigate('home'));
  document.getElementById('back-to-levels').addEventListener('click', backToLevels);
  document.getElementById('back-to-home-from-theory').addEventListener('click', () => navigate('home'));
  document.getElementById('back-to-theory').addEventListener('click', () => navigate('theory'));
  document.getElementById('back-to-home-from-projects').addEventListener('click', () => navigate('home'));
  document.getElementById('back-to-projects').addEventListener('click', () => navigate('projects'));
  document.getElementById('btn-check').addEventListener('click', () => {
    if (!current.instance?.check) return;
    try {
      current.instance.check();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при проверке:', err);
      showToast('Не удалось выполнить проверку. Попробуй ещё раз.', 'error');
    }
  });
  document.getElementById('btn-hint').addEventListener('click', () => {
    if (!current.instance?.hint) return;
    try {
      current.instance.hint();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при показе подсказки:', err);
    }
  });
  document.getElementById('btn-show-answer').addEventListener('click', () => {
    if (!current.instance?.showAnswer) return;
    showModal(
      'Показать правильный ответ?',
      'Ты увидишь правильный ответ, но не получишь звёзд за этот режим. Ты сможешь перерешать позже.',
      [
        { label: 'Показать', primary: true, onClick: () => { hideModal(); current.instance.showAnswer(); } },
        { label: 'Отмена', onClick: () => {} }
      ]
    );
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    if (!current.levelId) return;
    showModal(
      'Перерешать уровень?',
      'Ты начнёшь этот режим заново. Все неправильные попытки будут сброшены, и ты сможешь заработать 3 звезды.',
      [
        { label: 'Перерешать', primary: true, onClick: () => { hideModal(); restartGame(); } },
        { label: 'Отмена', onClick: () => {} }
      ]
    );
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      if (current.levelId && GameState.isModeUnlocked(current.levelId, mode)) {
        navigate('game', current.levelId, mode);
      } else if (current.levelId) {
        showToast('Сначала пройди предыдущий режим', 'warning');
      }
    });
  });
}

function navigate(screen, ...args) {
  if (screen === 'home') location.hash = '';
  else if (screen === 'levels') location.hash = `levels/${args[0] || 'puzzle'}`;
  else if (screen === 'game') {
    const [id, mode] = args;
    location.hash = `game/${id}/${mode || 'puzzle'}`;
  }
  else if (screen === 'theory') location.hash = 'theory';
  else if (screen === 'theory-detail') location.hash = `theory/${args[0]}`;
  else if (screen === 'projects') location.hash = 'projects';
  else if (screen === 'project-detail') location.hash = `project/${args[0]}`;
}

function toggleTheme() {
  const next = GameState.theme() === 'dark' ? 'light' : 'dark';
  GameState.setTheme(next);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('is-active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('is-active');
}

// ------------------- home -------------------
function renderHome() {
  const container = document.getElementById('mode-cards');
  container.innerHTML = '';

  // Game modes section
  const modesSection = document.createElement('div');
  modesSection.className = 'home-section';
  modesSection.innerHTML = '<h3 class="home-section-title">Режимы обучения</h3>';
  const modesGrid = document.createElement('div');
  modesGrid.className = 'mode-cards';
  
  MODES.forEach((mode) => {
    const meta = MODE_META[mode];
    const done = GameState.getModeProgress(mode);
    const total = LEVELS.length;
    const pct = Math.round((done / total) * 100);

    const card = document.createElement('div');
    card.className = 'card card-hover mode-card';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="mode-card__icon">${meta.icon}</div>
      <div class="mode-card__title">${meta.label}</div>
      <div class="mode-card__desc">${meta.desc}</div>
      <div class="mode-card__progress">
        <span>${done}/${total}</span>
        <div class="mode-card__bar"><div class="mode-card__bar-inner" style="width:${pct}%"></div></div>
        <span>${pct}%</span>
      </div>
    `;

    const open = () => navigate('levels', mode);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(); });
    modesGrid.appendChild(card);
  });
  modesSection.appendChild(modesGrid);
  container.appendChild(modesSection);

  // Theory section
  const theoryStats = GameState.getTheoryStats();
  const theorySection = document.createElement('div');
  theorySection.className = 'home-section';
  theorySection.innerHTML = `
    <h3 class="home-section-title"><span class="home-section-icon">📚</span> Теория</h3>
    <div class="home-section-stats">Прочитано: ${theoryStats.read}/${theoryStats.total} | Изучено: ${theoryStats.completed}/${theoryStats.total}</div>
  `;
  const theoryCard = document.createElement('div');
  theoryCard.className = 'card card-hover mode-card';
  theoryCard.setAttribute('role', 'button');
  theoryCard.tabIndex = 0;
  theoryCard.innerHTML = `
    <div class="mode-card__icon">📚</div>
    <div class="mode-card__title">Теория</div>
    <div class="mode-card__desc">Материалы по темам пройденных уровней. Открываются после прохождения пазла.</div>
    <div class="mode-card__progress">
      <span>${theoryStats.read}/${theoryStats.total}</span>
      <div class="mode-card__bar"><div class="mode-card__bar-inner" style="width:${Math.round((theoryStats.read/theoryStats.total)*100)}%"></div></div>
      <span>${Math.round((theoryStats.read/theoryStats.total)*100)}%</span>
    </div>
  `;
  const openTheory = () => navigate('theory');
  theoryCard.addEventListener('click', openTheory);
  theoryCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openTheory(); });
  theorySection.appendChild(theoryCard);
  container.appendChild(theorySection);

  // Projects section
  const projectStats = GameState.getProjectStats();
  const projectsSection = document.createElement('div');
  projectsSection.className = 'home-section';
  projectsSection.innerHTML = `
    <h3 class="home-section-title"><span class="home-section-icon">🏗️</span> Практические проекты</h3>
    <div class="home-section-stats">Начато: ${projectStats.started}/${projectStats.total} | Завершено: ${projectStats.completed}/${projectStats.total}</div>
  `;
  const projectCard = document.createElement('div');
  projectCard.className = 'card card-hover mode-card';
  projectCard.setAttribute('role', 'button');
  projectCard.tabIndex = 0;
  projectCard.innerHTML = `
    <div class="mode-card__icon">🏗️</div>
    <div class="mode-card__title">Проекты</div>
    <div class="mode-card__desc">Применяй знания на практике: создай полные диаграммы для реальных задач.</div>
    <div class="mode-card__progress">
      <span>${projectStats.started}/${projectStats.total}</span>
      <div class="mode-card__bar"><div class="mode-card__bar-inner" style="width:${projectStats.total > 0 ? Math.round((projectStats.started/projectStats.total)*100) : 0}%"></div></div>
      <span>${projectStats.total > 0 ? Math.round((projectStats.started/projectStats.total)*100) : 0}%</span>
    </div>
  `;
  const openProjects = () => navigate('projects');
  projectCard.addEventListener('click', openProjects);
  projectCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openProjects(); });
  projectsSection.appendChild(projectCard);
  container.appendChild(projectsSection);
}

// ------------------- levels -------------------
function renderLevels(mode) {
  const title = document.getElementById('levels-title');
  const grid = document.getElementById('levels-grid');
  title.textContent = `Уровни режима «${MODE_META[mode].label}»`;
  grid.innerHTML = '';

  LEVELS.forEach((level) => {
    const unlocked = GameState.isLevelUnlocked(level.id);
    const progress = GameState.getLevelProgress(level.id);
    const stars = '★'.repeat(progress.stars) + '☆'.repeat(3 - progress.stars);

    const card = document.createElement('div');
    card.className = `card level-card ${unlocked ? '' : 'locked'}`;
    card.setAttribute('role', unlocked ? 'button' : 'none');
    card.tabIndex = unlocked ? 0 : -1;
    card.innerHTML = `
      <div class="level-card__badge">${level.type}</div>
      <div class="level-card__title">${level.id}. ${level.title}</div>
      <div class="level-card__stars" aria-hidden="true">${stars}</div>
    `;

    if (unlocked) {
      const open = () => {
        const firstMode = MODES.find((m) => GameState.isModeUnlocked(level.id, m)) || 'puzzle';
        navigate('game', level.id, firstMode);
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(); });
    }

    grid.appendChild(card);
  });
}

function backToLevels() {
  const mode = current.mode || 'puzzle';
  navigate('levels', mode);
}

function restartGame() {
  if (!current.levelId || !current.mode) return;
  // Сбрасываем прогресс режима, чтобы можно было заработать звёзды
  GameState.resetModeProgress(current.levelId, current.mode);
  // Перезапускаем режим
  startGame(current.levelId, current.mode);
  showToast('Режим перезапущен! Постарайся решить без ошибок.', 'info');
}

// ------------------- game -------------------
function startGame(levelId, mode) {
  const level = getLevel(levelId);
  if (!level) {
    navigate('levels', 'puzzle');
    return;
  }

  if (!GameState.isLevelUnlocked(level.id)) {
    showToast('Этот уровень пока заблокирован', 'warning');
    navigate('levels', 'puzzle');
    return;
  }

  const safeMode = MODES.includes(mode) ? mode : 'puzzle';
  if (!GameState.isModeUnlocked(level.id, safeMode)) {
    const firstUnlocked = MODES.find((m) => GameState.isModeUnlocked(level.id, m));
    navigate('game', level.id, firstUnlocked);
    return;
  }

  if (current.instance && typeof current.instance.stop === 'function') {
    current.instance.stop();
  }

  current = { levelId: Number(levelId), mode: safeMode, instance: null, startTime: Date.now() };

  document.getElementById('game-title').textContent = `${level.id}. ${level.title}`;
  updateStars(level.id);
  updateTabs(level.id, safeMode);

  const area = document.getElementById('game-area');
  area.innerHTML = '';

  const mod = MODULES[safeMode];
  try {
    current.instance = mod.start(level, area, {
      onComplete: (opts) => onModeComplete(safeMode, opts)
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Ошибка запуска режима:', err);
    showToast('Не удалось запустить уровень. Попробуй перезайти в него.', 'error');
    return;
  }

  const checkBtn = document.getElementById('btn-check');
  const hintBtn = document.getElementById('btn-hint');
  const showAnswerBtn = document.getElementById('btn-show-answer');
  const restartBtn = document.getElementById('btn-restart');
  checkBtn.disabled = !current.instance?.check;
  hintBtn.disabled = !current.instance?.hint;
  showAnswerBtn.disabled = !current.instance?.showAnswer;
  restartBtn.disabled = false;
}

function updateStars(levelId) {
  const progress = GameState.getLevelProgress(levelId);
  document.getElementById('game-stars').textContent = '★'.repeat(progress.stars) + '☆'.repeat(3 - progress.stars);
}

function updateTabs(levelId, activeMode) {
  MODES.forEach((mode) => {
    const tab = document.getElementById(`tab-${mode}`);
    const isSelected = mode === activeMode;
    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    tab.disabled = !GameState.isModeUnlocked(levelId, mode);
    tab.classList.toggle('is-active', isSelected);
  });
}

function onModeComplete(mode, { usedHint = false, wrongAttempts = 0, showAnswer = false } = {}) {
  const elapsed = Math.floor((Date.now() - current.startTime) / 1000);
  const progress = GameState.completeMode(current.levelId, mode, { usedHint, timeSpent: elapsed, wrongAttempts, showAnswer });
  updateStars(current.levelId);
  updateTabs(current.levelId, mode);
  if (!showAnswer) confetti();

  const idx = MODES.indexOf(mode);
  const nextMode = MODES[idx + 1];

  if (nextMode && GameState.isModeUnlocked(current.levelId, nextMode)) {
    showModal(
      'Режим пройден! 🎉',
      `Ты успешно завершил режим «${MODE_META[mode].label}». Переходим к следующему?`,
      [
        { label: 'Продолжить', primary: true, onClick: () => { hideModal(); navigate('game', current.levelId, nextMode); } },
        { label: 'Остаться', onClick: () => {} }
      ]
    );
    return;
  }

  if (idx === MODES.length - 1) {
    const nextLevel = LEVELS.find((l) => l.id === current.levelId + 1);
    if (nextLevel && GameState.isLevelUnlocked(nextLevel.id)) {
      showModal(
        'Уровень завершён! 🏆',
        'Все режимы этого уровня пройдены. Готов к следующему?',
        [{ label: 'Дальше', primary: true, onClick: () => { hideModal(); navigate('game', nextLevel.id, 'puzzle'); } }]
      );
    } else {
      showModal(
        'Поздравляем!',
        'Ты прошёл все доступные уровни. Попробуй улучшить звёзды!',
        [{ label: 'На главную', primary: true, onClick: () => { hideModal(); navigate('home'); } }]
      );
    }
  }
}

// ------------------- theory -------------------
function renderTheory() {
  showScreen('screen-theory');
  const grid = document.getElementById('theory-grid');
  grid.innerHTML = '';

  THEORY.forEach((theory) => {
    const unlocked = GameState.isTheoryUnlocked(theory.id);
    const progress = GameState.getTheoryProgress(theory.id);
    const readBadge = progress.read ? ' <span class="theory-badge read">✓ Прочитано</span>' : '';

    const card = document.createElement('div');
    card.className = `card level-card ${unlocked ? '' : 'locked'}`;
    card.setAttribute('role', unlocked ? 'button' : 'none');
    card.tabIndex = unlocked ? 0 : -1;
    card.innerHTML = `
      <div class="level-card__badge">${theory.type}</div>
      <div class="level-card__title">${theory.icon} ${theory.title}${readBadge}</div>
      <div class="level-card__desc">Уровень ${theory.levelId} — ${theory.sections.length} раздела</div>
    `;

    if (unlocked) {
      const open = () => navigate('theory-detail', theory.id);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(); });
    }

    grid.appendChild(card);
  });
}

function renderTheoryDetail(theoryId) {
  const theory = getTheoryByLevel(theoryId);
  if (!theory) {
    navigate('theory');
    return;
  }

  if (!GameState.isTheoryUnlocked(theory.id)) {
    showToast('Эта теория пока недоступна. Пройди пазл уровня ${theory.levelId}.', 'warning');
    navigate('theory');
    return;
  }

  showScreen('screen-theory-detail');
  document.getElementById('theory-detail-title').textContent = `${theory.icon} ${theory.title}`;
  
  const content = document.getElementById('theory-content');
  content.innerHTML = theory.sections.map((section, idx) => `
    <div class="theory-section">
      <h3>${section.title}</h3>
      <div class="theory-section-content">${formatTheoryContent(section.content)}</div>
    </div>
  `).join('');

  // Mark as read
  GameState.markTheoryRead(theory.id);

  // Add "Mark Complete" button if not completed
  const progress = GameState.getTheoryProgress(theory.id);
  if (!progress.completed) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'theory-complete-btn';
    btnContainer.innerHTML = `
      <button id="btn-complete-theory" class="btn btn-primary" type="button">✓ Отметить как изученное</button>
    `;
    content.appendChild(btnContainer);
    document.getElementById('btn-complete-theory').addEventListener('click', () => {
      GameState.completeTheory(theory.id);
      showToast('Теория отмечена как изученная!', 'success');
      renderTheoryDetail(theory.id);
    });
  }
}

function formatTheoryContent(content) {
  // Convert markdown-like formatting to HTML
  return content
    .replace(/```plantuml\n([\s\S]*?)```/g, '<pre class="language-plantuml"><code>$1</code></pre>')
    .replace(/```\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/, '<p>$1</p>');
}

// ------------------- projects -------------------
function renderProjects() {
  showScreen('screen-projects');
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';

  PROJECTS.forEach((project) => {
    const unlocked = GameState.isProjectUnlocked(project.id);
    const progress = GameState.getProjectProgress(project.id);
    const completedBadge = progress.completed ? ' <span class="theory-badge completed">✓ Завершён</span>' : '';
    const startedBadge = progress.started && !progress.completed ? ' <span class="theory-badge in-progress">▶ В процессе</span>' : '';

    const card = document.createElement('div');
    card.className = `card level-card ${unlocked ? '' : 'locked'}`;
    card.setAttribute('role', unlocked ? 'button' : 'none');
    card.tabIndex = unlocked ? 0 : -1;
    card.innerHTML = `
      <div class="level-card__badge">${project.type}</div>
      <div class="level-card__title">${project.icon} ${project.title}${completedBadge}${startedBadge}</div>
      <div class="level-card__desc">${project.difficulty} • ~${project.estimatedTime} • ${project.description}</div>
    `;

    if (unlocked) {
      const open = () => navigate('project-detail', project.id);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(); });
    }

    grid.appendChild(card);
  });
}

function renderProjectDetail(projectId) {
  const project = getProjectById(projectId);
  if (!project) {
    navigate('projects');
    return;
  }

  if (!GameState.isProjectUnlocked(project.id)) {
    showToast('Этот проект пока недоступен. Изучи соответствующую теорию.', 'warning');
    navigate('projects');
    return;
  }

  showScreen('screen-project-detail');
  document.getElementById('project-detail-title').textContent = `${project.icon} ${project.title}`;

  const progress = GameState.getProjectProgress(project.id);
  if (!progress.started) {
    GameState.startProject(project.id);
  }

  const content = document.getElementById('project-content');
  content.innerHTML = `
    <div class="project-header">
      <div class="project-meta">
        <span class="project-difficulty">${project.difficulty}</span>
        <span class="project-time">⏱ ${project.estimatedTime}</span>
      </div>
      <div class="project-scenario">${project.scenario}</div>
      <div class="project-requirements">
        <h4>Требования:</h4>
        <ul>${project.requirements.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    </div>

    <div class="project-editor">
      <div class="project-editor-toolbar">
        <button id="btn-render-project" class="btn btn-primary" type="button">🔍 Рендерить</button>
        <button id="btn-check-project" class="btn btn-secondary" type="button">✓ Проверить</button>
        <button id="btn-download-project" class="btn btn-ghost" type="button">⬇ Скачать</button>
      </div>
      <div class="project-editor-split">
        <div class="editor-pane">
          <label for="project-code">PlantUML код</label>
          <textarea id="project-code" class="project-code-editor" spellcheck="false">${project.starterCode || '@startuml\n\n@enduml'}</textarea>
        </div>
        <div class="preview-pane">
          <label>Превью</label>
          <div id="project-preview" class="project-preview"></div>
        </div>
      </div>
      ${project.hints && project.hints.length > 0 ? `
        <details class="project-hints">
          <summary>💡 Подсказки</summary>
          <ul>${project.hints.map(h => `<li>${h}</li>`).join('')}</ul>
        </details>
      ` : ''}
      ${progress.completed ? '<div class="project-completed">✅ Проект завершён! Все диаграммы пройдены.</div>' : ''}
    </div>
  `;

  // Setup editor with PlantUML highlighting
  setupProjectEditor(project);
}

function setupProjectEditor(project) {
  const textarea = document.getElementById('project-code');
  const preview = document.getElementById('project-preview');
  const renderBtn = document.getElementById('btn-render-project');
  const checkBtn = document.getElementById('btn-check-project');
  const downloadBtn = document.getElementById('btn-download-project');

  let renderDebounce;
  const doRender = async () => {
    const code = textarea.value;
    preview.innerHTML = '<em>Рендеринг...</em>';
    try {
      const svg = await PlantUMLAPI.renderSVG(code);
      preview.innerHTML = svg || '<em class="error">Ошибка рендера. Проверьте синтаксис.</em>';
    } catch (e) {
      preview.innerHTML = `<em class="error">${e.message}</em>`;
    }
  };

  textarea.addEventListener('input', () => {
    clearTimeout(renderDebounce);
    renderDebounce = setTimeout(doRender, 800);
  });

  renderBtn.addEventListener('click', doRender);

  checkBtn.addEventListener('click', () => {
    const code = textarea.value;
    const validator = new PlantUMLValidator();
    const ast = validator.parse(code);
    
    // Check for expected patterns
    const missing = project.expectedPatterns.filter(p => !code.includes(p));
    
    if (missing.length === 0) {
      showToast('✅ Все обязательные элементы найдены!', 'success');
      // Mark this diagram type as completed
      const diagramType = project.type;
      GameState.completeProjectDiagram(project.id, diagramType);
      
      // Re-render to show completion
      setTimeout(() => renderProjectDetail(project.id), 500);
    } else {
      showToast(`❌ Не хватает: ${missing.join(', ')}`, 'warning');
    }
  });

  downloadBtn.addEventListener('click', () => {
    const code = textarea.value;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '-').toLowerCase()}.puml`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Initial render
  doRender();
}

// ------------------- routing & extras -------------------
function handleHash() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash) {
    showScreen('screen-home');
    renderHome();
    return;
  }

  const parts = hash.split('/');
  if (parts[0] === 'levels' && parts[1]) {
    showScreen('screen-levels');
    renderLevels(parts[1]);
  } else if (parts[0] === 'game' && parts[1]) {
    showScreen('screen-game');
    startGame(parts[1], parts[2] || 'puzzle');
  } else if (parts[0] === 'theory' && parts[1]) {
    showScreen('screen-theory-detail');
    renderTheoryDetail(parseInt(parts[1]));
  } else if (parts[0] === 'theory') {
    showScreen('screen-theory');
    renderTheory();
  } else if (parts[0] === 'project' && parts[1]) {
    showScreen('screen-project-detail');
    renderProjectDetail(parseInt(parts[1]));
  } else if (parts[0] === 'projects') {
    showScreen('screen-projects');
    renderProjects();
  } else {
    showScreen('screen-home');
    renderHome();
  }
}

function showAchievements(list) {
  const names = {
    perfectionist: 'Перфекционист',
    'code-master': 'Мастер кода'
  };
  list.forEach((key) => {
    showToast(`🏆 Достижение разблокировано: ${names[key] || key}`, 'success', 5000);
  });
}

function loadSharedDiagram() {
  try {
    const params = new URLSearchParams(location.search);
    const encoded = params.get('diagram');
    if (!encoded) return;
    const code = decodeURIComponent(escape(atob(encoded)));
    showModal(
      'Диаграмма из ссылки',
      `<pre style="background:var(--bg-primary);padding:1rem;border-radius:0.5rem;overflow:auto">${code.replace(/</g, '&lt;')}</pre>`,
      [{ label: 'Закрыть', primary: true }]
    );
  } catch {
    // ignore invalid share data
  }
}

init();
