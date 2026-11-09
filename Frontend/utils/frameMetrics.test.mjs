import assert from 'node:assert/strict';
const { summarizeFrames } = await import('./frameMetrics.ts');
assert.deepEqual(summarizeFrames([16, 16, 18, 20, 60]), { samples: 5, medianMs: 18, p95Ms: 60, maxMs: 60, over32Ms: 1 });
assert.deepEqual(summarizeFrames([]), { samples: 0, medianMs: 0, p95Ms: 0, maxMs: 0, over32Ms: 0 });
assert.equal(summarizeFrames([NaN, -5, Infinity, 16]).samples, 1, 'invalid timestamps cannot distort the measurement');
