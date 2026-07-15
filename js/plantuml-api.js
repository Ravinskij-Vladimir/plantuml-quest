import { API_BASE } from './config.js';
const REQUEST_INTERVAL_MS = 1000;

let requestQueue = [];
let isProcessing = false;
let lastRequestTime = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (requestQueue.length) {
    const item = requestQueue.shift();
    const now = Date.now();
    const wait = Math.max(0, REQUEST_INTERVAL_MS - (now - lastRequestTime));
    if (wait > 0) await sleep(wait);

    lastRequestTime = Date.now();
    try {
      item.resolve(await item.fn());
    } catch (err) {
      item.reject(err);
    }
  }

  isProcessing = false;
}

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    runQueue();
  });
}

function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b);
  if (b < 36) return String.fromCharCode(55 + b);
  if (b < 62) return String.fromCharCode(61 + b);
  return b === 62 ? '-' : '_';
}

function encode64(data) {
  let result = '';
  for (let i = 0; i < data.length; i += 3) {
    const b1 = data.charCodeAt(i);
    const b2 = i + 1 < data.length ? data.charCodeAt(i + 1) : 0;
    const b3 = i + 2 < data.length ? data.charCodeAt(i + 2) : 0;
    const a = b1 >> 2;
    const b = ((b1 & 3) << 4) | (b2 >> 4);
    const c = ((b2 & 15) << 2) | (b3 >> 6);
    const d = b3 & 63;
    result +=
      encode6bit(a) +
      encode6bit(b) +
      (i + 1 < data.length ? encode6bit(c) : '-') +
      (i + 2 < data.length ? encode6bit(d) : '-');
  }
  return result;
}

export function encodePlantUML(text) {
  if (typeof window === 'undefined' || !window.pako) {
    throw new Error('Библиотека сжатия pako не загружена');
  }
  let deflated = window.pako.deflateRaw(text, { to: 'string' });
  // pako 2.x может вернуть Uint8Array вместо строки — конвертируем
  if (typeof deflated !== 'string') {
    deflated = String.fromCharCode.apply(null, deflated);
  }
  return encode64(deflated);
}

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

function cacheKey(code) {
  return `puml-svg-${hashString(code)}`;
}

export const PlantUMLAPI = {
  encodePlantUML,

  async renderSVG(code) {
    return enqueue(async () => {
      const key = cacheKey(code);
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) return cached;
      } catch {
        // sessionStorage может быть недоступен
      }

      const encoded = encodePlantUML(code);
      const url = `${API_BASE}/svg/${encoded}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`PlantUML вернул ${response.status}`);
      }

      const svg = await response.text();
      try {
        sessionStorage.setItem(key, svg);
      } catch {
        // ignore
      }
      return svg;
    });
  },

  renderPNG(code) {
    const encoded = encodePlantUML(code);
    return `${API_BASE}/png/${encoded}`;
  },

  async validate(code) {
    try {
      const svg = await this.renderSVG(code);
      return { valid: true, svg };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  },

  fallbackPreview(code) {
    return generateASCIIPreview(code);
  }
};

function generateASCIIPreview(code) {
  const lines = code.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const header = '+----------------------------+';
  const parts = [];

  // Sequence / generic arrows
  const arrowRe = /^(.+?)\s*(->>|-->|<--|<-|->|\.\.>|--\|>|<\|--|\*--|--\*|o--|--o)\s*(.+?)(?:\s*:\s*(.*))?$/;
  const rendered = [];
  let hasArrows = false;
  const names = new Set();

  lines.forEach((line) => {
    const m = line.match(arrowRe);
    if (!m) return;
    hasArrows = true;
    const from = m[1].trim();
    const arr = m[2].trim();
    const to = m[3].trim();
    const label = (m[4] || '').trim();
    names.add(from);
    names.add(to);
    rendered.push({ from, arr, to, label });
  });

  if (hasArrows && names.size <= 6) {
    const ordered = [...names];
    const widths = ordered.map((n) => Math.max(n.length, 12));
    const separator = widths.map((w) => '-'.repeat(w));
    parts.push(ordered.map((n, i) => n.padEnd(widths[i])).join('  '));
    parts.push(separator.map((s) => s).join('  '));
    rendered.forEach(({ from, arr, to, label }) => {
      const fi = ordered.indexOf(from);
      const ti = ordered.indexOf(to);
      if (fi === -1 || ti === -1) return;
      let arrow = arr.includes('<') ? '<' : '';
      arrow += '-'.repeat(Math.max(1, Math.abs(fi - ti) * 2 + 1));
      arrow += arr.includes('>') ? '>' : '';
      const row = Array(ordered.length).fill(' '.repeat(12));
      const min = Math.min(fi, ti);
      const max = Math.max(fi, ti);
      for (let i = min + 1; i < max; i++) {
        row[i] = '-'.repeat(widths[i]);
      }
      row[fi] = (fi < ti ? '' : arrow).padEnd(widths[fi]);
      row[ti] = (fi < ti ? arrow : '').padStart(widths[ti]);
      parts.push(row.map((s, i) => s.padEnd(widths[i])).join('  ') + (label ? `   [${label}]` : ''));
    });
    return [header, ...parts.map((s) => '| ' + s.padEnd(26) + ' |'), header].join('\n');
  }

  // Fallback: пронумерованный список элементов
  return [header, ...lines.map((l, i) => `| ${String(i + 1).padStart(2)}. ${l.slice(0, 22).padEnd(22)} |`), header].join('\n');
}
