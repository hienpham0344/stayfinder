import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';

// Render of the image-only Figma layer 13:1057, without text or gradient.
const promoImage = require('../../assets/figma/se121-parity/home/promo-photo-13-1057.png');

export function PromoBanner({ onPress }: { onPress?: () => void }) {
  const { width } = useUserWindowDimensions();
  const compact = width <= 340;
  const bannerWidth = width - SPACING.xl * 2;
  return <TouchableOpacity
    activeOpacity={0.9}
    accessibilityRole="button"
    accessibilityLabel="Special offer: save 20 percent on your first booking"
    onPress={onPress}
    style={[styles.container, { width: bannerWidth, height: bannerWidth * 212 / 350 }]}
  >
    <Image source={promoImage} resizeMode="cover" style={styles.image} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs><LinearGradient id="promoShade" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={COLORS.overlayBlack} stopOpacity={0.72} /><Stop offset="1" stopColor={COLORS.overlayBlack} stopOpacity={0.08} /></LinearGradient></Defs>
        <Rect width="100%" height="100%" fill="url(#promoShade)" />
      </Svg>
      <View style={[styles.copy, compact && styles.compactCopy]}>
        <Text style={[styles.badge, compact && styles.compactBadge]}>SPECIAL OFFER</Text>
        <Text style={[styles.title, compact && styles.compactTitle]}>Save 20% on{'\n'}your first booking</Text>
      </View>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { marginHorizontal: SPACING.xl, marginBottom: SPACING.section, overflow: 'hidden', ...SHADOWS.cardSoft },
  image: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  copy: { flex: 1, alignItems: 'flex-start', padding: SPACING.xxl },
  compactCopy: { padding: 16 },
  badge: { alignSelf: 'flex-start', backgroundColor: COLORS.accentOrange, color: COLORS.bgWhite, overflow: 'hidden', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 9999, fontFamily: TYPOGRAPHY.families.medium, fontSize: TYPOGRAPHY.sizes.xs, letterSpacing: 0.6, lineHeight: TYPOGRAPHY.lineHeights.xs, marginBottom: SPACING.md },
  compactBadge: { marginBottom: 8 },
  title: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.bold, fontSize: TYPOGRAPHY.sizes.xxl, letterSpacing: -0.64, lineHeight: TYPOGRAPHY.lineHeights.xxl },
  compactTitle: { fontSize: 26, lineHeight: 32, letterSpacing: -0.52 },
});
