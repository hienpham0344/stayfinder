import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiClient, ApiError } from './apiClient.ts';
import { SessionCoordinator } from './sessionCoordinator.ts';

const envelope = (result, status = 200) => new Response(JSON.stringify({ code: 'SUCCESS', message: 'Success', result }), { status });
const failure = (code, status) => new Response(JSON.stringify({ code, message: 'Request failed', status }), { status });
const authSession = (access = 'old') => ({
  accessToken: access, tokenType: 'Bearer', expiresAt: '2026-11-01T00:00:00Z', sessionId: 'session-a', refreshToken: 'refresh-a',
  user: { id: 'user-a', fullName: 'A', email: 'a@example.com', role: 'customer', phone: null, avatarUrl: null, loyaltyPoints: 0, loyaltyTier: 0 },
});
async function fixture(fetch) {
  let stored = null, refreshes = 0;
  const session = new SessionCoordinator({
    store: { kind: 'native', readRefresh: async () => stored, writeRefresh: async v => { stored = v; }, clearRefresh: async () => { stored = null; } },
    auth: { login: async () => authSession(), register: async () => authSession(), logout: async () => {},
      refresh: async () => { refreshes++; await Promise.resolve(); return authSession('new'); } },
  });
  await session.login({ email: 'a@example.com', password: 'Password9' });
  return { session, client: new ApiClient({ baseUrl: 'https://api.example/api', platform: 'native', session, fetch }), refreshes: () => refreshes };
}

test('default browser fetch is invoked with its global receiver', async () => {
 const original = globalThis.fetch;
 try {
  globalThis.fetch = function () {
   assert.equal(this, globalThis);
   return Promise.resolve(envelope({ ok: true }));
  };
  const client = new ApiClient({ baseUrl: 'https://api.example', platform: 'web' });
  assert.deepEqual(await client.request('/api/catalog/filters', { auth: false }), { ok: true });
 } finally { globalThis.fetch = original; }
});

test('concurrent 401s share one refresh and unwrap successful results', async () => {
  const f = await fixture(async (url, init) => init.headers.Authorization === 'Bearer new' ? envelope({ path: url }) : failure('UNAUTHORIZED', 401));
  const result = await Promise.all([f.client.request('/users/me'), f.client.request('/favorites')]);
  assert.equal(f.refreshes(), 1); assert.equal(result.length, 2);
  assert.equal(result[0].path, 'https://api.example/api/users/me');
});

test('mutation replay keeps the original key and serialized body', async () => {
  const calls = []; const body = { quoteId: 'q1' };
  const f = await fixture(async (url, init) => {
    calls.push({ body: init.body, key: init.headers['Idempotency-Key'] });
    if (calls.length === 1) { body.quoteId = 'q2'; return failure('UNAUTHORIZED', 401); }
    return envelope({ id: 'booking-a' });
  });
  assert.deepEqual(await f.client.request('/bookings', { method: 'POST', body, idempotencyKey: 'same-key' }), { id: 'booking-a' });
  assert.deepEqual(calls, [{ body: '{"quoteId":"q1"}', key: 'same-key' }, { body: '{"quoteId":"q1"}', key: 'same-key' }]);
});

test('403 never triggers refresh', async () => {
  const f = await fixture(async () => failure('FORBIDDEN', 403));
  await assert.rejects(f.client.request('/admin/demo'), e => e instanceof ApiError && e.status === 403);
  assert.equal(f.refreshes(), 0);
});

test('POST without an idempotency key is not automatically replayed', async () => {
  let calls = 0; const f = await fixture(async () => { calls++; return failure('UNAUTHORIZED', 401); });
  await assert.rejects(f.client.request('/auth/password', { method: 'POST', body: { newPassword: 'NewPass9' } }),
    e => e.code === 'AUTH_RETRY_REQUIRED');
  assert.equal(calls, 1);
});

test('logout prevents publication of a previous user in-flight response', async () => {
  let finish; const pending = new Promise(resolve => { finish = resolve; });
  const f = await fixture(async () => pending);
  const request = f.client.request('/users/me');
  await f.session.logout(); finish(envelope({ privateName: 'A' }));
  await assert.rejects(request, e => e.code === 'SESSION_CHANGED');
});

test('auth false omits bearer and never refreshes an auth entry request', async () => {
  let observed; const f = await fixture(async (url, init) => { observed = init; return failure('INVALID_CREDENTIALS', 401); });
  await assert.rejects(f.client.request('/auth/login', { method: 'POST', auth: false, body: {} }));
  assert.equal(observed.headers.Authorization, undefined); assert.equal(f.refreshes(), 0);
});

test('timeout and external abort become actionable API errors', async () => {
  const fetch = (url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true }));
  const client = new ApiClient({ baseUrl: 'https://api.example/api', platform: 'native', fetch, timeoutMs: 10 });
  await assert.rejects(client.request('/slow', { auth: false }), e => e.code === 'REQUEST_TIMEOUT');
  const abort = new AbortController();
  const request = client.request('/slow', { auth: false, signal: abort.signal }); abort.abort();
  await assert.rejects(request, e => e.code === 'REQUEST_ABORTED');
});

test('malformed server response does not leak raw HTML or internal details', async () => {
  const client = new ApiClient({ baseUrl: 'https://api.example/api', platform: 'web', fetch: async () => new Response('<private stack trace>', { status: 500 }) });
  await assert.rejects(client.request('/public', { auth: false }), e => e instanceof ApiError && !e.message.includes('private'));
});

test('timeout also covers a stalled JSON response body', async () => {
  const client = new ApiClient({ baseUrl: 'https://api.example/api', platform: 'web', timeoutMs: 10,
    fetch: async () => ({ status: 200, ok: true, json: () => new Promise(() => {}) }) });
  const result = await Promise.race([client.request('/slow-body', { auth: false }).catch(e => e.code),
    new Promise(resolve => setTimeout(() => resolve('NO_TIMEOUT'), 40))]);
  assert.equal(result, 'REQUEST_TIMEOUT');
});

test('multipart upload keeps FormData and lets fetch supply its boundary',async()=>{
 let captured;const client=new ApiClient({baseUrl:'https://api.example/api',platform:'web',fetch:async(url,init)=>{captured=init;return envelope({id:'media'});}});
 const form=new FormData();form.append('image',new Blob(['synthetic'],{type:'image/png'}),'synthetic.png');
 await client.request('/media',{method:'POST',body:form,auth:false});
 assert.ok(captured.body instanceof FormData);assert.equal(captured.headers['Content-Type'],undefined);assert.equal(captured.body.get('image').name,'synthetic.png');
});
