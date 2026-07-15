import { showToast, showModal } from './ui.js';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function start(level, container, callbacks) {
  const p = level.puzzle;
  container.innerHTML = `
    <p class="puzzle-intro">${escapeHtml(p.intro)}</p>
    <div id="puzzle-board" class="puzzle-board"></div>
  `;
  const board = container.querySelector('#puzzle-board');
  const state = { hintIndex: 0, usedHint: false, wrongAttempts: 0 };
  const api = { stop: () => { container.innerHTML = ''; } };

  if (p.kind === 'tiles') buildTiles(p, board, api, callbacks, state);
  else if (p.kind === 'reorder') buildReorder(p, board, api, callbacks, state);
  else if (p.kind === 'findbug') buildFindbug(p, board, api, callbacks, state);

  api.hint = () => {
    state.usedHint = true;
    if (state.hintIndex < p.hints.length) {
      showToast(p.hints[state.hintIndex++], 'info');
    } else {
      showToast('Подсказки закончились', 'warning');
    }
  };

  api.showAnswer = () => {
      const solution = p.solution || p.lines;
      if (p.kind === 'tiles') {
        // Размещаем плитки в правильном порядке
        const board = container.querySelector('#puzzle-board');
        const slotsWrap = board.querySelector('.puzzle-slots');
        const poolWrap = board.querySelector('.tiles-pool');
        const slots = slotsWrap.querySelectorAll('.slot');
        // Возвращаем все плитки в пул
        poolWrap.innerHTML = '';
        slots.forEach(s => { s.innerHTML = ''; });
        // Расставляем правильный порядок
        solution.forEach((tileId, i) => {
          const tileData = p.tiles.find(t => t.id === tileId);
          if (tileData && slots[i]) {
            const el = document.createElement('div');
            el.className = 'tile';
            el.dataset.id = tileData.id;
            el.textContent = tileData.text;
            el.style.opacity = '0.7';
            el.style.pointerEvents = 'none';
            slots[i].appendChild(el);
            slots[i].classList.add('is-occupied');
          }
        });
      } else if (p.kind === 'reorder') {
        const list = container.querySelector('.reorder-list');
        if (list) {
          const items = [...list.children];
          // Build a map of normalized text -> element for robust matching
          const itemMap = new Map();
          items.forEach(li => {
            const text = li.querySelector('span:last-child').textContent;
            const key = text.replace(/\s+/g, ' ').trim();
            if (!itemMap.has(key)) itemMap.set(key, []);
            itemMap.get(key).push(li);
          });
          // Reorder by solution
          solution.forEach(line => {
            const key = line.replace(/\s+/g, ' ').trim();
            const matches = itemMap.get(key);
            if (matches && matches.length > 0) {
              const li = matches.shift();
              list.appendChild(li);
            }
          });
          // Disable all items
          items.forEach(li => { li.style.opacity = '0.7'; li.style.pointerEvents = 'none'; });
        }
      } else if (p.kind === 'findbug') {
      const lines = container.querySelectorAll('.findbug-line');
      lines.forEach((line, idx) => {
        if (p.bugLineIndices.includes(idx)) {
          line.classList.add('selected');
          line.style.opacity = '1';
        } else {
          line.style.opacity = '0.5';
        }
        line.style.pointerEvents = 'none';
      });
    }
    callbacks.onComplete({ usedHint: true, showAnswer: true });
  };

  api.check = api.check || (() => showToast('Проверка не настроена для этого уровня', 'warning'));
  return api;
}

// ------------------- tiles -------------------
function buildTiles(p, board, api, callbacks, state) {
  const slotsWrap = document.createElement('div');
  slotsWrap.className = 'puzzle-slots';
  const poolWrap = document.createElement('div');
  poolWrap.className = 'tiles-pool';
  poolWrap.dataset.role = 'pool';

  const tiles = [...p.tiles].sort(() => Math.random() - 0.5);
  const slots = [];

  for (let i = 0; i < p.solution.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = i;
    slot.dataset.role = 'slot';
    enableDrop(slot, poolWrap, slots);
    slotsWrap.appendChild(slot);
    slots.push(slot);
  }

  for (const tile of tiles) {
    const el = createTile(tile);
    poolWrap.appendChild(el);
  }

  board.appendChild(slotsWrap);
  board.appendChild(poolWrap);

  api.check = () => {
    const current = slots.map((s) => s.firstElementChild?.dataset.id || null);
    if (current.includes(null)) {
      showToast('Заполни все слоты', 'warning');
      return;
    }
    if (JSON.stringify(current) === JSON.stringify(p.solution)) {
      showToast('Отлично, пазл собран!', 'success');
      callbacks.onComplete({ usedHint: state.usedHint, wrongAttempts: state.wrongAttempts });
    } else {
      state.wrongAttempts++;
      showModal('Пока не совпадает', 'Расположение плиток отличается от правильного. Попробуй ещё раз.', [{ label: 'Понял', primary: true }]);
    }
  };
}

function createTile(tile) {
  const el = document.createElement('div');
  el.className = 'tile';
  el.draggable = true;
  el.dataset.id = tile.id;
  el.textContent = tile.text;
  el.setAttribute('role', 'listitem');
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', tile.id);
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
  });
  return el;
}

let draggedId = null;

function enableDrop(zone, pool, slots) {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    const source = document.querySelector(`.tile[data-id="${CSS.escape(id)}"]`);
    if (!source) return;
    const existing = zone.firstElementChild;
    if (existing && existing !== source) {
      if (zone.dataset.role === 'slot') {
        // меняем местами
        const sourceParent = source.parentElement;
        sourceParent.appendChild(existing);
      }
    }
    zone.appendChild(source);
  });
}

// ------------------- reorder -------------------
function buildReorder(p, board, api, callbacks, state) {
  const list = document.createElement('ul');
  list.className = 'reorder-list';
  list.setAttribute('role', 'list');

  let draggedFrom = null;
  let draggedEl = null;

  p.lines.forEach((text, idx) => {
    const li = document.createElement('li');
    li.className = 'reorder-item';
    li.draggable = true;
    li.dataset.index = idx;
    li.innerHTML = `<span class="reorder-item__num">${idx + 1}</span><span>${escapeHtml(text)}</span>`;

    li.addEventListener('dragstart', (e) => {
      draggedFrom = [...list.children].indexOf(li);
      draggedEl = li;
      e.dataTransfer.effectAllowed = 'move';
      // Use setTimeout to allow the browser to create drag image before adding class
      setTimeout(() => li.classList.add('dragging'), 0);
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      // Remove all drag-over indicators
      list.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      draggedFrom = null;
      draggedEl = null;
    });

    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      // Remove previous indicators from all items
      list.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        if (el !== li) el.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      // Determine if cursor is in top or bottom half of the item
      const rect = li.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        li.classList.add('drag-over-top');
        li.classList.remove('drag-over-bottom');
      } else {
        li.classList.add('drag-over-bottom');
        li.classList.remove('drag-over-top');
      }
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    li.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      li.classList.remove('drag-over-top', 'drag-over-bottom');

      const from = draggedFrom;
      const to = [...list.children].indexOf(li);
      if (from === null || from === to) return;

      // Determine direction: drop above or below based on cursor position
      const rect = li.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const dropAbove = e.clientY < midY;

      // Calculate actual target index
      let targetIdx = to;
      if (!dropAbove && from < to) {
        // Dragging down: drop after the target
        targetIdx = to;
      } else if (dropAbove && from > to) {
        // Dragging up: drop before the target
        targetIdx = to;
      } else if (dropAbove && from < to) {
        // Dragging down but cursor in top half: drop before target
        targetIdx = to - 1;
      } else if (!dropAbove && from > to) {
        // Dragging up but cursor in bottom half: drop after target
        targetIdx = to + 1;
      }

      if (from === targetIdx) return;

      // FLIP animation: capture current positions of all items
      const children = [...list.children];
      const firstPositions = children.map(child => {
        const r = child.getBoundingClientRect();
        return { top: r.top, left: r.left };
      });

      // Perform the DOM move
      const moved = children[from];
      list.removeChild(moved);
      // Adjust target index if needed after removal
      let insertIdx = targetIdx;
      if (from < targetIdx) insertIdx--;
      if (insertIdx < 0) insertIdx = 0;
      if (insertIdx >= list.children.length) {
        list.appendChild(moved);
      } else {
        list.insertBefore(moved, list.children[insertIdx]);
      }

      // FLIP: calculate deltas and animate
      const newChildren = [...list.children];
      newChildren.forEach((child, i) => {
        const lastRect = child.getBoundingClientRect();
        const deltaY = firstPositions[children.indexOf(child)]?.top - lastRect.top || 0;
        if (Math.abs(deltaY) > 1) {
          child.style.transform = `translateY(${deltaY}px)`;
          child.style.transition = 'none';
          requestAnimationFrame(() => {
            child.style.transition = 'transform 0.25s ease';
            child.style.transform = '';
            child.addEventListener('transitionend', () => {
              child.style.transition = '';
              child.style.transform = '';
            }, { once: true });
          });
        }
      });

      // Add a brief highlight to the moved item
      moved.classList.add('reorder-item--just-moved');
      setTimeout(() => moved.classList.remove('reorder-item--just-moved'), 300);

      refreshNumbers(list);
    });

    list.appendChild(li);
  });

  board.appendChild(list);

  api.check = () => {
    const current = [...list.children].map((li) => li.querySelector('span:last-child').textContent);
    if (JSON.stringify(current.map((s) => s.trim())) === JSON.stringify(p.solution.map((s) => s.trim()))) {
      showToast('Порядок верный!', 'success');
      callbacks.onComplete({ usedHint: state.usedHint, wrongAttempts: state.wrongAttempts });
    } else {
      state.wrongAttempts++;
      showModal('Порядок не тот', 'Строки расположены неправильно. Перетащи их в верный порядок.', [{ label: 'Понял', primary: true }]);
    }
  };
}

function refreshNumbers(list) {
  [...list.children].forEach((li, idx) => {
    li.querySelector('.reorder-item__num').textContent = String(idx + 1);
  });
}

// ------------------- findbug -------------------
function buildFindbug(p, board, api, callbacks, state) {
  const bugs = new Set(p.bugLineIndices);
  const selected = new Set();
  const codeLines = p.code.split(/\r?\n/);

  const wrap = document.createElement('div');
  wrap.className = 'findbug-list';

  codeLines.forEach((line, idx) => {
    const el = document.createElement('div');
    el.className = 'findbug-line';
    el.dataset.index = idx;
    el.innerHTML = `<span class="findbug-line__num">${idx + 1}</span><span>${escapeHtml(line)}</span>`;
    el.addEventListener('click', () => {
      if (selected.has(idx)) {
        selected.delete(idx);
        el.classList.remove('selected');
      } else {
        selected.add(idx);
        el.classList.add('selected');
      }
    });
    wrap.appendChild(el);
  });

  board.appendChild(wrap);

  api.check = () => {
    const missing = [...bugs].filter((i) => !selected.has(i));
    const extra = [...selected].filter((i) => !bugs.has(i));
    if (missing.length === 0 && extra.length === 0) {
      showToast('Все ошибки найдены!', 'success');
      callbacks.onComplete({ usedHint: state.usedHint, wrongAttempts: state.wrongAttempts });
    } else if (missing.length > 0) {
      state.wrongAttempts++;
      showModal('Не все ошибки найдены', `Ты нашёл не все баги. Осталось найти: ${missing.length}. Попытка №${state.wrongAttempts}.`, [{ label: 'Понял', primary: true }]);
    } else {
      state.wrongAttempts++;
      showModal('Лишние пометки', `Некоторые строки выделены зря. Попытка №${state.wrongAttempts}.`, [{ label: 'Понял', primary: true }]);
    }
  };
}
