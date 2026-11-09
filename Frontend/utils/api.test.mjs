import assert from 'node:assert/strict';
import { apiRequest, ApiError } from '../services/api.ts';

let sent;
const transport = async (url, init) => {
  sent = { url, ...init };
  return new Response(JSON.stringify({ code: 'SUCCESS', message: 'Success', result: { id: 'booking-1' } }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
const booking = await apiRequest('/api/bookings', {
  method: 'POST', token: 'test-token', body: { roomId: 'room-1' },
}, 'http://localhost:8080', transport);
assert.deepEqual(booking, { id: 'booking-1' });
assert.equal(sent.url, 'http://localhost:8080/api/bookings');
assert.equal(sent.headers.Authorization, 'Bearer test-token');
assert.equal(sent.headers['Content-Type'], 'application/json');
assert.deepEqual(JSON.parse(sent.body), { roomId: 'room-1' });

await assert.rejects(apiRequest('/api/bookings', {}, 'http://localhost:8080', async () =>
  new Response(JSON.stringify({ code: 'UNAUTHORIZED', message: 'Authentication is required' }), { status: 401 })),
  (error) => error instanceof ApiError && error.status === 401 && error.code === 'UNAUTHORIZED');
await assert.rejects(apiRequest('/api/bookings', {}, 'http://localhost:8080', async () => {
  throw new Error('socket closed');
}), (error) => error instanceof ApiError && error.status === 0);
await assert.rejects(apiRequest('/api/bookings', {}, '', transport), /EXPO_PUBLIC_API_BASE_URL/);
