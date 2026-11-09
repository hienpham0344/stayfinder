import type { RoomTier, Stay } from '../types/stay';

export type BookingDraft = {
  stayId: string; tierId: string; checkIn: string; checkOut: string;
  adults: number; children: number; rooms: number;
  name: string; email: string; phone: string; request: string; rewardApplied: boolean;
};
export type BookingQuote = { nights: number; rate: number; roomTotal: number; fees: number; discount: number; pointsUsed: number; total: number };
export type RewardSpend = { id: string; title: string; points: number };
export type RewardAccount = { points: number; spends: RewardSpend[] };
export function spendRewardPoints(account: RewardAccount, spend: RewardSpend): RewardAccount {
  if (!Number.isSafeInteger(spend.points) || spend.points <= 0 || spend.points > account.points || account.spends.some((entry) => entry.id === spend.id)) return account;
  return { points: account.points - spend.points, spends: [spend, ...account.spends] };
}
export type DemoBooking = BookingDraft & {
  id: string; quote: BookingQuote; status: 'upcoming' | 'completed' | 'cancelled';
  paymentMethod: string; review?: { rating: number; comment: string };
};
export type SearchFilters = {
  destination: string; adults: number; children: number; rooms: number;
  minPrice: number; maxPrice: number; rating: number; types: Stay['type'][];
  amenities: string[]; sortBy: 'recommended' | 'price' | 'rating';
};

export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function parseTravelDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return dateKey(date) === value ? date : null;
}
export function travelNights(start: string, end: string) {
  const from = parseTravelDate(start); const to = parseTravelDate(end);
  if (!from || !to) return 0;
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000);
}
export function validTravelDates(start: string, end: string, today = new Date()) {
  return !!parseTravelDate(start) && start >= dateKey(today) && travelNights(start, end) > 0;
}
export function createDraft(today = new Date()): BookingDraft {
  const start = new Date(today); start.setDate(start.getDate() + 1);
  const end = new Date(start); end.setDate(end.getDate() + 3);
  return { stayId: '', tierId: '', checkIn: dateKey(start), checkOut: dateKey(end), adults: 2, children: 0, rooms: 1, name: '', email: '', phone: '', request: '', rewardApplied: false };
}
export function roomCanHost(room: RoomTier, party: Pick<BookingDraft, 'rooms' | 'adults' | 'children'>) {
  return Number.isInteger(party.rooms) && Number.isInteger(party.adults) && Number.isInteger(party.children) && party.rooms > 0 && party.adults >= 1 && party.children >= 0 && room.availableCount >= party.rooms && room.maxGuests * party.rooms >= party.adults + party.children;
}
export function availableRoom(stay: Stay, party: Pick<BookingDraft, 'rooms' | 'adults' | 'children'>, preferredId?: string) {
  const rooms = stay.roomTiers?.filter((room) => roomCanHost(room, party)) ?? [];
  return rooms.find((room) => room.id === preferredId) ?? rooms.reduce<RoomTier | undefined>((best, room) => !best || room.pricePerNight < best.pricePerNight ? room : best, undefined);
}
export function quoteBooking(stay: Stay, draft: BookingDraft, points: number): BookingQuote {
  const room = stay.roomTiers?.find((item) => item.id === draft.tierId);
  if (!room || !roomCanHost(room, draft)) throw new Error('Select an available room for your guests.');
  const nights = travelNights(draft.checkIn, draft.checkOut);
  if (nights < 1) throw new Error('Select valid travel dates.');
  const roomTotal = Math.round(room.pricePerNight * nights * draft.rooms * 100) / 100;
  const fees = (stay.cleaningFee + stay.serviceFee) * draft.rooms;
  const pointsUsed = draft.rewardApplied && points >= 2500 ? Math.min(2500, Math.floor((roomTotal + fees) * 100)) : 0;
  const discount = pointsUsed / 100;
  return { nights, rate: room.pricePerNight, roomTotal, fees, discount, pointsUsed, total: Math.round((roomTotal + fees - discount) * 100) / 100 };
}
const MONEY_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const MONEY_DECIMAL_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatMoney = (amount: number, decimals = false) => (decimals ? MONEY_DECIMAL_FORMAT : MONEY_FORMAT).format(amount);
export function formatDateRange(start: string, end: string) {
  const from = parseTravelDate(start); const to = parseTravelDate(end);
  if (!from || !to) return 'Select travel dates';
  const crossYear = from.getFullYear() !== to.getFullYear();
  const format = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', ...(crossYear ? { year: 'numeric' } : {}) });
  return `${format.format(from)} – ${format.format(to)}${crossYear ? '' : `, ${to.getFullYear()}`}`;
}
export const toggleSaved = (ids: string[], id: string) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
export const confirmBooking = (bookings: DemoBooking[], booking: DemoBooking) => bookings.some((item) => item.id === booking.id) ? bookings : [booking, ...bookings];
export const cancelBooking = (bookings: DemoBooking[], id: string) => bookings.map((item) => item.id === id && item.status === 'upcoming' ? { ...item, status: 'cancelled' as const } : item);
export function reviewBooking(bookings: DemoBooking[], id: string, rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment.trim()) return bookings;
  return bookings.map((item) => item.id === id && item.status === 'completed' ? { ...item, review: { rating, comment: comment.trim() } } : item);
}
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
export function filterCatalog(stays: Stay[], filters: SearchFilters) {
  const destination = normalize(filters.destination.split(',')[0]);
  const filtered = stays.flatMap((stay) => {
    const room = availableRoom({ ...stay, roomTiers: stay.roomTiers?.filter((tier) => tier.pricePerNight >= filters.minPrice && tier.pricePerNight <= filters.maxPrice) }, filters);
    const matches =
    (!destination || normalize(`${stay.title} ${stay.location.city} ${stay.location.province}`).includes(destination)) &&
    stay.rating >= filters.rating && (!filters.types.length || filters.types.includes(stay.type)) &&
    filters.amenities.every((amenity) => stay.amenities.some((item) => normalize(item.id) === normalize(amenity) || normalize(item.name).includes(normalize(amenity))));
    return matches && room ? [{ ...stay, pricePerNight: room.pricePerNight, matchedTierId: room.id }] : [];
  });
  return filters.sortBy === 'price' ? filtered.sort((a, b) => a.pricePerNight - b.pricePerNight) : filters.sortBy === 'rating' ? filtered.sort((a, b) => b.rating - a.rating) : filtered;
}
