export type UUID = string;
export type MoneyUsd = { amountCents: number; currency: 'USD' };
export type PageResponse<T> = { items: T[]; page: number; size: number; totalElements: number; totalPages: number };
export type ApiResponse<T> = { code: string; message: string; result: T };
export type UserProfile = {
  id: UUID; fullName: string; email: string; phone: string | null;
  role: 'customer' | 'partner' | 'admin'; avatarUrl: string | null; loyaltyPoints: number; loyaltyTier: number;
};
export type AuthSession = {
  accessToken: string; tokenType: 'Bearer'; expiresAt: string; sessionId: UUID;
  user: UserProfile; refreshToken?: string;
};
export type LoginRequest = { email: string; password: string };
export type RegisterRequest = LoginRequest & { fullName: string };
export type TokenStore = {
  kind: 'native' | 'web';
  readRefresh(): Promise<string | null>;
  writeRefresh(value: string): Promise<void>;
  clearRefresh(): Promise<void>;
};
export type AuthPort = {
  login(body: LoginRequest): Promise<AuthSession>;
  register(body: RegisterRequest): Promise<AuthSession>;
  refresh(token: string | null): Promise<AuthSession>;
  logout(token: string | null): Promise<void>;
};
export type SessionBridge = {
  getAccessToken(): string | null;
  getGeneration(): number;
  refresh(): Promise<void>;
  clearUserState(): void;
};
