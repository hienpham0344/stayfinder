import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Heart, Star, MapPin } from 'lucide-react-native';
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
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleCardPress}
      style={styles.card}
    >
      {/* Thumbnail Left */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: stay.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{stay.type}</Text>
        </View>
      </View>

      {/* Info Right */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {stay.title}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleWishlist}
            style={styles.wishlistBtn}
          >
            <Heart
              size={18}
              color={isWishlisted ? COLORS.accentRed : COLORS.textMuted}
              fill={isWishlisted ? COLORS.accentRed : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={13} color={COLORS.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {stay.cityArea || `${stay.location.city}, ${stay.location.province}`}
            {stay.distanceKm ? ` • Cách ${stay.distanceKm} km` : ''}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text>
          <Text style={styles.reviewText}>({stay.reviewCount} đánh giá)</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{formattedPrice}đ</Text>
          <Text style={styles.perNightText}> / đêm</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    width: '100%',
    padding: 10,
    borderRadius: RADII.lg, // 16px
    backgroundColor: COLORS.bgWhite,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
    alignItems: 'center',
    ...SHADOWS.cardSoft,
  },
  imageContainer: {
    width: 106,
    height: 106,
    borderRadius: RADII.md, // 12px
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bgSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(24, 29, 27, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.xs,
  },
  typeText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    height: 106,
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.base, // 14px
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
    marginRight: 6,
  },
  wishlistBtn: {
    padding: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
    color: COLORS.dark,
  },
  reviewText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.md, // 16px
    fontWeight: '700',
    color: COLORS.primary,
  },
  perNightText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
  },
});
