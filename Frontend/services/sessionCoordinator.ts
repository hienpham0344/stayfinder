import type { AuthPort, AuthSession, TokenStore, UserProfile, LoginRequest, RegisterRequest } from '../types/api';

type Options = { auth: AuthPort; store: TokenStore; retryWait?: () => Promise<void> };
const changed = () => Object.assign(new Error('Your session changed. Please try again.'), { code: 'SESSION_CHANGED' });
const expired = () => Object.assign(new Error('Please sign in to continue.'), { code: 'SESSION_EXPIRED', status: 401 });

export class SessionCoordinator {
  private readonly auth: AuthPort;
  private readonly store: TokenStore;
  private readonly retryWait: () => Promise<void>;
  private access: string | null = null;
  private user: UserProfile | null = null;
  private generation = 0;
  private listeners = new Set<() => void>();
  private storageTail: Promise<void> = Promise.resolve();
  private entryTail: Promise<void> = Promise.resolve();
  private refreshPromise: Promise<void> | null = null;

  constructor({ auth, store, retryWait }: Options) {
    this.auth = auth; this.store = store;
    this.retryWait = retryWait ?? (() => new Promise(resolve => setTimeout(resolve, 200)));
  }
  getAccessToken(): string | null { return this.access; }
  getGeneration(): number { return this.generation; }
  getUser(): UserProfile | null { return this.user; }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private notify(): void { this.listeners.forEach(listener => listener()); }

  clearUserState(): void {
    this.generation++; this.access = null; this.user = null; this.notify();
    void this.storage(() => this.store.clearRefresh()).catch(() => {});
  }
  login(body: LoginRequest): Promise<void> { return this.enter(() => this.auth.login(body)); }
  register(body: RegisterRequest): Promise<void> { return this.enter(() => this.auth.register(body)); }
  private enter(operation: () => Promise<AuthSession>): Promise<void> {
    this.clearUserState(); const version = this.generation;
    return this.entry(async () => {
      if (version !== this.generation) throw changed();
      await this.adopt(await operation(), version, true);
    }).catch(error => {
      if (version === this.generation) this.clearUserState();
      throw error;
    });
  }

  refresh(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;
    const version = this.generation;
    const expectedUserId = this.user?.id;
    const pending = this.entry(async () => {
      if (version !== this.generation) throw changed();
      let credential = await this.storage(() => this.store.readRefresh());
      if (version !== this.generation) throw changed();
      if (this.store.kind === 'native' && !credential) throw expired();
      let response: AuthSession;
      try { response = await this.auth.refresh(credential); }
      catch (error) {
        if ((error as { code?: string })?.code !== 'REFRESH_RETRY') throw error;
        await this.retryWait();
        if (version !== this.generation) throw changed();
        credential = await this.storage(() => this.store.readRefresh());
        response = await this.auth.refresh(credential);
      }
      if (expectedUserId && response.user.id !== expectedUserId) throw changed();
      await this.adopt(response, version, false);
    }).catch(error => {
      if (version === this.generation) this.clearUserState();
      throw error;
    }).finally(() => { if (this.refreshPromise === pending) this.refreshPromise = null; });
    this.refreshPromise = pending;
    return pending;
  }

  logout(): Promise<void> {
    const credential = this.storage(() => this.store.readRefresh());
    this.clearUserState();
    // Wait for earlier auth responses before logout/new login can change a browser cookie.
    return this.entry(async () => {
      try { await this.auth.logout(await credential); }
      finally { await this.flushStorage(); }
    });
  }

  async bootstrap(): Promise<void> {
    if (this.store.kind === 'native' && !await this.storage(() => this.store.readRefresh())) return;
    try { await this.refresh(); }
    catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== 'SESSION_EXPIRED' && code !== 'SESSION_REVOKED' && code !== 'UNAUTHORIZED') throw error;
    }
  }
  async flushStorage(): Promise<void> { await this.storageTail; }
  private storage<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.storageTail.then(operation, operation);
    this.storageTail = next.then(() => {}, () => {});
    return next;
  }
  private entry(operation: () => Promise<void>): Promise<void> {
    const next = this.entryTail.then(operation, operation);
    this.entryTail = next.catch(() => {});
    return next;
  }
  private async adopt(response: AuthSession, version: number, cleanStaleLogin: boolean): Promise<void> {
    if (version !== this.generation) {
      if (cleanStaleLogin) await this.auth.logout(response.refreshToken ?? null).catch(() => {});
      throw changed();
    }
    if (!response.accessToken || !response.user?.id) throw expired();
    if (this.store.kind === 'native') {
      if (!response.refreshToken) throw expired();
      await this.storage(() => this.store.writeRefresh(response.refreshToken!));
    }
    if (version !== this.generation) throw changed();
    this.access = response.accessToken; this.user = response.user; this.notify();
  }
}
