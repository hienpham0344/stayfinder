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


test('phone accepts optional plus and 9 to 15 digits while rejecting punctuation and oversize fields',()=>{
 assert.equal(validateGuest('Guest','g@example.test','+123456789012345').phone,'');
 assert.equal(validateGuest('Guest','g@example.test','123456789012').phone,'');
 assert.ok(validateGuest('Guest','g@example.test','+1234567890123456').phone);
 assert.ok(validateGuest('Guest','g@example.test','123-456-789').phone);
 assert.ok(validateGuest('x'.repeat(101),'g@example.test','123456789').name);
 assert.ok(validateGuest('Guest','x'.repeat(250)+'@a.test','123456789').email);
});
