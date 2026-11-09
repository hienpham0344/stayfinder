import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Bell, Compass, Search, SlidersHorizontal } from '../../constants/icons';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '../../constants/tokens';

interface HomeHeaderProps {
  locationName?: string;
  onSearchPress?: () => void;
  onLocationPress?: () => void;
  onFilterPress?: () => void;
  onNotificationPress?: () => void;
}

export function HomeHeader({ locationName = 'Find your next escape', onSearchPress, onLocationPress, onFilterPress, onNotificationPress }: HomeHeaderProps) {
  const router = useRouter();
  const openSearch = onSearchPress ?? (() => router.push('/search'));
  return <View style={s.header}>
    <View style={s.top}>
      <Pressable onPress={onLocationPress ?? openSearch} style={s.brandRow} accessibilityRole="button" accessibilityLabel="StayFinder, choose destination">
        <View style={s.mark}><Compass size={24} color={COLORS.primary} strokeWidth={1.3} /></View>
        <View><Text style={s.brand}>StayFinder</Text><Text style={s.tagline}>{locationName}</Text></View>
      </Pressable>
      <Pressable onPress={onNotificationPress} disabled={!onNotificationPress} style={s.bell} accessibilityRole="button" accessibilityLabel="Notifications"><Bell size={21} strokeWidth={1.5} color={COLORS.primary} /></Pressable>
    </View>
    <View style={s.search}>
      <Pressable onPress={openSearch} style={s.searchMain} accessibilityRole="button" accessibilityLabel="Find your stay"><Search size={20} color={COLORS.primary} strokeWidth={1.5} /><Text numberOfLines={1} style={s.placeholder}>Where will you find yourself?</Text></Pressable>
      <Pressable onPress={onFilterPress ?? openSearch} style={s.filter} accessibilityRole="button" accessibilityLabel="Filters"><SlidersHorizontal size={19} color={COLORS.primary} strokeWidth={1.5} /></Pressable>
    </View>
  </View>;
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, backgroundColor: COLORS.bgMain },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 42, height: 42, borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  brand: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 23, letterSpacing: -0.8, lineHeight: 30 },
  tagline: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 17 },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderControl, borderRadius: 16, minHeight: 58 },
  searchMain: { flex: 1, minWidth: 0, paddingLeft: 16, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', gap: 10 },
  placeholder: { flex: 1, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, color: COLORS.textSecondary },
  filter: { width: 50, height: 44, borderLeftWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' },
});
