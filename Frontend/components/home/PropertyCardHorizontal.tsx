import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Heart, Star, MapPin, ImageOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Stay } from '../../types/stay';
import { COLORS, RADII, TYPOGRAPHY, SHADOWS } from '../../constants/tokens';

interface PropertyCardHorizontalProps {
  stay: Stay;
  onPress?: () => void;
}

export const PropertyCardHorizontal: React.FC<PropertyCardHorizontalProps> = ({
  stay,
  onPress,
}) => {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
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

  return (
    <View style={styles.card}>
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={stay.title}
      style={styles.cardTap}
    >
      {/* Image Banner */}
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
              <ImageOff size={24} color={COLORS.textMuted} />
            ) : (
              <ActivityIndicator color={COLORS.primary} />
            )}
          </View>
        ) : null}

      </View>

      {/* Card Info */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.title} numberOfLines={2}>
            {stay.title}
          </Text>
          <View style={styles.ratingBadge}>
            <Star size={12} color={COLORS.starGold} fill={COLORS.starGold} />
            <Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={13} color={COLORS.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {stay.distanceKm ? `Cách ${stay.distanceKm} km` : `${stay.location.city}, ${stay.location.province}`}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{formattedPrice}đ</Text>
            <Text style={styles.perNightText}> / đêm</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleWishlist}
      accessibilityRole="button"
      accessibilityLabel={isWishlisted ? 'Bỏ lưu chỗ ở' : 'Lưu chỗ ở'}
      style={styles.wishlistBtn}
    >
      <Heart size={15} color={COLORS.primary} fill={isWishlisted ? COLORS.primary : 'transparent'} />
    </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 260,
    height: 345,
    padding: 16,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.bgWhite,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.cardSoft,
  },
  cardTap: { flex: 1 },
  imageContainer: {
    width: '100%',
    height: 171,
    marginBottom: 16,
    borderRadius: RADII.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.bgSecondary,
    position: 'relative',
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
  contentHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.lg,
  },
  ratingText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.dark,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 28,
    right: 28,
    width: 44,
    height: 44,
    borderRadius: RADII.full,
    backgroundColor: COLORS.bgWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    flex: 1,
    paddingRight: 8,
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: TYPOGRAPHY.sizes.lg,
    lineHeight: TYPOGRAPHY.lineHeights.lg,
    color: COLORS.dark,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 20,
    marginTop: 8,
  },
  locationText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: TYPOGRAPHY.sizes.lg,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.dark,
  },
  perNightText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.textMuted,
  },
});
