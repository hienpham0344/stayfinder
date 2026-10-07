import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Heart, Star, ImageOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Stay } from '../../types/stay';
import { COLORS, RADII, TYPOGRAPHY, SHADOWS } from '../../constants/tokens';

interface PropertyCardVerticalProps {
  stay: Stay;
  onPress?: () => void;
}

export const PropertyCardVertical: React.FC<PropertyCardVerticalProps> = ({
  stay,
  onPress,
}) => {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const { width } = useUserWindowDimensions();
  const isCompact = width <= 340;
  const imageSource = useMemo(() => ({ uri: stay.images[0] }), [stay.images[0]]);

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/room/${stay.id}`);
    }
  };

  const toggleWishlist = (e: any) => {
    e.stopPropagation?.();
    setIsWishlisted(!isWishlisted);
  };

  const formattedPrice = new Intl.NumberFormat('vi-VN').format(stay.pricePerNight);
  const locationLabel = stay.cityArea?.match(/\(([^)]+)\)/)?.[1]
    ?? stay.cityArea
    ?? `${stay.location.city}, ${stay.location.province}`;

  return (
    <View style={styles.card}>
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={stay.title}
      style={styles.cardTap}
    >
      {/* Thumbnail Left */}
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={stay.title}
          onLoad={() => setImageState('loaded')}
          onError={() => setImageState('error')}
        />
        {imageState !== 'loaded' ? (
          <View
            accessibilityRole="image"
            accessibilityLabel={imageState === 'error' ? 'Không thể tải ảnh chỗ ở' : 'Đang tải ảnh chỗ ở'}
            style={styles.imageFallback}
          >
            {imageState === 'error' ? (
              <ImageOff size={20} color={COLORS.textMuted} />
            ) : (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )}
          </View>
        ) : null}
      </View>

      {/* Info Right */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {stay.title}
          </Text>

        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <Star size={12} color={COLORS.starGold} fill={COLORS.starGold} />
          <Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text>
          <Text style={styles.reviewText} numberOfLines={1}>({stay.reviewCount} đánh giá)</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={[styles.priceText, isCompact && styles.priceTextCompact]}>{formattedPrice}đ</Text>
          <Text style={[styles.perNightText, isCompact && styles.perNightTextCompact]}> / đêm</Text>
        </View>
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleWishlist}
      style={styles.wishlistBtn}
      accessibilityRole="button"
      accessibilityLabel={isWishlisted ? 'Bỏ lưu chỗ ở' : 'Lưu chỗ ở'}
    >
      <Heart size={15} color={COLORS.primary} fill={isWishlisted ? COLORS.primary : 'transparent'} />
    </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 128,
    padding: 16,
    borderRadius: RADII.promo,
    backgroundColor: COLORS.bgWhite,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
    alignItems: 'center',
    ...SHADOWS.cardSoft,
  },
  cardTap: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'center' },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: RADII.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bgSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
    justifyContent: 'flex-start',
    height: 96,
    paddingTop: 4,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 32,
  },
  title: {
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.dark,
    flex: 1,
    marginRight: 6,
  },
  wishlistBtn: {
    position: 'absolute',
    right: 2,
    top: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    position: 'absolute',
    left: 0,
    right: 108,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    flex: 1,
  },
  ratingRow: {
    height: 24,
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.dark,
  },
  reviewText: {
    flexShrink: 1,
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.textMuted,
  },
  priceRow: {
    position: 'absolute',
    right: 0,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: TYPOGRAPHY.sizes.lg,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.dark,
  },
  priceTextCompact: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.base,
  },
  perNightText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    color: COLORS.textMuted,
  },
  perNightTextCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
});
