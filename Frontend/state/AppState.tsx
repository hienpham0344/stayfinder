import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { findStay } from '../constants/stayCatalog';
import { BookingDraft, DemoBooking, RewardAccount, RewardSpend, availableRoom, cancelBooking, confirmBooking, createDraft, quoteBooking, reviewBooking, spendRewardPoints, toggleSaved, validTravelDates } from '../utils/frontendState';

function useDemoState() {
  const [draft, setDraft] = useState<BookingDraft>(() => createDraft());
  const [savedIds, setSavedIds] = useState(['villa-amala-sanctuary', 'aurora-glass-cabin', 'le-marais-loft']);
  const [rewards, setRewards] = useState<RewardAccount>({ points: 24500, spends: [] });
  const { points, spends } = rewards;
  const spendPoints = useCallback((spend: RewardSpend) => setRewards((current) => spendRewardPoints(current, spend)), []);
  const [bookings, setBookings] = useState<DemoBooking[]>(() => {
    const stay = findStay('villa-azure')!;
    const historicalDraft = { ...createDraft(), stayId: stay.id, tierId: stay.roomTiers![0].id, checkIn: '2026-08-05', checkOut: '2026-08-08' };
    return [{ ...historicalDraft, id: 'SF-DEMO-01', quote: quoteBooking(stay, historicalDraft, 0), status: 'completed', paymentMethod: 'CreditCard' }];
  });
  const confirmation = useRef<string | null>(null);
  const patchDraft = useCallback((patch: Partial<BookingDraft>) => { confirmation.current = null; setDraft((current) => ({ ...current, ...patch })); }, []);
  const beginBooking = useCallback((stayId: string, tierId?: string) => {
    const stay = findStay(stayId);
    if (!stay) return;
    const room = availableRoom(stay, draft, tierId ?? (draft.stayId === stayId ? draft.tierId : undefined));
    patchDraft({ stayId, tierId: room?.id ?? '', rewardApplied: false });
  }, [draft, patchDraft]);
  const confirmDraft = useCallback((paymentMethod: string) => {
    if (confirmation.current) return confirmation.current;
    const stay = findStay(draft.stayId);
    if (!stay || !validTravelDates(draft.checkIn, draft.checkOut)) throw new Error('Please select valid stay dates.');
    const quote = quoteBooking(stay, draft, points);
    const id = `SF-${Date.now().toString(36).toUpperCase()}`;
    confirmation.current = id;
    setBookings((current) => confirmBooking(current, { ...draft, id, quote, status: 'upcoming', paymentMethod }));
    spendPoints({ id, title: `Booking at ${stay.title}`, points: quote.pointsUsed });
    return id;
  }, [draft, points, spendPoints]);
  const toggleWishlist = useCallback((id: string) => setSavedIds((current) => toggleSaved(current, id)), []);
  const cancelReservation = useCallback((id: string) => setBookings((current) => cancelBooking(current, id)), []);
  const saveReview = useCallback((id: string, rating: number, comment: string) => setBookings((current) => reviewBooking(current, id, rating, comment)), []);
  return {
    booking: useMemo(() => ({ draft, patchDraft, beginBooking, confirmDraft }), [draft, patchDraft, beginBooking, confirmDraft]),
    wishlist: useMemo(() => ({ savedIds, toggleWishlist }), [savedIds, toggleWishlist]),
    rewards: useMemo(() => ({ points, spends, spendPoints }), [points, spends, spendPoints]),
    reservations: useMemo(() => ({ bookings, cancelReservation, saveReview }), [bookings, cancelReservation, saveReview]),
  };
}
type AppState = ReturnType<typeof useDemoState>;
const BookingContext = createContext<AppState['booking'] | null>(null);
const WishlistContext = createContext<AppState['wishlist'] | null>(null);
const RewardsContext = createContext<AppState['rewards'] | null>(null);
const ReservationsContext = createContext<AppState['reservations'] | null>(null);
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const state = useDemoState();
  return <BookingContext.Provider value={state.booking}><WishlistContext.Provider value={state.wishlist}><RewardsContext.Provider value={state.rewards}><ReservationsContext.Provider value={state.reservations}>{children}</ReservationsContext.Provider></RewardsContext.Provider></WishlistContext.Provider></BookingContext.Provider>;
}
function requireState<T>(value: T | null): T { if (!value) throw new Error('AppStateProvider is required.'); return value; }
export function useBookingDraft() { return requireState(useContext(BookingContext)); }
export function useWishlist() { return requireState(useContext(WishlistContext)); }
export function useRewards() { return requireState(useContext(RewardsContext)); }
export function useReservations() { return requireState(useContext(ReservationsContext)); }
