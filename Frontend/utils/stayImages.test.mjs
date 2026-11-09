import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Exercise the catalog's asset resolution without booting the native renderer.
const require = createRequire(import.meta.url);
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const localRequire = (id) => {
    if (!id.startsWith('.')) return require(id);
    const resolved = path.resolve(path.dirname(filename), id);
    if (/\.(png|jpe?g)$/.test(resolved)) {
      assert.ok(readFileSync(resolved).length > 0, `image must be readable: ${id}`);
      return resolved;
    }
    return load(`${resolved}.ts`);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const { STAY_CATALOG, findStay, stayImage, stayGallery } = load(fileURLToPath(new URL('../constants/stayCatalog.ts', import.meta.url)));
for (const stay of STAY_CATALOG) assert.equal(typeof stayImage(stay), 'string', `${stay.id} has an offline catalog photo`);
const villa = findStay('villa-azure');
assert.match(stayImage(villa, 'azure-suite'), /premium-suite\.jpeg$/, 'checkout and confirmation must show the selected suite');
assert.match(stayImage(villa, 'azure-deluxe'), /deluxe-ocean-view\.jpeg$/, 'the deluxe tier has its own photo');
assert.equal(stayImage(findStay('le-marais-loft'), 'azure-suite'), stayImage(findStay('le-marais-loft')), 'a foreign room ID cannot replace a property photo');
assert.equal(typeof stayGallery, 'function', 'gallery sources belong to the shared catalog');
assert.equal(stayGallery(villa).length, 3, 'the villa retains its three local photos');
for (const stay of STAY_CATALOG.filter((item) => item.id !== 'villa-azure')) {
  assert.equal(stayGallery(stay)[0], stayImage(stay), `${stay.id} gallery must start with its own cover`);
  assert.ok(stayGallery(stay).every((source) => typeof source === 'string'), 'gallery images must be available offline');
}
