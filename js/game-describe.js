import { renderPreview } from './renderer.js';
import { PlantUMLValidator } from './validator.js';
import { showToast, showModal } from './ui.js';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const TYPE_LABELS = {
  sequence: 'Диаграмма последовательности',
  class: 'Диаграмма классов',
  state: 'Диаграмма состояний',
  usecase: 'Диаграмма прецедентов'
};

const TYPE_OPTIONS = [
  { value: '', label: 'Выбери тип…' },
  { value: 'sequence', label: TYPE_LABELS.sequence },
  { value: 'class', label: TYPE_LABELS.class },
  { value: 'state', label: TYPE_LABELS.state },
  { value: 'usecase', label: TYPE_LABELS.usecase }
];

export function start(level, container, callbacks) {
  const d = level.describe;
  const state = { hintIndex: 0, usedHint: false, generatedCode: null, step: 1, wrongAttempts: 0 };

  if (d.kind === 'guided') {
    buildGuided(d, container, state, callbacks);
  } else {
    buildFree(d, container, state, callbacks);
  }

  return {
    showHint: () => showNextHint(d, state),
    hint: () => showNextHint(d, state),
    showAnswer: () => showAnswer(d, callbacks, state, container),
    stop: () => { container.innerHTML = ''; }
  };
}

function showNextHint(d, state) {
  state.usedHint = true;
  if (state.hintIndex < (d.hints || []).length) {
    showToast(d.hints[state.hintIndex++], 'info');
  } else {
    showToast(`Правильный тип — ${TYPE_LABELS[d.expectedType]}`, 'info');
  }
}

function showAnswer(d, callbacks, state, container) {
  const code = d.template || d.expected;
  state.generatedCode = code;

  // Показываем правильный ответ в контейнере
  const resultArea = container.querySelector('#describe-result') || container.querySelector('#free-preview');
  if (resultArea) {
    resultArea.hidden = false;
    resultArea.innerHTML = `<pre style="background:var(--bg-primary);padding:0.75rem;border-radius:0.5rem;overflow:auto;font-family:var(--font-mono);font-size:0.88rem">${escapeHtml(code)}</pre>`;
  } else {
    // Если контейнера нет, просто показываем код в модальном окне
    showModal('Правильный ответ', `<pre style="background:var(--bg-primary);padding:0.75rem;border-radius:0.5rem;overflow:auto;font-family:var(--font-mono)">${escapeHtml(code)}</pre>`, [
      { label: 'Закрыть', primary: true }
    ]);
  }

  callbacks.onComplete({ usedHint: true, showAnswer: true });
}

// ------------------- guided -------------------
function buildGuided(d, container, state, callbacks) {
  container.innerHTML = `
    <div class="describe-card">
      <div class="task-block">
        <h3>Сценарий</h3>
        <p>${escapeHtml(d.scenario)}</p>
      </div>
      <div>
        <label for="desc-type">Выбери тип диаграммы</label>
        <select id="desc-type">${TYPE_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join('')}</select>
      </div>
      <button id="desc-generate" class="btn btn-primary" type="button">Сгенерировать шаблон</button>
      <div id="template-area" class="template-blanks" hidden></div>
      <div id="describe-result" class="preview" hidden></div>
    </div>
  `;

  const typeSelect = container.querySelector('#desc-type');
  const generateBtn = container.querySelector('#desc-generate');
  const templateArea = container.querySelector('#template-area');
  const resultArea = container.querySelector('#describe-result');

  generateBtn.addEventListener('click', () => {
    if (typeSelect.value !== d.expectedType) {
      showToast(`Тип «${TYPE_OPTIONS.find((o) => o.value === typeSelect.value)?.label || '—'}» не подходит`, 'error');
      state.usedHint = true;
      return;
    }

    templateArea.hidden = false;
    buildTemplateInputs(d.template, templateArea, (code) => {
      state.generatedCode = code;
      resultArea.hidden = false;
      renderPreview(resultArea, code).catch(() => {});
      validateGeneratedCode(code, d, callbacks, state);
    });
    generateBtn.textContent = 'Проверить заполнение';
    generateBtn.disabled = true;
  });
}

function buildTemplateInputs(template, container, onFilled) {
  container.innerHTML = '';
  const parts = template.split('___');
  const inputs = [];

  const form = document.createElement('div');
  for (let i = 0; i < parts.length - 1; i++) {
    const text = document.createElement('span');
    text.style.fontFamily = 'var(--font-mono)';
    text.style.whiteSpace = 'pre';
    text.textContent = parts[i];
    form.appendChild(text);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'template-blank';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `blank #${i + 1}`;
    inputWrap.appendChild(input);
    form.appendChild(inputWrap);
    inputs.push(input);
  }
  const tail = document.createElement('span');
  tail.style.fontFamily = 'var(--font-mono)';
  tail.style.whiteSpace = 'pre';
  tail.textContent = parts[parts.length - 1];
  form.appendChild(tail);

  const checkBtn = document.createElement('button');
  checkBtn.type = 'button';
  checkBtn.className = 'btn btn-primary';
  checkBtn.textContent = 'Проверить код';
  checkBtn.addEventListener('click', () => {
    let code = template;
    for (const input of inputs) {
      code = code.replace('___', input.value.trim());
    }
    onFilled(code);
  });

  container.appendChild(form);
  container.appendChild(checkBtn);
}

// ------------------- free -------------------
function buildFree(d, container, state, callbacks) {
  container.innerHTML = `
    <div class="describe-card">
      <div class="task-block">
        <h3>Свободное описание</h3>
        <p>${escapeHtml(d.scenario)}</p>
      </div>
      <div>
        <label for="free-desc">Опиши диаграмму текстом</label>
        <textarea id="free-desc" placeholder="Например: Alice здоровается с Bob..."></textarea>
      </div>
      <button id="free-generate" class="btn btn-primary" type="button">Сгенерировать PlantUML</button>
      <div id="free-editor" class="editor-wrap" hidden></div>
      <div id="free-preview" class="preview" hidden></div>
      <button id="free-check" class="btn btn-primary" type="button" hidden>Подтвердить диаграмму</button>
    </div>
  `;

  const descInput = container.querySelector('#free-desc');
  const generateBtn = container.querySelector('#free-generate');
  const editorWrap = container.querySelector('#free-editor');
  const preview = container.querySelector('#free-preview');
  const checkBtn = container.querySelector('#free-check');

  generateBtn.addEventListener('click', async () => {
    const text = descInput.value.toLowerCase();
    const foundKeywords = d.keywords.filter((k) => text.includes(k.toLowerCase())).length;
    if (foundKeywords < Math.max(1, Math.ceil(d.keywords.length / 2))) {
      showToast('Описание слишком короткое или не содержит ключевых участников.', 'warning');
      return;
    }
    state.generatedCode = d.template;
    editorWrap.hidden = false;
    preview.hidden = false;
    checkBtn.hidden = false;
    editorWrap.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.className = 'editor__textarea';
    textarea.style.height = '200px';
    textarea.style.color = 'var(--text-primary)';
    textarea.value = d.template;
    textarea.addEventListener('input', () => { state.generatedCode = textarea.value; });
    editorWrap.appendChild(textarea);
    renderPreview(preview, d.template).catch(() => {});
  });

  checkBtn.addEventListener('click', () => {
    const code = state.generatedCode || '';
    renderPreview(preview, code).catch(() => {});
    validateGeneratedCode(code, d, callbacks, state);
  });
}

// ------------------- shared validation -------------------
function validateGeneratedCode(code, d, callbacks, state) {
  const validator = new PlantUMLValidator();
  const ast = validator.parse(code);
  const syn = validator.validateSyntax(ast, d.expectedType);
  if (syn.length) {
    showModal('Ошибки в сгенерированном коде', syn.map((e) => `Строка ${e.line}: ${e.message}`).join('<br>'), [{ label: 'Исправить', primary: true }]);
    return;
  }

  const lower = code.toLowerCase();
  const missing = d.keywords.filter((k) => !lower.includes(k.toLowerCase()));
  if (missing.length) {
    showToast(`Не хватает ключевых слов: ${missing.join(', ')}`, 'error');
    return;
  }

  showToast('Описание превращено в диаграмму!', 'success');
  callbacks.onComplete({ usedHint: state.usedHint, wrongAttempts: state.wrongAttempts });
}
