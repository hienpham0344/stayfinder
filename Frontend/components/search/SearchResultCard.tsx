import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Building, Car, CheckCircle2, Coffee, Flame, ImageOff, Star, Tv, Umbrella, Waves, Wifi, Wind } from 'lucide-react-native';
import { router } from 'expo-router';
import { Stay } from '../../types/stay';
import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

interface SearchResultCardProps {
  stay: Stay;
}

const AMENITY_ICONS: Record<string, typeof Wifi> = { Wifi, Flame, Car, Waves, Umbrella, Coffee, Wind, Tv, Building };

export function SearchResultCard({ stay }: SearchResultCardProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const compact = useUserWindowDimensions().width <= 340;
  const ratingAtTop = stay.type === 'Hotel' || stay.type === 'Resort';
  const rating = <View style={styles.rating}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/result-rating-star.svg')} width={11.6667} height={11.0833} nativeFallback={<Star size={11.6667} fill={COLORS.primary} color={COLORS.primary} />} /><Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text></View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem ${stay.title}`}
      onPress={() => router.push(`/room/${stay.id}` as never)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.surface}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: stay.images[0] }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={stay.title}
          onLoad={() => setImageState('loaded')}
          onError={() => setImageState('error')}
        />
        {imageState !== 'loaded' && <View accessibilityRole="image" accessibilityLabel={imageState === 'error' ? 'Không thể tải ảnh chỗ ở' : 'Đang tải ảnh chỗ ở'} style={styles.imageFallback}>{imageState === 'error' ? <ImageOff size={20} color={COLORS.textMuted} /> : <ActivityIndicator size="small" color={COLORS.primary} />}</View>}
        {stay.isFeatured && <View style={styles.badge}><Text style={styles.badgeText}>Nổi bật</Text></View>}
      </View>
      <View style={styles.content}>
        <View style={styles.heading}>
          <View style={styles.titleRow}><Text numberOfLines={1} style={styles.title}>{stay.title}</Text>{ratingAtTop && rating}</View>
          <Text numberOfLines={1} style={styles.location}>{stay.location.city}</Text>
        </View>
        <View style={styles.amenities} accessibilityRole="image" accessibilityLabel={`${stay.amenities.map((amenity) => amenity.name).join(', ')} · ${stay.bedrooms} phòng ngủ · ${stay.maxGuests} khách`}>
          {stay.amenities.map((amenity) => { const Icon = AMENITY_ICONS[amenity.icon] || CheckCircle2; return <Icon key={amenity.id} size={16} color={COLORS.textMuted} />; })}
        </View>
        <View style={styles.footer}>
          {!ratingAtTop && rating}
          <View style={[styles.price, compact && styles.compactPrice]}><Text numberOfLines={1} style={[styles.priceText, compact && styles.compactPriceText]}>{new Intl.NumberFormat('vi-VN').format(stay.pricePerNight)}đ</Text><Text numberOfLines={1} style={[styles.night, compact && styles.compactNight]}>/đêm</Text></View>
        </View>
      </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: 144, marginBottom: 24, backgroundColor: COLORS.bgWhite, borderRadius: RADII.xl, ...SHADOWS.cardSoft },
  surface: { flex: 1, flexDirection: 'row', borderRadius: RADII.xl, overflow: 'hidden' },
  cardPressed: { opacity: 0.96, transform: [{ scale: 0.985 }], boxShadow: '0px 3.94px 11.82px 0px rgba(0,0,0,0.04)', shadowColor: '#000000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 3.94 }, shadowRadius: 5.91, elevation: 7 },
  imageWrap: { flexBasis: '33.333%', maxWidth: 116.66, position: 'relative', backgroundColor: COLORS.bgSecondary },
  image: { width: '100%', height: '100%', minHeight: 144 },
  imageFallback: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: COLORS.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 8, left: 8, borderRadius: RADII.full, backgroundColor: COLORS.accentOrange, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  content: { flex: 1, minWidth: 0, padding: 16, justifyContent: 'space-between' },
  title: { flex: 1, minWidth: 0, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  heading: { gap: 4, width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 },
  location: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  amenities: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3.99 },
  ratingText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  price: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end' },
  priceText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  night: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  compactPrice: { flexDirection: 'column', alignItems: 'flex-end' },
  compactPriceText: { fontSize: 15, lineHeight: 18 },
  compactNight: { fontSize: 11, lineHeight: 14 },
});
