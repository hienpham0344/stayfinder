import { useUserWindowDimensions } from './useUserWindowDimensions';
import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { router } from 'expo-router';
import { CalendarCheck, Heart, Home, Search, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SIZES, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset, componentNavigationAsset, fullFrameNavigationAsset } from './Se121SharedAssets';

const ITEMS = [
  { label: 'Home', route: '/', icon: Home },
  { label: 'Search', route: '/(tabs)/search', icon: Search },
  { label: 'Bookings', route: '/(tabs)/bookings', icon: CalendarCheck },
  { label: 'Wishlist', route: '/(tabs)/wishlist', icon: Heart },
  { label: 'Profile', route: '/(tabs)/profile', icon: User },
] as const;

export function UserBottomNavigation({ active = 'Profile', variant = 'fullFrame' }: { active?: typeof ITEMS[number]['label']; variant?: 'fullFrame' | 'component' }) {
  const insets = useSafeAreaInsets();
  const { width } = useUserWindowDimensions();
  const compact = width <= 340;
  const activeIndex = ITEMS.findIndex(item => item.label === active);
  const fullFrame = variant === 'fullFrame';
  return <View style={[styles.container, fullFrame ? styles.fullFrame : styles.component, { height: SIZES.bottomNav + insets.bottom, paddingBottom: 8 + insets.bottom }]}>
    {ITEMS.map(({ label, route, icon: Icon }, index) => {
      const selected = active === label;
      return <Pressable key={label} style={styles.item} onPress={() => router.replace(route as never)} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} aria-selected={selected}><Se121SharedAsset source={fullFrame ? fullFrameNavigationAsset(index, activeIndex) : componentNavigationAsset(index, activeIndex)} width={24} nativeFallback={<Icon size={24} color={selected ? COLORS.primary : COLORS.textSecondary} fill={selected && [0,3,4].includes(index) ? COLORS.primary : 'none'} />} /><Text numberOfLines={1} style={[styles.label, compact && styles.compactLabel, fullFrame && styles.fullFrameLabel, selected && styles.selectedLabel, selected && (fullFrame || index === 4) && styles.selectedBold]}>{label}</Text></Pressable>;
    })}
    {fullFrame && <View pointerEvents="none" style={[styles.indicator, { left: Math.round(width * (activeIndex + 0.5) / 5 - 15), bottom: 1 + insets.bottom }]} />}
  </View>;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingTop: 8, backgroundColor: COLORS.bgWhite },
  fullFrame: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.borderTealSoft, ...(Platform.OS === 'web' ? { boxShadow: '0px -8px 14px rgba(5,31,26,0.14)' } : { elevation: 8, shadowColor: '#051F1A', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.14, shadowRadius: 14 }) },
  component: { borderTopLeftRadius: 32, borderTopRightRadius: 32, ...(Platform.OS === 'web' ? { boxShadow: '0px -4px 6px rgba(0,0,0,0.04)' } : SHADOWS.bottomNavLight) },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  compactLabel: { fontSize: 10 },
  fullFrameLabel: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular },
  selectedLabel: { color: COLORS.primary },
  selectedBold: { fontFamily: TYPOGRAPHY.families.bold },
  indicator: { position: 'absolute', width: 28, height: 3, borderRadius: 1.5, backgroundColor: COLORS.primary },
});
