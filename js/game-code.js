import { PlantUMLEditor, renderPreview } from './renderer.js';
import { PlantUMLValidator } from './validator.js';
import { showToast, showModal } from './ui.js';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function taskTitle(taskType) {
  const map = { write: 'Напиши с нуля', fill: 'Допиши', fix: 'Исправь', refactor: 'Рефакторинг' };
  return map[taskType] || 'Код';
}

export function start(level, container, callbacks) {
  const cfg = level.code;
  container.innerHTML = `
    <div class="task-block">
      <h3>${escapeHtml(taskTitle(cfg.taskType))}</h3>
      <p>${escapeHtml(cfg.task)}</p>
    </div>
    <div id="code-layout" class="code-layout"></div>
  `;

  const layout = container.querySelector('#code-layout');
  const previewEl = document.createElement('div');
  previewEl.className = 'preview';
  const startValue = cfg.template !== undefined && cfg.template !== null ? cfg.template : (cfg.broken || '');

  let renderTimer = null;
  let hintIndex = 0;
  let usedHint = false;
  let wrongAttempts = 0;

  const editor = new PlantUMLEditor(layout, { value: startValue, onChange: () => schedulePreview() });
  layout.appendChild(previewEl);

  renderPreview(previewEl, editor.getValue()).catch(() => {});

  function schedulePreview() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      renderPreview(previewEl, editor.getValue()).catch(() => {});
    }, 450);
  }

  async function checkCode() {
    try {
      editor.clearErrors();
      const code = editor.getValue();
      const validator = new PlantUMLValidator();
      const ast = validator.parse(code);
      const errors = validator.validateSyntax(ast, level.type);

      if (errors.length) {
        const list = errors.map((e) => `Строка ${e.line}: ${e.message}`).join('<br>');
        editor.setErrors(errors);
        showModal('Синтаксические ошибки', list, [{ label: 'Исправить', primary: true }]);
        return;
      }

      const expectedAst = validator.parse(cfg.expected);
      const sem = validator.compareSemantic(ast, expectedAst);

      if (sem.match) {
        showToast('Код верный!', 'success');
        editor.clearErrors();
        callbacks.onComplete({ usedHint, wrongAttempts });
      } else {
        wrongAttempts++;
        const diffHtml = sem.differences
          .map((d) => {
            if (d.kind === 'missing') return `<div>❌ Не хватает: <code>${escapeHtml(d.expected)}</code></div>`;
            return `<div>⚠️ Лишнее: <code>${escapeHtml(d.actual)}</code></div>`;
          })
          .join('');
        showModal('Есть расхождения', `<div style="margin-bottom:1rem">Твой код синтаксически правильный, но не совпадает с заданием.</div>${diffHtml}`, [
          { label: 'Посмотреть ожидаемый код', onClick: () => showExpected(validator, cfg.expected, ast), close: false },
          { label: 'Продолжить править', primary: true }
        ]);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ошибка в checkCode:', err);
      showToast('Не удалось проверить код. Проверь синтаксис и попробуй снова.', 'error');
    }
  }

  function showExpected(validator, expectedCode, userAst) {
    const expectedAst = validator.parse(expectedCode);
    const body = `
      <div style="margin-bottom:1rem"><strong>Ожидалось:</strong></div>
      <pre style="background:var(--bg-primary);padding:0.75rem;border-radius:0.5rem;overflow:auto">${escapeHtml(expectedCode)}</pre>
      <div style="margin:1rem 0"><strong>Получено:</strong></div>
      <pre style="background:var(--bg-primary);padding:0.75rem;border-radius:0.5rem;overflow:auto">${escapeHtml(editor.getValue())}</pre>
    `;
    showModal('Сравнение', body, [{ label: 'Закрыть', primary: true }]);
  }

  function showAnswer() {
    editor.setValue(cfg.expected);
    editor.clearErrors();
    renderPreview(previewEl, cfg.expected).catch(() => {});
    callbacks.onComplete({ usedHint: true, showAnswer: true });
  }

  function hint() {
    usedHint = true;
    if (hintIndex < cfg.hints.length) {
      showToast(cfg.hints[hintIndex++], 'info');
    } else {
      showToast('Подсказки закончились', 'warning');
    }
  }

  return {
    check: checkCode,
    hint,
    showAnswer,
    stop: () => {
      clearTimeout(renderTimer);
      container.innerHTML = '';
    }
  };
}
