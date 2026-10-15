import type { MoneyUsd, PageResponse } from './api';
export type CatalogOption = { id: string; name: string };
export type AmenityDto = CatalogOption & { iconKey: string | null };
export type LocationDto = { id: string; label: string; city: string; country: string };
export type CatalogFilters = {
 propertyTypes: CatalogOption[]; amenities: AmenityDto[]; locations: LocationDto[]; sorts: string[];
 maxNights: number; maxAdults: number; maxChildren: number; maxRooms: number;
};
export type StayCardDto = {
 id: string; name: string; typeId: string; typeName: string; city: string | null; address: string | null;
 latitude: number | null; longitude: number | null; nightlyPrice: MoneyUsd; coverImageUrl: string | null;
 ratingAverage: number | null; reviewCount: number; isFavorite: boolean;
};
export type HostDto = { id: string; fullName: string | null; avatarUrl: string | null };
export type StayDetailDto = StayCardDto & {
 description: string | null; timezone: string; imageUrls: string[]; amenities: AmenityDto[];
 cleaningFee: MoneyUsd; serviceFee: MoneyUsd; bedrooms: number | null; beds: number | null; baths: number | null;
 host: HostDto | null;
};
export type RoomTierDto = {
 id: string; accommodationId: string; name: string; description: string | null; nightlyPrice: MoneyUsd;
 sizeSqm: number | null; bedType: string | null; maxGuestsPerRoom: number; stockTotal: number; availableCount: number;
 includesBreakfast: boolean | null; imageUrls: string[];
 cancellationPolicy: { freeBeforeCheckIn: boolean; checkInLocalTime: string; timezone: string };
};
export type QuoteSelection = {
 accommodationId: string; roomId: string; checkIn: string; checkOut: string; quantity: number; adults: number; children: number;
};
export type ComparisonOffer = {
 providerName: string; total: MoneyUsd; nightlyPrice: MoneyUsd; includesFees: boolean; cancellationDescription: string;
 observedAt: string; isDemo: boolean; isBestValue: boolean;
};
export type ComparisonResult = QuoteSelection & { offers: ComparisonOffer[] };
export type FavoriteDto = { favoriteId: string; accommodation: StayCardDto };
export type CatalogPage = PageResponse<StayCardDto>;
