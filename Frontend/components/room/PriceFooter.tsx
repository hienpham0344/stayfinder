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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(12, insets.bottom) }]}>
      <View>
        <Text style={styles.eyebrow}>GIÁ MỖI ĐÊM</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(pricePerNight)} đ
          </Text>
          <Text style={styles.night}>/ đêm</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push(`/booking/checkout?id=${stayId}` as any)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Đặt phòng ngay</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: SIZES.stickyCta, backgroundColor: COLORS.bgMain, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, paddingTop: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.stickyFooter },
  eyebrow: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  night: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  button: { height: SIZES.button, paddingHorizontal: 28, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
});
