import type { ApiClient } from './apiClient';
import type { AuthPort, AuthSession } from '../types/api';
export function createAuthApi(client: ApiClient): AuthPort & {
  changePassword(body: { currentPassword: string; newPassword: string }): Promise<void>;
  changeEmail(body: { currentPassword: string; newEmail: string }): Promise<void>;
} {
  return {
    register: body => client.request<AuthSession>('/auth/register', { method: 'POST', body, auth: false }),
    login: body => client.request<AuthSession>('/auth/login', { method: 'POST', body, auth: false }),
    refresh: token => client.request<AuthSession>('/auth/refresh', { method: 'POST', body: token ? { refreshToken: token } : undefined, auth: false }),
    logout: async token => { await client.request('/auth/logout', { method: 'POST', body: token ? { refreshToken: token } : undefined, auth: false }); },
    changePassword: async body => { await client.request('/auth/password', { method: 'POST', body }); },
    changeEmail: async body => { await client.request('/auth/email-change', { method: 'POST', body }); },
  };
}
