import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Star, Wifi } from 'lucide-react-native';
import { router } from 'expo-router';
import { Stay } from '../../types/stay';
import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../../constants/tokens';

interface SearchResultCardProps {
  stay: Stay;
}

export function SearchResultCard({ stay }: SearchResultCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem ${stay.title}`}
      onPress={() => router.push(`/room/${stay.id}` as never)}
      style={styles.card}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: stay.images[0] }} style={styles.image} />
        {stay.isFeatured && (
          <View style={styles.badge}><Text style={styles.badgeText}>Nổi bật</Text></View>
        )}
      </View>
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>{stay.title}</Text>
        <View style={styles.locationRow}>
          <MapPin size={13} color={COLORS.inkSubtle} />
          <Text numberOfLines={1} style={styles.location}>{stay.location.city}</Text>
        </View>
        <View style={styles.amenities}>
          {stay.amenities.some((amenity) => amenity.id === 'wifi') && <Wifi size={17} color={COLORS.inkSubtle} />}
          <Text numberOfLines={1} style={styles.amenityText}>{stay.bedrooms} phòng ngủ · {stay.maxGuests} khách</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.rating}><Star size={13} fill={COLORS.actionTeal} color={COLORS.actionTeal} /><Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text></View>
          <View style={styles.price}><Text style={styles.priceText}>{new Intl.NumberFormat('vi-VN').format(stay.pricePerNight)}đ</Text><Text style={styles.night}>/đêm</Text></View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', minHeight: 144, marginBottom: 16, backgroundColor: COLORS.bgWhite, borderRadius: RADII.promo, overflow: 'hidden', ...SHADOWS.cardSoft },
  imageWrap: { width: 116, position: 'relative' },
  image: { width: '100%', height: '100%', minHeight: 144 },
  badge: { position: 'absolute', top: 13, left: 8, borderRadius: RADII.full, backgroundColor: COLORS.accentOrange, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 10 },
  content: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'space-between' },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18, lineHeight: 23 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, flexShrink: 1 },
  amenities: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  amenityText: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 11 },
  price: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 1 },
  priceText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.bold, fontSize: 15 },
  night: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 10 },
});
