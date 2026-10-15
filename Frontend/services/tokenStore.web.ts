import type { TokenStore } from '../types/api';
// Browser refresh credentials remain in the server's HttpOnly cookie.
export const tokenStore: TokenStore = {
  kind: 'web',
  readRefresh: async () => null,
  writeRefresh: async () => {},
  clearRefresh: async () => {},
};
