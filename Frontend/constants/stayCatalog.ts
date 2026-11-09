import type { ImageSourcePropType } from 'react-native';
import type { Stay } from '../types/stay';
import { MOCK_STAYS } from './mockStays';

// One USD catalog for the interactive demo. Original fixtures remain available to the UI gallery.
const baseStays: Stay[] = MOCK_STAYS.map((stay) => ({
  ...stay,
  pricePerNight: stay.pricePerNight / 10000,
  cleaningFee: stay.cleaningFee / 10000,
  serviceFee: stay.serviceFee / 10000,
  amenities: [{ id: 'wifi', name: 'Wi-Fi', icon: 'Wifi' }, ...stay.amenities.filter((item) => item.id !== 'wifi')],
  roomTiers: stay.roomTiers?.length ? stay.roomTiers.map((room) => ({ ...room, pricePerNight: room.pricePerNight / 10000, originalPrice: room.originalPrice ? room.originalPrice / 10000 : undefined })) : [
    { id: `${stay.id}-standard`, name: 'Standard Room', description: 'A comfortable stay with all the essentials.', sizeSqm: 32, bedType: '1 King', pricePerNight: stay.pricePerNight / 10000, maxGuests: stay.maxGuests, availableCount: 4, includesBreakfast: true, cancellationPolicy: 'Free cancellation up to 48 hours before check-in' },
  ],
  priceComparisons: stay.priceComparisons?.map((provider) => ({ ...provider, pricePerNight: provider.pricePerNight / 10000 })),
}));
const villa: Stay = {
  ...baseStays[0], id: 'villa-azure', title: 'Villa Azure Retreat', type: 'Villas', category: 'Beachfront',
  pricePerNight: 299, cleaningFee: 60, serviceFee: 75, rating: 4.9, reviewCount: 120,
  location: { city: 'Bali', province: 'Indonesia', address: 'Coastal Bali, Indonesia' },
  description: 'Wake up to ocean views, unwind by the pool, and settle into a peaceful island escape. Spacious rooms and thoughtful touches make every day feel effortless.',
  amenities: [{ id: 'wifi', name: 'Wi-Fi', icon: 'Wifi' }, { id: 'pool', name: 'Pool', icon: 'Waves' }, { id: 'breakfast', name: 'Breakfast', icon: 'Coffee' }, { id: 'ac', name: 'AC', icon: 'Wind' }],
  roomTiers: [
    { id: 'azure-deluxe', name: 'Deluxe Ocean View', description: 'Ocean views, a private balcony and a king-size bed.', sizeSqm: 42, bedType: '1 King', pricePerNight: 299, maxGuests: 3, availableCount: 3, includesBreakfast: true, cancellationPolicy: 'Free cancellation up to 48 hours before check-in' },
    { id: 'azure-suite', name: 'Premium Suite', description: 'A spacious suite with a kitchenette and lounge access.', sizeSqm: 74, bedType: '1 King, 1 Sofa', pricePerNight: 450, maxGuests: 4, availableCount: 2, includesBreakfast: true, cancellationPolicy: 'Free cancellation up to 7 days before check-in' },
  ],
  priceComparisons: [{ providerName: 'Traveloka', pricePerNight: 309 }, { providerName: 'Booking.com', pricePerNight: 319 }, { providerName: 'StayFinder', pricePerNight: 299, isBestValue: true }],
};
const extras: Stay[] = [
  { ...villa, id: 'villa-amala-sanctuary', title: 'Villa Amala Sanctuary', pricePerNight: 340, rating: 4.96, location: { city: 'Ubud', province: 'Bali', address: 'Ubud, Bali, Indonesia' }, description: 'A quiet pool villa surrounded by tropical greenery in Ubud.', roomTiers: villa.roomTiers!.map((room, index) => ({ ...room, id: `amala-${index}`, name: index ? 'Sanctuary Suite' : 'Pool Villa', pricePerNight: index ? 490 : 340 })), priceComparisons: [] },
  { ...villa, id: 'aurora-glass-cabin', title: 'Aurora Glass Cabin', type: 'Homestay', category: 'Mountain', pricePerNight: 520, rating: 4.85, location: { city: 'Tromsø', province: 'Norway', address: 'Tromsø, Norway' }, description: 'A cozy glass cabin for mountain views, quiet evenings and northern skies.', roomTiers: [{ ...villa.roomTiers![0], id: 'aurora-cabin', name: 'Glass Cabin', pricePerNight: 520 }], priceComparisons: [] },
  { ...villa, id: 'le-marais-loft', title: 'Le Marais Loft', type: 'Homestay', category: 'Trending', pricePerNight: 280, rating: 4.92, location: { city: 'Paris', province: 'France', address: 'Le Marais, Paris, France' }, description: 'A bright city apartment in the heart of Le Marais.', roomTiers: [{ ...villa.roomTiers![0], id: 'marais-loft', name: 'City Loft', pricePerNight: 280 }], priceComparisons: [] },
];
export const STAY_CATALOG = [...baseStays, villa, ...extras];
export const findStay = (id?: string) => STAY_CATALOG.find((stay) => stay.id === id);
export const STAY_IMAGES: Record<string, ImageSourcePropType> = {
  'stay-alpine': require('../assets/figma/se121-parity/gallery/the-alpine-lodge.png'),
  'stay-desert': require('../assets/figma/se121-parity/home/recommended-desert.jpeg'),
  'stay-urban': require('../assets/figma/se121-parity/home/popular-urban.png'),
  'stay-ivy': require('../assets/figma/se121-parity/home/popular-ivy.png'),
  'villa-azure': require('../assets/figma/se121-parity/gallery/villa-photo-1.png'),
  'villa-amala-sanctuary': require('../assets/figma/se121-parity/wishlist/villa-amala-sanctuary.jpeg'),
  'aurora-glass-cabin': require('../assets/figma/se121-parity/wishlist/aurora-glass-cabin.jpeg'),
  'le-marais-loft': require('../assets/figma/se121-parity/wishlist/le-marais-loft.jpeg'),
};
const ROOM_IMAGES: Record<string, ImageSourcePropType> = {
  'azure-deluxe': require('../assets/figma/se121-parity/room-selection/deluxe-ocean-view.jpeg'),
  'azure-suite': require('../assets/figma/se121-parity/room-selection/premium-suite.jpeg'),
};
export const stayImage = (stay: Stay, tierId?: string): ImageSourcePropType =>
  (tierId && stay.roomTiers?.some((room) => room.id === tierId) ? ROOM_IMAGES[tierId] : undefined) ?? STAY_IMAGES[stay.id] ?? { uri: stay.images[0] };

const VILLA_GALLERY: ImageSourcePropType[] = [
  STAY_IMAGES['villa-azure'],
  require('../assets/figma/se121-parity/gallery/villa-photo-2.png'),
  require('../assets/figma/se121-parity/gallery/villa-photo-3.png'),
];

export const stayGallery = (stay: Stay): ImageSourcePropType[] =>
  stay.id === 'villa-azure' ? VILLA_GALLERY : [stayImage(stay)];
