import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiAccommodation, ApiAuth, ApiBooking, ApiUser, stayApi } from '../services/api';
import { createDraft } from '../utils/frontendState';

type TripDraft = { accommodationId: string; roomId: string; checkIn: string; checkOut: string; guests: number };
type LiveStateValue = {
  user: ApiUser | null; token: string | null;
  catalog: ApiAccommodation[]; catalogLoading: boolean; catalogError: string;
  favoriteIds: string[]; bookings: ApiBooking[]; privateLoading: boolean; privateError: string;
  trip: TripDraft; setTrip: React.Dispatch<React.SetStateAction<TripDraft>>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void; refreshCatalog: () => Promise<void>; refreshBookings: () => Promise<void>;
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

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true); setCatalogError('');
    try { setCatalog(await stayApi.accommodations()); }
    catch (error) { setCatalogError(error instanceof Error ? error.message : 'Could not load stays.'); }
    finally { setCatalogLoading(false); }
  }, []);
  useEffect(() => { void refreshCatalog(); }, [refreshCatalog]);

  const refreshPrivate = useCallback(async () => {
    if (!auth) return;
    const currentSession = session.current;
    setPrivateLoading(true); setPrivateError('');
    try {
      const [favorites, currentBookings] = await Promise.all([stayApi.favorites(auth.token), stayApi.bookings(auth.token)]);
      if (session.current === currentSession) {
        setFavoriteIds(favorites.map((item) => item.accommodationId));
        setBookings(currentBookings);
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
  const register = useCallback(async (name: string, email: string, password: string) => setAuth(await stayApi.register(name, email, password)), []);
  const logout = useCallback(() => { session.current += 1; setAuth(null); }, []);
  const refreshBookings = useCallback(async () => {
    if (!auth) return;
    const currentSession = session.current;
    const currentBookings = await stayApi.bookings(auth.token);
    if (session.current === currentSession) setBookings(currentBookings);
  }, [auth]);
  const toggleFavorite = useCallback(async (id: string) => {
    if (!auth) throw new Error('Sign in to save stays.');
    if (favoriteIds.includes(id)) {
      await stayApi.removeFavorite(id, auth.token);
      setFavoriteIds((current) => current.filter((item) => item !== id));
    } else {
      await stayApi.addFavorite(id, auth.token);
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
    toggleFavorite, cancelBooking,
  }), [auth, catalog, catalogLoading, catalogError, favoriteIds, bookings, privateLoading, privateError, trip, login, register,
    logout, refreshCatalog, refreshBookings, refreshPrivate, toggleFavorite, cancelBooking]);
  return <LiveStateContext.Provider value={value}>{children}</LiveStateContext.Provider>;
}

export function useLiveState() {
  const value = useContext(LiveStateContext);
  if (!value) throw new Error('LiveStateProvider is required.');
  return value;
}
