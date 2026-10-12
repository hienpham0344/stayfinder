import type { MoneyUsd } from '../types/api';
import type { StayCardDto, StayDetailDto, RoomTierDto } from '../types/catalog';
import type { StayCardModel, StayDetailModel, RoomTierModel } from '../types/stay';
export function formatUsd(money: MoneyUsd): string {
 if (money.currency !== 'USD' || !Number.isSafeInteger(money.amountCents) || money.amountCents < 0) throw new Error('Invalid USD money');
 return '$' + Math.floor(money.amountCents / 100).toLocaleString('en-US') + '.' + String(money.amountCents % 100).padStart(2, '0');
}
export function toStayCard(dto: StayCardDto): StayCardModel {
 formatUsd(dto.nightlyPrice);
 return { id: dto.id, title: dto.name, typeId: dto.typeId, typeName: dto.typeName,
 locationLabel: dto.city || dto.address || null, address: dto.address,
 coordinates: dto.latitude != null && dto.longitude != null ? { latitude: Number(dto.latitude), longitude: Number(dto.longitude) } : null,
 nightlyPrice: { ...dto.nightlyPrice }, imageUrl: dto.coverImageUrl || null, rating: dto.ratingAverage,
 reviewCount: dto.reviewCount, isFavorite: dto.isFavorite };
}
export function toStayDetail(dto: StayDetailDto): StayDetailModel {
 return { ...toStayCard(dto), description: dto.description, timezone: dto.timezone, images: [...dto.imageUrls],
 amenities: dto.amenities.map(a=>({...a})), cleaningFee: { ...dto.cleaningFee }, serviceFee: { ...dto.serviceFee },
 bedrooms: dto.bedrooms, beds: dto.beds, baths: dto.baths, host: dto.host ? { ...dto.host } : null };
}
export function toRoomTier(dto: RoomTierDto): RoomTierModel {
 formatUsd(dto.nightlyPrice);
 return { ...dto, nightlyPrice: { ...dto.nightlyPrice }, imageUrls: [...dto.imageUrls], cancellationPolicy: { ...dto.cancellationPolicy } };
}
