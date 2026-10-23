import type { QuoteSelection } from '../types/catalog';
export type SearchSelection = {
 q: string; locationId?: string; locationLabel?: string; checkIn: string; checkOut: string;
 adults: number; children: number; rooms: number; typeIds: string[]; amenityIds: string[];
 minPriceCents?: number; maxPriceCents?: number; minRating?: number; sort: string; direction: 'asc' | 'desc';
};
export function emptySearchSelection(): SearchSelection {
 return { q: '', checkIn: '', checkOut: '', adults: 2, children: 0, rooms: 1, typeIds: [], amenityIds: [], sort: 'recommended', direction: 'asc' };
}
const copy = (s: SearchSelection): SearchSelection => ({ ...s, typeIds: [...s.typeIds], amenityIds: [...s.amenityIds] });
export const applySearchSelection = copy;
export const cancelSearchSelection = copy;
export class SearchRequestSequencer {
 private sequence = 0;
 next(): number { return ++this.sequence; }
 accept(sequence: number): boolean { return sequence === this.sequence; }
 invalidate(): void { this.sequence++; }
}
function isoDate(value: string): boolean {
 return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function validateSearchSelection(s: SearchSelection, requireDates = false): string {
 if (s.q.trim().length > 100) return 'Destination is too long.';
 if (!!s.checkIn !== !!s.checkOut || (requireDates && !s.checkIn)) return 'Choose check-in and check-out dates.';
 if (s.checkIn && (!isoDate(s.checkIn) || !isoDate(s.checkOut))) return 'Use valid dates in YYYY-MM-DD format.';
 if (s.checkIn) {
  const nights = (Date.parse(s.checkOut) - Date.parse(s.checkIn)) / 86400000;
  if (nights < 1 || nights > 90) return 'Choose a stay between 1 and 90 nights.';
 }
 if (!Number.isInteger(s.adults) || s.adults < 1 || s.adults > 20 || !Number.isInteger(s.children) || s.children < 0 || s.children > 20 ||
     !Number.isInteger(s.rooms) || s.rooms < 1 || s.rooms > 10) return 'Choose 1–20 adults, 0–20 children and 1–10 rooms.';
 for (const price of [s.minPriceCents, s.maxPriceCents]) if (price != null && (!Number.isSafeInteger(price) || price < 0)) return 'Enter a valid USD price.';
 if (s.minPriceCents != null && s.maxPriceCents != null && s.minPriceCents > s.maxPriceCents) return 'Minimum price must not exceed maximum price.';
 return '';
}
export function parseUsdCents(value: string): number | undefined {
 if (!value.trim()) return undefined;
 if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('Use a positive USD amount with at most two decimals.');
 const [whole, fraction = ''] = value.trim().split('.');
 const cents = Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
 if (!Number.isSafeInteger(cents)) throw new Error('Price is too large.');
 return cents;
}
export function selectionForRoom(s: SearchSelection, accommodationId: string, roomId: string): QuoteSelection {
 const error = validateSearchSelection(s, true); if (error) throw new Error(error);
 return { accommodationId, roomId, checkIn: s.checkIn, checkOut: s.checkOut, quantity: s.rooms, adults: s.adults, children: s.children };
}
export function quoteSelectionParams(s: QuoteSelection): Record<string,string> {
 return Object.fromEntries(Object.entries(s).map(([key,value])=>[key,String(value)]));
}
