import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/tokens';

const promoImage = require('../../assets/figma/se121-parity/home/promo-banner.png');

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  onPress?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  title = 'Ưu đãi 25% cho lần đặt phòng đầu tiên',
  subtitle,
  tagline = 'ƯU ĐÃI ĐẶC BIỆT',
  onPress,
}) => {
  return <TouchableOpacity
    activeOpacity={0.9}
    accessibilityRole="button"
    accessibilityLabel="Special offer: save 20 percent on your first booking"
    onPress={onPress}
    style={styles.container}
  >
    <ImageBackground
      source={promoImage}
      resizeMode="cover"
      style={styles.image}
      imageStyle={styles.imageContent}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="promoShade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={COLORS.overlayBlack} stopOpacity={0.72} />
            <Stop offset="1" stopColor={COLORS.overlayBlack} stopOpacity={0.08} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#promoShade)" />
      </Svg>
      <View style={styles.copy}>
        <Text style={styles.badge}>SPECIAL OFFER</Text>
        <Text style={styles.title}>Save 20% on{'\n'}your first booking</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>;
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 350 / 212,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.section,
    overflow: 'hidden',
    borderRadius: RADII.promo,
    ...SHADOWS.cardSoft,
  },
  image: {
    flex: 1,
  },
  imageContent: {
    borderRadius: RADII.promo,
  },
  copy: {
    flex: 1,
    alignItems: 'flex-start',
    padding: SPACING.xxl,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentOrange,
    color: COLORS.bgWhite,
    overflow: 'hidden',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
    fontFamily: TYPOGRAPHY.families.medium,
    fontSize: TYPOGRAPHY.sizes.xs,
    letterSpacing: 0.6,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.bgWhite,
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: TYPOGRAPHY.sizes.xxl,
    letterSpacing: -0.64,
    lineHeight: TYPOGRAPHY.lineHeights.xxl,
  },
});
