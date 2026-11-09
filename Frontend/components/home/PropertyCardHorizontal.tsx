import { StayImage } from '../ui/StayImage';
import { HeartButton } from '../ui/HeartButton';
import { formatMoney } from '../../utils/frontendState';
import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, TouchableOpacity } from 'react-native';
import { Star, MapPin } from '../../constants/icons';
import { Stay } from '../../types/stay';
import { COLORS, RADII, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

interface PropertyCardHorizontalProps {
  stay: Stay;
  onPress?: () => void;
  imageSource?: ImageSourcePropType;
  priceLabel?: string;
  imageCrop?: 'figma-desert';
}

export const PropertyCardHorizontal: React.FC<PropertyCardHorizontalProps> = ({
  stay,
  onPress,
  imageSource,
  priceLabel,
  imageCrop,
}) => {
  const cardImage = imageSource ?? { uri: stay.images[0] };

  const handleCardPress = () => {
    onPress?.();
  };

  const formattedPrice = priceLabel ?? formatMoney(stay.pricePerNight);

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
      {/* Image Banner */}
      <View style={styles.imageContainer}>
        <StayImage source={cardImage} style={[styles.image, imageCrop === 'figma-desert' && styles.figmaDesertImage]} accessibilityLabel={stay.title} />

      </View>

      {/* Card Info */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.title} numberOfLines={1}>
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
            {stay.distanceKm ? `${stay.distanceKm.toFixed(1)} km away` : `${stay.location.city}, ${stay.location.province}`}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{formattedPrice}</Text>
            <Text style={styles.perNightText}>/night</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    <HeartButton stayId={stay.id} style={styles.wishlistBtn} size={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 188,
    height: 250,
    padding: 0,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.bgSurface,
    overflow: 'hidden',
  },
  cardTap: { flex: 1 },
  imageContainer: {
    width: '100%',
    height: 132,
    marginBottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.bgSecondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Node 13:1116 sizes the raw desert source to 134.27% of this slot and
  // offsets it 17.13% to the left. This is the Figma crop, not a generic
  // cover calculation.
  figmaDesertImage: {
    width: '134.27%',
    marginLeft: '-17.13%',
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
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.lg,
  },
  ratingText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: 12,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.dark,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: RADII.full,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  title: {
    flex: 1,
    paddingRight: 8,
    fontFamily: TYPOGRAPHY.families.medium,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.dark,
    marginBottom: 0,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 20,
    marginTop: 5,
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
    marginTop: 7,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: 16,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.dark,
  },
  perNightText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: 12,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.textMuted,
  },
});
