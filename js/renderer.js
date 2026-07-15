import { PlantUMLAPI } from './plantuml-api.js';
import { showToast } from './ui.js';

const TOKEN_RE =
  /(?<comment>(?:\/'[^'/]*'\/|'.+))|(?<string>"[^"]*")|(?<arrow>(?:--?\||<\|--|\*--|--\*|o--|--o|->>|<--?|\.\.?>|<\.\.|->))(?![\w-])|(?<kw>\b(?:@startuml|@enduml|skinparam|title|participant|actor|class|interface|enum|abstract|state|usecase|package|rectangle|together|note|alt|else|opt|loop|group|end|activate|deactivate|left|right|up|down|direction|of|as|if|then|!define|!include)\b)/gi;

const TYPE_KEYWORDS = new Set([
  'class', 'interface', 'enum', 'state', 'usecase', 'participant', 'actor', 'package', 'rectangle'
]);

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightPlantUML(line) {
  if (!line) return '';
  let out = '';
  let last = 0;
  for (const m of line.matchAll(TOKEN_RE)) {
    out += escapeHtml(line.slice(last, m.index));
    const text = m[0];
    let cls = '';
    if (m.groups.comment) cls = 'token-comment';
    else if (m.groups.string) cls = 'token-string';
    else if (m.groups.arrow) cls = 'token-arrow';
    else if (m.groups.kw) {
      cls = TYPE_KEYWORDS.has(m.groups.kw.toLowerCase()) ? 'token-type' : 'token-keyword';
    }
    out += `<span class="${cls}">${escapeHtml(text)}</span>`;
    last = m.index + m[0].length;
  }
  out += escapeHtml(line.slice(last));
  return out;
}

function highlightLines(code, errorLines = new Set()) {
  const lines = code.split('\n');
  return lines
    .map((line, idx) => {
      const highlighted = highlightPlantUML(line);
      const errClass = errorLines.has(idx + 1) ? ' is-error' : '';
      return `<div class="editor__line${errClass}">${highlighted || '\u00A0'}</div>`;
    })
    .join('');
}

export function formatPlantUML(code) {
  const lines = code.split(/\r?\n/);
  let indent = 0;
  const out = [];
  for (let raw of lines) {
    const trimmed = raw.trim();
    if (trimmed.endsWith('}')) {
      indent = Math.max(0, indent - 1);
    }
    out.push('  '.repeat(indent) + trimmed);
    if (trimmed.endsWith('{')) {
      indent += 1;
    }
  }
  return out.join('\n');
}

export class PlantUMLEditor {
  constructor(container, options = {}) {
    this.onChange = options.onChange || (() => {});
    this._errorLines = new Set();
    this.build(container);
    this.setValue(options.value || '');
  }

  build(container) {
    this.wrap = document.createElement('div');
    this.wrap.className = 'editor-wrap';

    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.justifyContent = 'flex-end';
    toolbar.style.gap = '0.5rem';

    const formatBtn = document.createElement('button');
    formatBtn.type = 'button';
    formatBtn.className = 'btn btn-secondary';
    formatBtn.textContent = 'Форматировать';
    formatBtn.addEventListener('click', () => this.format());
    toolbar.appendChild(formatBtn);

    this.editor = document.createElement('div');
    this.editor.className = 'editor';

    this.numbers = document.createElement('div');
    this.numbers.className = 'editor__numbers';

    this.highlight = document.createElement('div');
    this.highlight.className = 'editor__highlight';

    this.textarea = document.createElement('textarea');
    this.textarea.className = 'editor__textarea';
    this.textarea.spellcheck = false;
    this.textarea.setAttribute('autocomplete', 'off');
    this.textarea.setAttribute('autocorrect', 'off');
    this.textarea.setAttribute('autocapitalize', 'off');
    this.textarea.setAttribute('aria-label', 'Редактор PlantUML-кода');

    this.editor.append(this.numbers, this.highlight, this.textarea);
    this.wrap.append(toolbar, this.editor);
    container.appendChild(this.wrap);

    this.textarea.addEventListener('input', () => this.update());
    this.textarea.addEventListener('scroll', () => this.syncScroll());
    this.textarea.addEventListener('keydown', (e) => this.handleKey(e));

    // После загрузки моноширинного шрифта пересчитываем подсветку,
    // чтобы метрики textarea и highlight совпали.
    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.update();
      });
    }
  }

  syncScroll() {
    this.highlight.scrollTop = this.textarea.scrollTop;
    this.highlight.scrollLeft = this.textarea.scrollLeft;
    this.numbers.scrollTop = this.textarea.scrollTop;
  }

  update() {
    const value = this.textarea.value;
    this.highlight.innerHTML = highlightLines(value, this._errorLines);
    this.updateNumbers();
    this.onChange(value);
  }

  updateNumbers() {
    const count = (this.textarea.value.match(/\n/g) || []).length + 1;
    const html = Array.from({ length: count }, (_, i) => `<div class="editor__number">${i + 1}</div>`).join('');
    this.numbers.innerHTML = html;
  }

  handleKey(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      this.insertText('  ');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const start = this.textarea.selectionStart;
      const before = this.textarea.value.slice(0, start);
      const lineStart = before.lastIndexOf('\n') + 1;
      const currentLine = before.slice(lineStart);
      const indent = currentLine.match(/^[ \t]*/)[0];
      let extra = '';
      if (currentLine.trim().endsWith('{')) extra = '  ';
      this.insertText('\n' + indent + extra);
      return;
    }

    if (e.key === '}' || e.key === 'e' /* placeholder for end */) {
      // Авто-убираем лишний отступ при закрывающем элементе
      // не реализовано для простоты
    }
  }

  insertText(text) {
    const el = this.textarea;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    this.update();
  }

  setErrors(errorInfos) {
    this._errorLines = new Set((errorInfos || []).map((e) => e.line).filter(Boolean));
    this.update();
  }

  clearErrors() {
    this._errorLines = new Set();
    this.update();
  }

  getValue() {
    return this.textarea.value;
  }

  setValue(value) {
    this.textarea.value = value;
    this.clearErrors();
    this.update();
  }

  focus() {
    this.textarea.focus();
  }

  format() {
    this.setValue(formatPlantUML(this.getValue()));
    this.focus();
  }
}

export async function renderPreview(container, code) {
  container.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'preview__toolbar';

  const btnSvg = document.createElement('button');
  btnSvg.type = 'button';
  btnSvg.className = 'btn btn-secondary';
  btnSvg.textContent = 'SVG';
  btnSvg.addEventListener('click', () => downloadDiagram(code, 'svg'));

  const btnPng = document.createElement('button');
  btnPng.type = 'button';
  btnPng.className = 'btn btn-secondary';
  btnPng.textContent = 'PNG';
  btnPng.addEventListener('click', () => downloadDiagram(code, 'png'));

  const btnShare = document.createElement('button');
  btnShare.type = 'button';
  btnShare.className = 'btn btn-secondary';
  btnShare.textContent = 'Поделиться';
  btnShare.addEventListener('click', () => shareDiagram(code));

  toolbar.append(btnSvg, btnPng, btnShare);

  const content = document.createElement('div');
  content.className = 'preview__content';
  content.innerHTML = '<div class="preview__loader">Загрузка превью…</div>';

  container.append(toolbar, content);

  try {
    const svg = await PlantUMLAPI.renderSVG(code);
    content.innerHTML = svg;
  } catch (err) {
    console.error('[renderPreview] ошибка:', err);
    const ascii = PlantUMLAPI.fallbackPreview(code);
    content.innerHTML = `<div class="preview__loader" style="margin-bottom:0.5rem">Сервер недоступен — ASCII-превью</div><pre>${escapeHtml(ascii)}</pre>`;
  }
}

async function downloadDiagram(code, format) {
  try {
    if (format === 'svg') {
      const svg = await PlantUMLAPI.renderSVG(code);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      triggerDownload(blob, 'diagram.svg');
    } else {
      const url = PlantUMLAPI.renderPNG(code);
      const response = await fetch(url);
      if (!response.ok) throw new Error('PlantUML ' + response.status);
      const blob = await response.blob();
      triggerDownload(blob, 'diagram.png');
    }
  } catch (err) {
    showToast('Ошибка загрузки диаграммы: ' + err.message, 'error');
  }
}

function triggerDownload(blob, filename) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function shareDiagram(code) {
  try {
    const encoded = btoa(unescape(encodeURIComponent(code)));
    const url = new URL(location.href);
    url.searchParams.set('diagram', encoded);
    const shareUrl = url.toString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => showToast('Ссылка с диаграммой скопирована', 'success'));
    } else {
      showToast(shareUrl, 'info', 6000);
    }
  } catch (err) {
    showToast('Не удалось создать ссылку: ' + err.message, 'error');
  }
}
