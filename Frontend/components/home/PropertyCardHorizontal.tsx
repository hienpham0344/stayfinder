import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Heart, Star, MapPin } from 'lucide-react-native';
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
      {/* Image Banner */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: stay.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text>
        </View>

        {/* Wishlist Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleWishlist}
          style={styles.wishlistBtn}
        >
          <Heart
            size={16}
            color={isWishlisted ? COLORS.accentRed : '#FFFFFF'}
            fill={isWishlisted ? COLORS.accentRed : 'rgba(0, 0, 0, 0.25)'}
          />
        </TouchableOpacity>
      </View>

      {/* Card Info */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {stay.title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={13} color={COLORS.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {stay.location.city}, {stay.location.province}
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
  );
};

const styles = StyleSheet.create({
  card: {
    width: 260,
    borderRadius: RADII.lg, // 16px
    backgroundColor: COLORS.bgWhite,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.cardSoft,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.bgSecondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(24, 29, 27, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  ratingText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 14,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.base, // 14px
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
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
