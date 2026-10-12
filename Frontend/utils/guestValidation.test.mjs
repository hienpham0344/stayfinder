import assert from 'node:assert/strict';
import test from 'node:test';
import { validateGuest } from './guestValidation.ts';

test('rejects missing guest details', () => {
  const errors = validateGuest(' ', '', '');
  assert.ok(errors.name);
  assert.ok(errors.email);
  assert.ok(errors.phone);
});

test('rejects malformed email and phone', () => {
  const errors = validateGuest('Nguyễn Minh Anh', 'minh@', '123');
  assert.equal(errors.name, '');
  assert.ok(errors.email);
  assert.ok(errors.phone);
});

test('accepts Vietnamese name, email and phone with spaces', () => {
  assert.deepEqual(validateGuest(' Nguyễn Minh Anh ', 'minh@example.vn', '098 765 4321'), {
    name: '', email: '', phone: '',
  });
});
