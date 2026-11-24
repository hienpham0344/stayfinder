const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

export const apiEnabled = configuredBaseUrl.length > 0;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type Envelope<T> = { code: string; message: string; result: T };
type ErrorBody = { code?: string; message?: string };
type RequestOptions = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; token?: string; body?: unknown; signal?: AbortSignal };

export async function apiRequest<T>(path: string, options: RequestOptions = {}, baseUrl = configuredBaseUrl,
                                    transport: typeof fetch = fetch): Promise<T> {
  if (!/^https?:\/\//.test(baseUrl)) throw new ApiError('Set EXPO_PUBLIC_API_BASE_URL to the backend HTTP address.', 0);
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  let response: Response;
  try {
    response = await transport(`${baseUrl}${path}`, {
      method: options.method ?? 'GET', headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError('Cannot reach StayFinder API. Check the server and network.', 0);
  }
  const body = await response.json().catch(() => null) as (Envelope<T> & ErrorBody) | null;
  if (!response.ok || !body || body.code !== 'SUCCESS') {
    throw new ApiError(body?.message || `Request failed (${response.status}).`, response.status, body?.code);
  }
  return body.result;
}

export type ApiPage<T> = { content: T[]; totalPages: number; number: number };
export type AccommodationQuery = { q?: string; typeId?: string; featureIds?: string[]; minPrice?: number; maxPrice?: number; checkIn?: string; checkOut?: string; guests?: number };

export function pageQuery(page = 0, filters: AccommodationQuery = {}): string {
  const params = new URLSearchParams({ page: String(Math.max(0, page)), size: '20' });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return params.toString();
}
export type ApiAccommodation = {
  id: string; name: string; address: string | null; description: string | null;
  basePrice: number | null; latitude: number | null; longitude: number | null;
  status: string; typeId: string | null;
  matchedRoomId?: string | null; matchedPrice?: number | null;
};
export type ApiAccommodationDetail = {
  accommodation: ApiAccommodation; images: { id: string; url: string }[];
  features: { id: string; name: string }[];
};
export type ApiRoom = {
  id: string; accommodationId: string; name: string; description: string | null;
  price: number | null; status: string; roomTypeId: string | null;
  capacity?: number;
};
export type ApiBookingDetail = {
  id: string; roomSnapshotId: string; checkInDate: string; checkOutDate: string;
  quantity: number; subtotal: number; accommodationId: string | null;
  accommodationName: string | null; roomId: string | null; roomName: string | null;
};
export type ApiBooking = {
  id: string; userId: string; totalPrice: number; status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string; details: ApiBookingDetail[];
};
export type ApiPayment = {
  id: string; bookingId: string; amount: number; status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentCode: string; transactionId: string | null; createdAt: string; receivingAccountNumber: string;
};
export type ApiUser = {
  id: string; fullName: string; email: string; phone: string | null; role: string;
  avatarUrl: string | null; loyaltyPoints: number | null; loyaltyTier: number | null;
};
export type ApiAuth = { token: string; user: ApiUser };
export type ApiFavorite = { id: string; accommodationId: string };
export type ApiReview = { id: string; userId: string; bookingId: string; accommodationId: string; rating: number; comment: string; createdAt: string; hidden?: boolean };
export type ApiRewardAccount = { points: number; currency: string; earnVndPerPoint: number };
export type ApiRewardCatalog = { id: string; name: string; pointsCost: number; discountAmount: number; minSpend: number; validityDays: number };
export type ApiRewardVoucher = { id: string; catalogId: string; discountAmount: number; status: string; expiresAt: string };

// Management / Admin / Partner Types
export type ManagementAccount = {
  id: string; fullName: string; email: string; phone: string | null;
  role: 'CUSTOMER' | 'PARTNER' | 'ADMIN'; enabled: boolean; version: number;
};
export type ManagementApplication = {
  id: string; userId: string; businessName: string; description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; reason: string | null;
  reviewedBy: string | null; createdAt: string; reviewedAt: string | null; version: number;
};
export type ManagementAccommodation = {
  id: string; partnerId: string; typeId: string | null; name: string;
  address: string; description: string | null; latitude: number | null; longitude: number | null;
  basePrice: number; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE';
  createdAt: string; version: number;
};
export type ManagementRoom = {
  id: string; accommodationId: string; roomTypeId: string | null; name: string;
  description: string | null; price: number; capacity: number; status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  createdAt: string; version: number;
};
export type ManagementBooking = {
  id: string; userId: string; subtotal: number; discountAmount: number;
  totalPrice: number; status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string; expiresAt: string | null; cancellationReason: string | null;
};
export type ManagementStatistics = {
  totalBookings: number; pendingBookings: number; cancelledBookings: number;
  completedBookings: number; receivedRevenue: number;
};

export const stayApi = {
  accommodationsPage: (page = 0, filters: AccommodationQuery = {}) => apiRequest<ApiPage<ApiAccommodation>>(`/api/accommodations?${pageQuery(page, filters)}`),
  bookingsPage: (token: string, page = 0) => apiRequest<ApiPage<ApiBooking>>(`/api/bookings?${pageQuery(page)}`, { token }),
  wishlistPage: (token: string, page = 0) => apiRequest<ApiPage<ApiAccommodation>>(`/api/favorites/accommodations?${pageQuery(page)}`, { token }),
  logout: (token: string) => apiRequest<null>('/api/auth/logout', { method: 'POST', token }),
  rewardAccount: (token: string) => apiRequest<ApiRewardAccount>('/api/rewards/account', { token }),
  rewardCatalog: (token: string, page = 0) => apiRequest<ApiPage<ApiRewardCatalog>>(`/api/rewards/catalog?${pageQuery(page)}`, { token }),
  rewardVouchers: (token: string, page = 0) => apiRequest<ApiPage<ApiRewardVoucher>>(`/api/rewards/vouchers?${pageQuery(page)}`, { token }),
  redeemReward: (catalogId: string, idempotencyKey: string, token: string) => apiRequest<ApiRewardVoucher>('/api/rewards/redeem', { method: 'POST', token, body: { catalogId, idempotencyKey } }),
  login: (email: string, password: string) => apiRequest<ApiAuth>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (fullName: string, email: string, password: string, role?: string) =>
    apiRequest<ApiAuth>('/api/auth/register', { method: 'POST', body: { fullName, email, password, ...(role ? { role } : {}) } }),
  me: (token: string) => apiRequest<ApiUser>('/api/users/me', { token }),
  accommodation: (id: string) => apiRequest<ApiAccommodationDetail>(`/api/accommodations/${encodeURIComponent(id)}`),
  rooms: (id: string, checkIn: string, checkOut: string, guests: number) =>
    apiRequest<ApiRoom[]>(`/api/accommodations/${encodeURIComponent(id)}/rooms?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`),
  favorites: (token: string) => apiRequest<ApiFavorite[]>('/api/favorites', { token }),
  addFavorite: (id: string, token: string) => apiRequest<ApiFavorite>(`/api/favorites/${encodeURIComponent(id)}`, { method: 'PUT', token }),
  removeFavorite: (id: string, token: string) => apiRequest<null>(`/api/favorites/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
  booking: (id: string, token: string) => apiRequest<ApiBooking>(`/api/bookings/${encodeURIComponent(id)}`, { token }),
  createBooking: (request: { accommodationId: string; roomId: string; checkIn: string; checkOut: string; quantity: number; guests: number; voucherId?: string }, token: string) =>
    apiRequest<ApiBooking>('/api/bookings', { method: 'POST', token, body: request }),
  cancelBooking: (id: string, token: string) => apiRequest<ApiBooking>(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST', token }),
  payments: (bookingId: string, token: string) => apiRequest<ApiPayment[]>(`/api/bookings/${encodeURIComponent(bookingId)}/payments`, { token }),
  createPayment: (bookingId: string, token: string) => apiRequest<ApiPayment>(`/api/bookings/${encodeURIComponent(bookingId)}/payments`, { method: 'POST', token }),
  reviews: (accommodationId: string) => apiRequest<ApiReview[]>(`/api/accommodations/${encodeURIComponent(accommodationId)}/reviews`),
  createReview: (accommodationId: string, bookingId: string, rating: number, comment: string, token: string) =>
    apiRequest<ApiReview>(`/api/accommodations/${encodeURIComponent(accommodationId)}/reviews`, { method: 'POST', token, body: { bookingId, rating, comment } }),
  updateReview: (reviewId: string, rating: number, comment: string, token: string) =>
    apiRequest<ApiReview>(`/api/reviews/${encodeURIComponent(reviewId)}`, { method: 'PATCH', token, body: { rating, comment } }),

  // Admin APIs
  adminStatistics: (token: string) => apiRequest<ManagementStatistics>('/api/admin/statistics', { token }),
  adminUsers: (token: string, page = 0, role?: string) =>
    apiRequest<ApiPage<ManagementAccount>>(`/api/admin/users?${new URLSearchParams({ page: String(page), size: '20', ...(role ? { role } : {}) }).toString()}`, { token }),
  adminUpdateUser: (id: string, request: { role: string; enabled: boolean; reason: string; version: number }, token: string) =>
    apiRequest<ManagementAccount>(`/api/admin/users/${id}`, { method: 'PATCH', token, body: request }),
  adminApplications: (token: string, page = 0, status?: string) =>
    apiRequest<ApiPage<ManagementApplication>>(`/api/admin/partner-applications?${new URLSearchParams({ page: String(page), size: '20', ...(status ? { status } : {}) }).toString()}`, { token }),
  adminDecideApplication: (id: string, decision: { approved: boolean; reason: string; version: number }, token: string) =>
    apiRequest<ManagementApplication>(`/api/admin/partner-applications/${id}/decision`, { method: 'POST', token, body: decision }),
  adminAccommodations: (token: string, page = 0, status?: string) =>
    apiRequest<ApiPage<ManagementAccommodation>>(`/api/admin/accommodations?${new URLSearchParams({ page: String(page), size: '20', ...(status ? { status } : {}) }).toString()}`, { token }),
  adminModerateAccommodation: (id: string, request: { status: string; reason: string; version: number }, token: string) =>
    apiRequest<ManagementAccommodation>(`/api/admin/accommodations/${id}/moderation`, { method: 'POST', token, body: request }),
  adminReviews: (token: string, page = 0) =>
    apiRequest<ApiPage<ApiReview>>(`/api/admin/reviews?page=${page}&size=20`, { token }),
  adminModerateReview: (id: string, request: { hidden: boolean; reason: string; version: number }, token: string) =>
    apiRequest<ApiReview>(`/api/admin/reviews/${id}/moderation`, { method: 'POST', token, body: request }),

  // Partner APIs
  partnerStatistics: (token: string) => apiRequest<ManagementStatistics>('/api/partner/statistics', { token }),
  partnerAccommodations: (token: string, page = 0) =>
    apiRequest<ApiPage<ManagementAccommodation>>(`/api/partner/accommodations?page=${page}&size=20`, { token }),
  partnerCreateAccommodation: (data: unknown, token: string) =>
    apiRequest<ManagementAccommodation>('/api/partner/accommodations', { method: 'POST', token, body: data }),
  partnerRooms: (accommodationId: string, token: string, page = 0) =>
    apiRequest<ApiPage<ManagementRoom>>(`/api/partner/accommodations/${accommodationId}/rooms?page=${page}&size=20`, { token }),
  partnerCreateRoom: (accommodationId: string, data: unknown, token: string) =>
    apiRequest<ManagementRoom>(`/api/partner/accommodations/${accommodationId}/rooms`, { method: 'POST', token, body: data }),
  partnerBookings: (token: string, page = 0, status?: string) =>
    apiRequest<ApiPage<ManagementBooking>>(`/api/partner/bookings?${new URLSearchParams({ page: String(page), size: '20', ...(status ? { status } : {}) }).toString()}`, { token }),
  partnerPayments: (token: string, page = 0) =>
    apiRequest<ApiPage<ApiPayment>>(`/api/partner/payments?page=${page}&size=20`, { token }),
};
