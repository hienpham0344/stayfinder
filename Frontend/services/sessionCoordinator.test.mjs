import assert from 'node:assert/strict';
import test from 'node:test';
import { SessionCoordinator } from './sessionCoordinator.ts';

const session = (id = 'a', token = 'access-a', refresh = 'refresh-a') => ({
  accessToken: token, tokenType: 'Bearer', expiresAt: '2026-11-01T00:00:00Z', sessionId: 'session-' + id, refreshToken: refresh,
  user: { id, fullName: id, email: id + '@example.com', role: 'customer', phone: null, avatarUrl: null, loyaltyPoints: 0, loyaltyTier: 0 },
});
function fixture(overrides = {}, kind = 'native') {
  let stored = null; let clears = 0; let refreshCalls = 0;
  const store = { kind, readRefresh: async () => stored, writeRefresh: async v => { stored = v; }, clearRefresh: async () => { stored = null; clears++; } };
  const auth = { login: async () => session(), register: async () => session(), logout: async () => {},
    refresh: async () => { refreshCalls++; return session('a', 'access-new', 'refresh-new'); }, ...overrides };
  return { coordinator: new SessionCoordinator({ auth, store, retryWait: async () => {} }), stored: () => stored, clears: () => clears,
    refreshCalls: () => refreshCalls, seed: v => { stored = v; } };
}

test('login persists only refresh credential and exposes access in memory', async () => {
  const f = fixture(); await f.coordinator.login({ email: 'a@example.com', password: 'Password9' });
  assert.equal(f.stored(), 'refresh-a'); assert.equal(f.coordinator.getAccessToken(), 'access-a'); assert.equal(f.coordinator.getUser()?.id, 'a');
});

test('single-flight rotation persists replacement exactly once', async () => {
  const f = fixture(); await f.coordinator.login({ email: 'a@example.com', password: 'Password9' });
  await Promise.all([f.coordinator.refresh(), f.coordinator.refresh()]);
  assert.equal(f.refreshCalls(), 1); assert.equal(f.stored(), 'refresh-new'); assert.equal(f.coordinator.getAccessToken(), 'access-new');
});

test('failed refresh clears credentials and notifies user state consumers', async () => {
  const f = fixture({ refresh: async () => { throw Object.assign(new Error('Expired'), { code: 'SESSION_EXPIRED' }); } });
  await f.coordinator.login({ email: 'a@example.com', password: 'Password9' });
  const states = []; f.coordinator.subscribe(() => states.push(f.coordinator.getUser()));
  await assert.rejects(f.coordinator.refresh()); await f.coordinator.flushStorage();
  assert.equal(f.coordinator.getUser(), null); assert.equal(f.coordinator.getAccessToken(), null); assert.equal(f.stored(), null);
  assert.equal(states.at(-1), null);
});

test('late refresh cannot resurrect a logged-out user or persisted credential', async () => {
  let resolve, markStarted; const pending = new Promise(r => { resolve = r; });
  const started = new Promise(r => { markStarted = r; });
  const f = fixture({ refresh: async () => { markStarted(); return pending; } });
  await f.coordinator.login({ email: 'a@example.com', password: 'Password9' });
  const refreshing = f.coordinator.refresh();
  await started; const rejected = assert.rejects(refreshing);
  const loggingOut = f.coordinator.logout(); resolve(session('a', 'late', 'late-refresh'));
  await loggingOut; await rejected; await f.coordinator.flushStorage();
  assert.equal(f.stored(), null); assert.equal(f.coordinator.getUser(), null);
});

test('refresh grace conflict retries once with the updated credential', async () => {
  let attempts = 0;
  const f = fixture({ refresh: async () => {
    attempts++; if (attempts === 1) throw Object.assign(new Error('Winner in progress'), { code: 'REFRESH_RETRY' });
    return session('a', 'winner', 'winner-refresh');
  } });
  await f.coordinator.login({ email: 'a@example.com', password: 'Password9' }); await f.coordinator.refresh();
  assert.equal(attempts, 2); assert.equal(f.coordinator.getAccessToken(), 'winner');
});

test('web never persists a refresh token from JSON', async () => {
  const f = fixture({}, 'web'); await f.coordinator.login({ email: 'a@example.com', password: 'Password9' });
  assert.equal(f.stored(), null); assert.equal(f.coordinator.getAccessToken(), 'access-a');
});

test('native bootstrap with no refresh stays signed out without a network request', async () => {
  const f = fixture(); await f.coordinator.bootstrap();
  assert.equal(f.refreshCalls(), 0); assert.equal(f.coordinator.getUser(), null);
});

test('reload bootstrap restores a valid native session by rotating stored refresh', async () => {
  const f = fixture(); f.seed('old-refresh'); await f.coordinator.bootstrap();
  assert.equal(f.refreshCalls(), 1); assert.equal(f.coordinator.getUser()?.id, 'a'); assert.equal(f.stored(), 'refresh-new');
});

test('logout clears local data even when server revocation cannot be reached', async () => {
  const f = fixture({ logout: async () => { throw new Error('Network unavailable'); } });
  await f.coordinator.login({ email: 'a@example.com', password: 'Password9' });
  const oldGeneration = f.coordinator.getGeneration(); await assert.rejects(f.coordinator.logout());
  assert.ok(f.coordinator.getGeneration() > oldGeneration); assert.equal(f.coordinator.getUser(), null); assert.equal(f.stored(), null);
});

test('failed secure-store write clears partially persisted login credentials', async () => {
  let saved = null;
  const coordinator = new SessionCoordinator({
    auth: { login: async () => session(), register: async () => session(), refresh: async () => session(), logout: async () => {} },
    store: { kind: 'native', readRefresh: async () => saved,
      writeRefresh: async v => { saved = v; throw new Error('Storage failed'); }, clearRefresh: async () => { saved = null; } },
  });
  await assert.rejects(coordinator.login({ email: 'a@example.com', password: 'Password9' }));
  await coordinator.flushStorage();
  assert.equal(saved, null); assert.equal(coordinator.getUser(), null);
});
