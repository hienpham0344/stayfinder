import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccommodationQuery, ApiAccommodation, ApiAuth, ApiBooking, ApiError, ApiUser, stayApi } from '../services/api';
import { createDraft } from '../utils/frontendState';

type TripDraft = { accommodationId: string; roomId: string; checkIn: string; checkOut: string; guests: number };
type LiveStateValue = {
  user: ApiUser | null; token: string | null;
  catalog: ApiAccommodation[]; catalogLoading: boolean; catalogError: string;
  favoriteIds: string[]; bookings: ApiBooking[]; privateLoading: boolean; privateError: string;
  trip: TripDraft; setTrip: React.Dispatch<React.SetStateAction<TripDraft>>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>; refreshCatalog: (filters?: AccommodationQuery) => Promise<void>; refreshBookings: () => Promise<void>;
  catalogHasMore: boolean; bookingsHasMore: boolean;
  loadMoreCatalog: () => Promise<void>; loadMoreBookings: () => Promise<void>;
  refreshPrivate: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
};

const LiveStateContext = createContext<LiveStateValue | null>(null);

export function LiveStateProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => createDraft(), []);
  const [trip, setTrip] = useState<TripDraft>({ accommodationId: '', roomId: '', checkIn: initial.checkIn, checkOut: initial.checkOut, guests: 2 });
  const [auth, setAuth] = useState<ApiAuth | null>(null);
  const [catalog, setCatalog] = useState<ApiAccommodation[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [privateError, setPrivateError] = useState('');
  const session = useRef(0);
  const catalogGeneration = useRef(0);
  const catalogCursor = useRef(0);
  const catalogFilters = useRef<AccommodationQuery>({});
  const catalogBusy = useRef(false);
  const bookingCursor = useRef(0);
  const bookingGeneration = useRef(0);
  const bookingBusy = useRef(false);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [bookingsHasMore, setBookingsHasMore] = useState(false);

  const refreshCatalog = useCallback(async (filters: AccommodationQuery = catalogFilters.current) => {
    const generation = ++catalogGeneration.current;
    catalogFilters.current = filters;
    setCatalogLoading(true); setCatalogError('');
    try {
      const page = await stayApi.accommodationsPage(0, filters);
      if (generation !== catalogGeneration.current) return;
      setCatalog(page.content); catalogCursor.current = page.number;
      setCatalogHasMore(page.number + 1 < page.totalPages);
    } catch (error) {
      if (generation === catalogGeneration.current) setCatalogError(error instanceof Error ? error.message : 'Could not load stays.');
    } finally { if (generation === catalogGeneration.current) setCatalogLoading(false); }
  }, []);
  const loadMoreCatalog = useCallback(async () => {
    if (catalogBusy.current || catalogLoading || !catalogHasMore) return;
    catalogBusy.current = true;
    const generation = catalogGeneration.current;
    try {
      const page = await stayApi.accommodationsPage(catalogCursor.current + 1, catalogFilters.current);
      if (generation !== catalogGeneration.current) return;
      setCatalog((current) => [...current, ...page.content.filter((item) => !current.some((old) => old.id === item.id))]);
      catalogCursor.current = page.number; setCatalogHasMore(page.number + 1 < page.totalPages);
    } catch (error) {
      if (generation === catalogGeneration.current) setCatalogError(error instanceof Error ? error.message : 'Cannot load more stays.');
    } finally { catalogBusy.current = false; }
  }, [catalogHasMore, catalogLoading]);

  const refreshPrivate = useCallback(async () => {
    if (!auth) return;
    const currentSession = session.current;
    const generation = ++bookingGeneration.current;
    setPrivateLoading(true); setPrivateError('');
    try {
      const [favorites, currentBookings] = await Promise.all([stayApi.favorites(auth.token), stayApi.bookingsPage(auth.token)]);
      if (session.current === currentSession && generation === bookingGeneration.current) {
        setFavoriteIds(favorites.map((item) => item.accommodationId));
        setBookings(currentBookings.content); bookingCursor.current = currentBookings.number;
        setBookingsHasMore(currentBookings.number + 1 < currentBookings.totalPages);
      }
    } catch (error) {
      if (session.current === currentSession) setPrivateError(error instanceof Error ? error.message : 'Could not load account data.');
    } finally { if (session.current === currentSession) setPrivateLoading(false); }
  }, [auth]);
  useEffect(() => {
    session.current += 1;
    if (!auth) { setFavoriteIds([]); setBookings([]); setPrivateLoading(false); setPrivateError(''); return; }
    void refreshPrivate();
    return () => { session.current += 1; };
  }, [auth, refreshPrivate]);

  const login = useCallback(async (email: string, password: string) => setAuth(await stayApi.login(email, password)), []);
  const register = useCallback(async (name: string, email: string, password: string, role?: string) => setAuth(await stayApi.register(name, email, password, role)), []);
  const logout = useCallback(async () => {
    if (auth) {
      try { await stayApi.logout(auth.token); }
      catch (error) { if (!(error instanceof ApiError) || error.status !== 401) throw error; }
    }
    session.current += 1; setAuth(null);
  }, [auth]);
  const refreshBookings = useCallback(async () => {
    if (!auth) return;
    const currentSession = session.current;
    const generation = ++bookingGeneration.current;
    const currentBookings = await stayApi.bookingsPage(auth.token);
    if (session.current === currentSession && generation === bookingGeneration.current) {
      setBookings(currentBookings.content); bookingCursor.current = currentBookings.number;
      setBookingsHasMore(currentBookings.number + 1 < currentBookings.totalPages);
    }
  }, [auth]);
  const loadMoreBookings = useCallback(async () => {
    if (!auth || bookingBusy.current || !bookingsHasMore) return;
    bookingBusy.current = true;
    const currentSession = session.current;
    const generation = bookingGeneration.current;
    try {
      const page = await stayApi.bookingsPage(auth.token, bookingCursor.current + 1);
      if (session.current === currentSession && generation === bookingGeneration.current) {
        setBookings((current) => [...current, ...page.content.filter((item) => !current.some((old) => old.id === item.id))]);
        bookingCursor.current = page.number; setBookingsHasMore(page.number + 1 < page.totalPages);
      }
    } finally { bookingBusy.current = false; }
  }, [auth, bookingsHasMore]);
  const toggleFavorite = useCallback(async (id: string) => {
    if (!auth) throw new Error('Sign in to save stays.');
    const currentSession = session.current;
    if (favoriteIds.includes(id)) {
      await stayApi.removeFavorite(id, auth.token);
      if (session.current !== currentSession) return;
      setFavoriteIds((current) => current.filter((item) => item !== id));
    } else {
      await stayApi.addFavorite(id, auth.token);
      if (session.current !== currentSession) return;
      setFavoriteIds((current) => current.includes(id) ? current : [...current, id]);
    }
  }, [auth, favoriteIds]);
  const cancelBooking = useCallback(async (id: string) => {
    if (!auth) throw new Error('Sign in to manage bookings.');
    await stayApi.cancelBooking(id, auth.token);
    await refreshBookings();
  }, [auth, refreshBookings]);

  const value = useMemo<LiveStateValue>(() => ({
    user: auth?.user ?? null, token: auth?.token ?? null, catalog, catalogLoading, catalogError,
    favoriteIds, bookings, privateLoading, privateError, trip, setTrip, login, register, logout, refreshCatalog, refreshBookings, refreshPrivate,
    toggleFavorite, cancelBooking, catalogHasMore, bookingsHasMore, loadMoreCatalog, loadMoreBookings,
  }), [auth, catalog, catalogLoading, catalogError, favoriteIds, bookings, privateLoading, privateError, trip, login, register,
    logout, refreshCatalog, refreshBookings, refreshPrivate, toggleFavorite, cancelBooking, catalogHasMore, bookingsHasMore, loadMoreCatalog, loadMoreBookings]);
  return <LiveStateContext.Provider value={value}>{children}</LiveStateContext.Provider>;
}

export function useLiveState() {
  const value = useContext(LiveStateContext);
  if (!value) throw new Error('LiveStateProvider is required.');
  return value;
}
