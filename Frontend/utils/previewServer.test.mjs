import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const { resolvePreviewFile } = await import('../scripts/preview-server.mjs');
const root = await mkdtemp(path.join(tmpdir(), 'stayfinder-preview-test-'));
try {
  await mkdir(path.join(root, 'room'), { recursive: true });
  await mkdir(path.join(root, '_expo/static/js'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<h1>Home</h1>');
  await writeFile(`${root}.html`, 'Outside the export directory');
  await writeFile(path.join(root, 'room/villa-azure.html'), '<h1>Villa Azure</h1>');
  await writeFile(path.join(root, '_expo/static/js/app.js'), 'console.log("demo")');
  assert.equal((await resolvePreviewFile(root, '/?measureMotion=1')).file, path.join(root, 'index.html'));
  assert.equal((await resolvePreviewFile(root, '/room/villa-azure')).file, path.join(root, 'room/villa-azure.html'), 'direct room links resolve their own exported HTML');
  assert.equal((await resolvePreviewFile(root, '/_expo/static/js/app.js')).immutable, true, 'hashed Expo assets can be cached');
  assert.equal((await resolvePreviewFile(root, '/')).immutable, false, 'HTML must be revalidated after changes');
  assert.equal(await resolvePreviewFile(root, '/%2e%2e%2fpackage.json'), null, 'requests cannot escape the export directory');
  assert.equal(await resolvePreviewFile(root, '/%broken'), null);
  assert.equal(await resolvePreviewFile(root, '/missing'), null);
} finally {
  await rm(root, { recursive: true, force: true });
  await rm(`${root}.html`, { force: true });
}
