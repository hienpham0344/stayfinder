import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, Heart, Home, Search, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, SIZES, TYPOGRAPHY } from '../../constants/tokens';

const ITEMS = [
  { label: 'Trang chủ', route: '/', icon: Home },
  { label: 'Tìm kiếm', route: '/(tabs)/search', icon: Search },
  { label: 'Đặt phòng', route: '/(tabs)/bookings', icon: CalendarDays },
  { label: 'Yêu thích', route: '/(tabs)/wishlist', icon: Heart },
  { label: 'Tài khoản', route: '/(tabs)/profile', icon: User },
] as const;

export function UserBottomNavigation({ active = 'Tài khoản' }: { active?: typeof ITEMS[number]['label'] }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.container, { height: SIZES.bottomNav + insets.bottom, paddingBottom: 8 + insets.bottom }]}>
    {ITEMS.map(({ label, route, icon: Icon }) => {
      const selected = active === label;
      return <Pressable key={label} style={styles.item} onPress={() => router.replace(route as never)} accessibilityState={{ selected }}><Icon size={22} color={selected ? COLORS.primary : COLORS.inkSoft} fill={selected && label === 'Yêu thích' ? COLORS.primary : 'none'} /><Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>{selected && <View style={styles.indicator} />}</Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: COLORS.bgWhite, borderTopLeftRadius: RADII.promo, borderTopRightRadius: RADII.promo, borderTopWidth: 1, borderTopColor: COLORS.borderLight, ...SHADOWS.bottomNavLight },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 10 },
  selectedLabel: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold },
  indicator: { position: 'absolute', bottom: -5, width: 28, height: 3, borderRadius: RADII.full, backgroundColor: COLORS.primary },
});
