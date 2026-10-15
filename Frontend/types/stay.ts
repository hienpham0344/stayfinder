import type { MoneyUsd } from './api';
import type { AmenityDto, HostDto, RoomTierDto } from './catalog';
// Complete Stay below is retained for the explicit UI gallery. Live API cards
// carry nullable facts and never borrow facts, images or prices from fixtures.
export type StayCardModel = {
 id:string; title:string; typeId:string; typeName:string; locationLabel:string|null; address:string|null;
 coordinates:{latitude:number;longitude:number}|null; nightlyPrice:MoneyUsd; imageUrl:string|null;
 rating:number|null; reviewCount:number; isFavorite:boolean;
};
export type StayDetailModel = StayCardModel & {
 description:string|null; timezone:string; images:string[]; amenities:AmenityDto[]; cleaningFee:MoneyUsd; serviceFee:MoneyUsd;
 bedrooms:number|null; beds:number|null; baths:number|null; host:HostDto|null;
};
export type RoomTierModel = RoomTierDto;

export interface Host {
  id: string;
  name: string;
  avatar: string;
  isSuperhost: boolean;
  joinedDate: string;
  responseRate: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

export interface RoomTier {
  id: string;
  name: string;
  description: string;
  sizeSqm: number;
  bedType: string;
  pricePerNight: number;
  originalPrice?: number;
  maxGuests: number;
  includesBreakfast: boolean;
  cancellationPolicy: string;
  availableCount: number;
}

export interface PriceProviderComparison {
  providerName: string;
  logoUrl?: string;
  pricePerNight: number;
  isBestValue?: boolean;
}

export interface Stay {
  id: string;
  title: string;
  description: string;
  tagline: string;
  type: 'Hotel' | 'Homestay' | 'Resort' | 'Villas';
  category: 'Trending' | 'Beachfront' | 'Cabins' | 'Mountain' | 'Luxury' | 'Lakefront';
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  distanceKm?: number;
  cityArea?: string;
  location: {
    city: string;
    province: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  images: string[];
  amenities: Amenity[];
  host: Host;
  reviews?: Review[];
  roomTiers?: RoomTier[];
  priceComparisons?: PriceProviderComparison[];
  isFeatured?: boolean;
  isRecommended?: boolean;
  isPopularNearYou?: boolean;
}
