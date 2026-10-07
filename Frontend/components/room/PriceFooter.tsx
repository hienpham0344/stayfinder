import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, SIZES, TYPOGRAPHY } from '../../constants/tokens';

interface PriceFooterProps {
  stayId: string;
  pricePerNight: number;
}

export const PriceFooter: React.FC<PriceFooterProps> = ({ stayId, pricePerNight }) => {
  const insets = useSafeAreaInsets();
  const compact = useUserWindowDimensions().width <= 340;
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <View style={[styles.container, { height: 104 + insets.bottom, paddingBottom: 16 + insets.bottom }]}>
      <View style={styles.priceBlock}>
        <Text style={styles.eyebrow}>GIÁ MỖI ĐÊM</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, compact && styles.compactPrice]}>
            {formatPrice(pricePerNight)} đ
          </Text>
          <Text style={[styles.night, compact && styles.compactNight]}>/ đêm</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push(`/booking/checkout?id=${stayId}` as any)}
        style={({ pressed }) => [styles.button, compact && styles.compactButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Đặt phòng ngay"
      >
        <Text style={[styles.buttonText, compact && styles.compactButtonText]}>Đặt phòng ngay</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.bgMain, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, paddingTop: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.stickyFooter },
  priceBlock: { flex: 1, minWidth: 0 },
  eyebrow: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  compactPrice: { fontSize: 16 },
  night: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  compactNight: { fontSize: 11 },
  button: { width: 152, height: SIZES.button, paddingHorizontal: 16, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  compactButton: { width: 128 },
  buttonText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  compactButtonText: { fontSize: 12 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.98 }] },
});
