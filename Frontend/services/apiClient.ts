import type { SessionBridge } from '../types/api';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number, message = 'Unable to complete the request. Please try again.') {
    super(message); this.name = 'ApiError'; this.code = code; this.status = status;
  }
}
export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown; signal?: AbortSignal; idempotencyKey?: string; auth?: boolean;
};
type Options = {
  baseUrl?: string; platform: 'web' | 'native'; session?: SessionBridge;
  fetch?: typeof fetch; timeoutMs?: number; allowInsecureHttp?: boolean;
};

export class ApiClient {
  private readonly options: Options;
  private readonly fetcher: typeof fetch;
  private session?: SessionBridge;
  constructor(options: Options) { this.options = options; this.fetcher = options.fetch ?? globalThis.fetch; this.session = options.session; }
  setSession(session: SessionBridge): void { this.session = session; }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.url(path);
    const auth = options.auth ?? true;
    const generation = this.session?.getGeneration();
    const method = options.method ?? 'GET';
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);
    const originalToken = auth ? this.session?.getAccessToken() : null;
    const checkGeneration = () => {
      if (auth && generation !== this.session?.getGeneration()) throw new ApiError('SESSION_CHANGED', 409, 'Your session changed. Please try again.');
    };
    const send = (token?: string | null) => this.send(url, method, body, options, token);
    let response = await send(originalToken);
    checkGeneration();
    if (response.status === 401 && auth && this.session) {
      if (this.session.getAccessToken() === originalToken) await this.session.refresh();
      checkGeneration();
      // Repeating a business POST requires the original server idempotency key.
      if ((method === 'POST' || method === 'PATCH') && !options.idempotencyKey)
        throw new ApiError('AUTH_RETRY_REQUIRED', 409, 'Your session was renewed. Please submit again.');
      response = await send(this.session.getAccessToken());
      checkGeneration();
      if (response.status === 401) this.session.clearUserState();
    }
    const data = response.data;
    checkGeneration();
    if (!response.ok) {
      const error = data as { code?: unknown; message?: unknown };
      throw new ApiError(typeof error?.code === 'string' ? error.code : 'REQUEST_FAILED', response.status,
        typeof error?.message === 'string' ? error.message : undefined);
    }
    const envelope = data as { code?: unknown; result?: T };
    if (envelope?.code !== 'SUCCESS' || !Object.prototype.hasOwnProperty.call(envelope, 'result'))
      throw new ApiError('BAD_RESPONSE', response.status);
    return envelope.result as T;
  }

  private url(path: string): string {
    if (!this.options.baseUrl) throw new ApiError('API_NOT_CONFIGURED', 503, 'The service is unavailable. Please try again later.');
    if (!path.startsWith('/') || path.startsWith('//')) throw new ApiError('INVALID_API_PATH', 400);
    const url = new URL(this.options.baseUrl.replace(/\/$/, '') + path);
    if (url.protocol !== 'https:' && !(this.options.allowInsecureHttp && url.protocol === 'http:'))
      throw new ApiError('INVALID_API_URL', 503);
    return url.toString();
  }

  private async send(url: string, method: string, body: string | undefined, options: RequestOptions, token?: string | null): Promise<{ status: number; ok: boolean; data: unknown }> {
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (options.signal?.aborted) throw new ApiError('REQUEST_ABORTED', 0, 'Request cancelled.');
    options.signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, this.options.timeoutMs ?? 15_000);
    const headers: Record<string, string> = { Accept: 'application/json', 'X-Client-Platform': this.options.platform };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = 'Bearer ' + token;
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    const aborted = new Promise<never>((resolve, reject) => controller.signal.addEventListener('abort', () => reject(
      new ApiError(timedOut ? 'REQUEST_TIMEOUT' : 'REQUEST_ABORTED', 0,
        timedOut ? 'The request timed out. Please try again.' : 'Request cancelled.')), { once: true }));
    try {
      return await Promise.race([(async () => {
        const response = await this.fetcher(url, { method, body, headers, signal: controller.signal,
          credentials: this.options.platform === 'web' ? 'include' : 'omit' });
        let data: unknown;
        try { data = await response.json(); }
        catch { throw new ApiError('BAD_RESPONSE', response.status); }
        return { status: response.status, ok: response.ok, data };
      })(), aborted]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted) throw new ApiError(timedOut ? 'REQUEST_TIMEOUT' : 'REQUEST_ABORTED', 0,
        timedOut ? 'The request timed out. Please try again.' : 'Request cancelled.');
      throw new ApiError('NETWORK_ERROR', 0, 'Unable to connect. Check your connection and try again.');
    } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort); }
  }
}
