import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { COLORS, RADII, TYPOGRAPHY, SHADOWS } from '../../constants/tokens';

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  onPress?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  title = 'Ưu Đãi Đặt Phòng 25%',
  subtitle = 'Giảm đến 500k cho thành viên lần đầu đặt homestay & villa',
  tagline = 'ƯU ĐÃI ĐẶC BIỆT',
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.container}
    >
      {/* Decorative accent elements */}
      <View style={styles.decorativeCircle} />
      <View style={styles.decorativeCircle2} />

      <View style={styles.contentWrapper}>
        <View style={styles.tagBadge}>
          <Sparkles size={12} color={COLORS.primarySoft} />
          <Text style={styles.tagText}>{tagline}</Text>
        </View>

        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.subtitleText}>{subtitle}</Text>

        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Khám phá ngay</Text>
          <View style={styles.ctaIconBg}>
            <ArrowRight size={14} color={COLORS.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: RADII.lg, // 16px
    backgroundColor: COLORS.primary,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.cardSoft,
  },
  decorativeCircle: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(152, 243, 227, 0.15)', // primaryLight alpha
  },
  decorativeCircle2: {
    position: 'absolute',
    right: 40,
    bottom: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  contentWrapper: {
    zIndex: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 32, 28, 0.4)', // primaryContainer translucent
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.full,
    marginBottom: 10,
  },
  tagText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
    color: COLORS.primarySoft,
    letterSpacing: 0.5,
  },
  titleText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.lg, // 20px
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitleText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.sm, // 13px
    color: COLORS.primarySoft,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    marginBottom: 16,
    maxWidth: '85%',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ctaIconBg: {
    width: 24,
    height: 24,
    borderRadius: RADII.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
