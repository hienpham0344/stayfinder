import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../../constants/tokens';

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  onPress?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  title = 'Ưu đãi 25% cho lần đặt phòng đầu tiên',
  subtitle = 'Giảm đến 500k cho thành viên lần đầu đặt homestay & villa',
  tagline = 'ƯU ĐÃI ĐẶC BIỆT',
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    accessibilityRole="button"
    accessibilityLabel={title}
    onPress={onPress}
    style={styles.container}
  >
    <ImageBackground
      source={require('../../assets/figma/home-promo.jpeg')}
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
        <Text style={styles.badge}>{tagline}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.section,
    overflow: 'hidden',
    borderRadius: RADII.promo,
  },
  image: {
    height: 212,
    width: '100%',
    justifyContent: 'flex-start',
  },
  imageContent: {
    width: '100%',
  },
  copy: {
    padding: SPACING.xxl,
    maxWidth: '94%',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentOrange,
    color: COLORS.bgWhite,
    paddingHorizontal: 12,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    fontFamily: TYPOGRAPHY.families.medium,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.bgWhite,
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: TYPOGRAPHY.sizes.xxl,
    lineHeight: TYPOGRAPHY.lineHeights.xxl,
  },
  subtitle: {
    color: COLORS.bgWhite,
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
    marginTop: SPACING.sm,
  },
});
