import { StayImage } from '../ui/StayImage';
import { HeartButton } from '../ui/HeartButton';
import { formatMoney } from '../../utils/frontendState';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, TouchableOpacity } from 'react-native';
import { Star } from '../../constants/icons';
import { Stay } from '../../types/stay';
import { COLORS, RADII, TYPOGRAPHY } from '../../constants/tokens';

interface PropertyCardVerticalProps {
  stay: Stay;
  onPress?: () => void;
  imageSource?: ImageSourcePropType;
}

export const PropertyCardVertical: React.FC<PropertyCardVerticalProps> = ({
  stay,
  onPress,
  imageSource,
}) => {
  const { width } = useUserWindowDimensions();
  const isCompact = width <= 340;
  const cardImage = imageSource ?? { uri: stay.images[0] };

  const handleCardPress = () => {
    onPress?.();
  };

  const formattedPrice = formatMoney(stay.pricePerNight);
  const locationLabel = stay.cityArea?.match(/\(([^)]+)\)/)?.[1]
    ?? stay.cityArea
    ?? `${stay.location.city}, ${stay.location.province}`;

  return (
    <View style={styles.card}>
    <TouchableOpacity
      dataSet={{ interactive: 'card' }}
      activeOpacity={0.88}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={stay.title}
      style={styles.cardTap}
    >
      {/* Thumbnail Left */}
      <View style={styles.imageContainer}>
        <StayImage source={cardImage} style={styles.image} accessibilityLabel={stay.title} />
      </View>

      {/* Info Right */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {stay.title}
          </Text>

        </View>

        <View style={[styles.locationRow, isCompact && styles.locationRowCompact]}>
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <Star size={12} color={COLORS.starGold} fill={COLORS.starGold} />
          <Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text>
          <Text style={styles.reviewText} numberOfLines={1}>({stay.reviewCount} reviews)</Text>
        </View>

        <View style={[styles.priceRow, isCompact && styles.priceRowCompact]}>
          <Text style={[styles.priceText, isCompact && styles.priceTextCompact]}>{formattedPrice}</Text>
          <Text style={[styles.perNightText, isCompact && styles.perNightTextCompact]}>/night</Text>
        </View>
      </View>
    </TouchableOpacity>
    <HeartButton stayId={stay.id} style={styles.wishlistBtn} size={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 124,
    padding: 12,
    borderRadius: RADII.promo,
    backgroundColor: COLORS.bgSurface,
    marginBottom: 10,
    alignItems: 'center',
  },
  cardTap: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'center' },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: RADII.md,
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
    marginLeft: 14,
    justifyContent: 'flex-start',
    height: 100,
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
  locationRowCompact: {
    right: 0,
    bottom: 26,
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
  priceRowCompact: {
    bottom: 0,
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
