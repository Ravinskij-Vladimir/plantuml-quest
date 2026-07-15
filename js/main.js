import { GameState } from './state.js';
import { LEVELS, getLevel } from './levels.js';
import { initUI, showToast, showModal, hideModal, confetti } from './ui.js';
import { initAccessibility } from './accessibility.js';
import * as GamePuzzle from './game-puzzle.js';
import * as GameCode from './game-code.js';
import * as GameDescribe from './game-describe.js';

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
    container.appendChild(card);
  });
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
