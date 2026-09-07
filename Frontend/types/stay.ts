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

export interface Stay {
  id: string;
  title: string;
  description: string;
  tagline: string;
  type: 'Homestay' | 'Villa' | 'Apartment' | 'Cabin' | 'Resort';
  category: 'Beachfront' | 'Cabins' | 'Mountain' | 'Luxury' | 'Lakefront' | 'Trending';
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
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
  isFeatured?: boolean;
}
