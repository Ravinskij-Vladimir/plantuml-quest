import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Настройки ---
const PORT = process.env.PORT || 3000;
const PLANTUML_HOST = process.env.PLANTUML_HOST || 'localhost';
const PLANTUML_PORT = process.env.PLANTUML_PORT || 8080;
// -----------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function proxyToPlantUML(req, res) {
  const options = {
    hostname: PLANTUML_HOST,
    port: PLANTUML_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${PLANTUML_HOST}:${PLANTUML_PORT}` },
  };

  const proxy = http.request(options, (upstream) => {
    const contentType = upstream.headers['content-type'] || '';
    const isSvg = contentType.includes('svg');

    // Собираем SVG-тело целиком, чтобы переписать относительные пути
    if (isSvg) {
      const chunks = [];
      upstream.on('data', (chunk) => chunks.push(chunk));
      upstream.on('end', () => {
        let body = Buffer.concat(chunks).toString('utf-8');
        // Переписываем относительные ссылки на абсолютные через PlantUML-сервер
        const base = `http://${PLANTUML_HOST}:${PLANTUML_PORT}`;
        body = body.replace(/(href|src|d|fill|url\()="(\/[a-z])/gi, `$1="${base}$2`);
        const headers = { ...upstream.headers };
        delete headers['content-length'];
        headers['content-type'] = 'image/svg+xml; charset=utf-8';
        res.writeHead(upstream.statusCode, headers);
        res.end(body);
      });
    } else {
      res.writeHead(upstream.statusCode, upstream.headers);
      upstream.pipe(res);
    }
  });

  proxy.on('error', (err) => {
    console.error('PlantUML proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('PlantUML server недоступен');
  });

  req.pipe(proxy);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);

  // Защита от path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end();
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Проксируем запросы к PlantUML (SVG, ассеты, стили)
  if (
    req.url.startsWith('/svg/') ||
    req.url.startsWith('/png/') ||
    req.url.startsWith('/min/') ||
    req.url.startsWith('/assets/')
  ) {
    return proxyToPlantUML(req, res);
  }
  // Всё остальное — статика
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`✅  Frontend + PlantUML proxy → http://localhost:${PORT}`);
  console.log(`   PlantUML backend          → http://${PLANTUML_HOST}:${PLANTUML_PORT}`);
});
