import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAuthInput, safeAuthReturnRoute } from './authValidation.ts';
test('registration requires a name and counts password UTF-8 bytes', () => {
  assert.ok(validateAuthInput('create', ' ', 'name@example.com', 'Password9'));
  assert.ok(validateAuthInput('create', 'Hien', 'name@example.com', 'é'.repeat(37)));
  assert.equal(validateAuthInput('create', 'Nguyễn Minh', 'name@example.com', ' Password9 '), '');
});
test('login rejects missing or malformed credentials', () => {
  assert.ok(validateAuthInput('login', '', 'name@', 'Password9'));
  assert.ok(validateAuthInput('login', '', 'name@example.com', ''));
  assert.equal(validateAuthInput('login', '', ' NAME@example.com ', 'Password9'), '');
});
test('return navigation accepts internal routes and rejects external or auth loops', () => {
  assert.equal(safeAuthReturnRoute('/booking/checkout?roomId=abc'), '/booking/checkout?roomId=abc');
  for (const path of ['https://evil.example', '//evil.example', '/\\evil.example', '/auth/demo', '/auth/demo?mode=login']) {
    assert.equal(safeAuthReturnRoute(path), '/');
  }
});
