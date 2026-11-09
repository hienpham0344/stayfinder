import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

export async function resolvePreviewFile(directory, requestUrl) {
  const root = path.resolve(directory);
  let pathname;
  try { pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname); } catch { return null; }
  if (pathname.includes('\0')) return null;
  const base = path.resolve(root, `.${pathname}`);
  if (base !== root && !base.startsWith(`${root}${path.sep}`)) return null;
  for (const file of [base, `${base}.html`, path.join(base, 'index.html')]) {
    if (!file.startsWith(`${root}${path.sep}`)) continue;
    try {
      const info = await stat(file);
      if (info.isFile()) return { file, size: info.size, immutable: pathname.startsWith('/_expo/static/') || pathname.startsWith('/assets/') };
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    }
  }
  return null;
}

export function createPreviewServer(directory) {
  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
    try {
      let target = await resolvePreviewFile(directory, request.url ?? '/');
      const status = target ? 200 : 404;
      target ??= await resolvePreviewFile(directory, '/+not-found');
      if (!target) { response.writeHead(404); response.end('Not found'); return; }
      response.writeHead(status, {
        'Content-Type': MIME[path.extname(target.file)] ?? 'application/octet-stream',
        'Content-Length': target.size,
        'Cache-Control': target.immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      if (request.method === 'HEAD') { response.end(); return; }
      const stream = createReadStream(target.file);
      stream.on('error', () => response.destroy());
      stream.pipe(response);
    } catch { response.writeHead(500); response.end('Unable to serve preview'); }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const directory = path.resolve(process.argv[2] ?? 'dist');
  const port = Number(process.argv[3] ?? 8082);
  if (!await resolvePreviewFile(directory, '/')) throw new Error('Export the web app before starting the preview.');
  const server = createPreviewServer(directory);
  server.on('error', (error) => { console.error(`Preview server: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`StayFinder production preview: http://localhost:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
