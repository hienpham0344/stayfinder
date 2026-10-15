import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { ApiClient } from '../services/apiClient';
import { createAuthApi } from '../services/authApi';
import { SessionCoordinator } from '../services/sessionCoordinator';
import { tokenStore } from '../services/tokenStore';
import type { UserProfile } from '../types/api';

function createServices() {
  const api = new ApiClient({
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL, platform: Platform.OS === 'web' ? 'web' : 'native',
    allowInsecureHttp: __DEV__,
  });
  const authApi = createAuthApi(api);
  const session = new SessionCoordinator({ auth: authApi, store: tokenStore });
  api.setSession(session);
  return { api, authApi, session };
}
type SessionContextValue = ReturnType<typeof createServices> & {
  user: UserProfile | null; loading: boolean; bootstrapError: string;
};
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [services] = useState(createServices);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState('');
  useEffect(() => {
    let active = true;
    const unsubscribe = services.session.subscribe(() => { if (active) setUser(services.session.getUser()); });
    services.session.bootstrap().catch(error => {
      if (active) setBootstrapError(error instanceof Error ? error.message : 'Unable to restore your session.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; unsubscribe(); };
  }, [services]);
  const value = useMemo(() => ({ ...services, user, loading, bootstrapError }), [services, user, loading, bootstrapError]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider is required');
  return context;
}
