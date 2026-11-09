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
export type ApiAccommodation = {
  id: string; name: string; address: string | null; description: string | null;
  basePrice: number | null; latitude: number | null; longitude: number | null;
  status: string; typeId: string | null;
};
export type ApiAccommodationDetail = {
  accommodation: ApiAccommodation; images: { id: string; url: string }[];
  features: { id: string; name: string }[];
};
export type ApiRoom = {
  id: string; accommodationId: string; name: string; description: string | null;
  price: number | null; status: string; roomTypeId: string | null;
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
export type ApiReview = { id: string; userId: string; bookingId: string; accommodationId: string; rating: number; comment: string; createdAt: string };

export const stayApi = {
  login: (email: string, password: string) => apiRequest<ApiAuth>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (fullName: string, email: string, password: string) => apiRequest<ApiAuth>('/api/auth/register', { method: 'POST', body: { fullName, email, password } }),
  me: (token: string) => apiRequest<ApiUser>('/api/users/me', { token }),
  accommodations: async () => {
    const all: ApiAccommodation[] = [];
    for (let page = 0; ; page += 1) {
      const result = await apiRequest<ApiPage<ApiAccommodation>>(`/api/accommodations?page=${page}&size=100`);
      all.push(...result.content);
      if (page + 1 >= result.totalPages || result.content.length === 0) return all;
    }
  },
  accommodation: (id: string) => apiRequest<ApiAccommodationDetail>(`/api/accommodations/${encodeURIComponent(id)}`),
  rooms: (id: string, checkIn: string, checkOut: string, guests: number) =>
    apiRequest<ApiRoom[]>(`/api/accommodations/${encodeURIComponent(id)}/rooms?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`),
  favorites: (token: string) => apiRequest<ApiFavorite[]>('/api/favorites', { token }),
  addFavorite: (id: string, token: string) => apiRequest<ApiFavorite>(`/api/favorites/${encodeURIComponent(id)}`, { method: 'PUT', token }),
  removeFavorite: (id: string, token: string) => apiRequest<null>(`/api/favorites/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
  bookings: async (token: string) => {
    const all: ApiBooking[] = [];
    for (let page = 0; ; page += 1) {
      const result = await apiRequest<ApiPage<ApiBooking>>(`/api/bookings?page=${page}&size=100`, { token });
      all.push(...result.content);
      if (page + 1 >= result.totalPages || result.content.length === 0) return all;
    }
  },
  booking: (id: string, token: string) => apiRequest<ApiBooking>(`/api/bookings/${encodeURIComponent(id)}`, { token }),
  createBooking: (request: { accommodationId: string; roomId: string; checkIn: string; checkOut: string; quantity: number; guests: number }, token: string) =>
    apiRequest<ApiBooking>('/api/bookings', { method: 'POST', token, body: request }),
  cancelBooking: (id: string, token: string) => apiRequest<ApiBooking>(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST', token }),
  payments: (bookingId: string, token: string) => apiRequest<ApiPayment[]>(`/api/bookings/${encodeURIComponent(bookingId)}/payments`, { token }),
  createPayment: (bookingId: string, token: string) => apiRequest<ApiPayment>(`/api/bookings/${encodeURIComponent(bookingId)}/payments`, { method: 'POST', token }),
  reviews: (accommodationId: string) => apiRequest<ApiReview[]>(`/api/accommodations/${encodeURIComponent(accommodationId)}/reviews`),
  createReview: (accommodationId: string, bookingId: string, rating: number, comment: string, token: string) =>
    apiRequest<ApiReview>(`/api/accommodations/${encodeURIComponent(accommodationId)}/reviews`, { method: 'POST', token, body: { bookingId, rating, comment } }),
  updateReview: (reviewId: string, rating: number, comment: string, token: string) =>
    apiRequest<ApiReview>(`/api/reviews/${encodeURIComponent(reviewId)}`, { method: 'PATCH', token, body: { rating, comment } }),
};
