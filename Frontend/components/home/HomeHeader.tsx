import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADII, SPACING, SIZES, TYPOGRAPHY, SHADOWS } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

const bellAsset = require('../../assets/figma/se121-parity/home/bell.svg');
const locationAsset = require('../../assets/figma/se121-parity/home/search-location.svg');
const filtersAsset = require('../../assets/figma/se121-parity/home/search-filters.svg');

interface HomeHeaderProps {
  locationName?: string;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  onNotificationPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  locationName = 'Việt Nam',
  onSearchPress,
  onFilterPress,
  onNotificationPress,
}) => {
  const router = useRouter();
  const openSearch = onSearchPress || (() => router.push('/search'));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.visibleGreeting}>Good morning</Text>
          <Text style={styles.greeting}>Chào buổi sáng</Text>
          <Text style={styles.location}>{locationName}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Thông báo"
          accessibilityState={{ disabled: !onNotificationPress }} aria-disabled={!onNotificationPress}
          style={styles.notification}
        >
          <Se121SharedAsset source={bellAsset} width={20} nativeFallback={<Bell size={20} color={COLORS.primary} />} />
        </TouchableOpacity>
      </View>
      <Text style={styles.brand}>StayFinder</Text>
      <View style={styles.searchBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tìm chỗ ở"
          onPress={openSearch}
          style={styles.searchMain}
        >
          <Se121SharedAsset source={locationAsset} width={16} height={20} nativeFallback={<MapPin size={20} color={COLORS.textMuted} />} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>Bạn muốn ở đâu?</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Bộ lọc"
          onPress={onFilterPress || openSearch}
          style={styles.filterButton}
        >
          <Se121SharedAsset source={filtersAsset} width={18} nativeFallback={<SlidersHorizontal size={18} color={COLORS.primary} />} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.section,
    backgroundColor: COLORS.bgMain,
  },
  topRow: {
    height: SIZES.iconButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  greeting: {
    position: 'absolute',
    opacity: 0,
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
    color: COLORS.textMuted,
  },
  visibleGreeting: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
    color: COLORS.textMuted,
  },
  location: {
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.dark,
  },
  notification: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    borderWidth: 1,
    backgroundColor: COLORS.surfaceMint,
    borderColor: COLORS.borderTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: 32,
    color: COLORS.primary,
    marginBottom: 12,
  },
  searchBar: {
    height: SIZES.button,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgWhite,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.cardSoft,
  },
  searchMain: {
    flex: 1,
    minWidth: 0,
    height: SIZES.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingLeft: 17,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.borderDark,
  },
  divider: {
    height: 32,
    width: 1,
    backgroundColor: COLORS.borderTealSoft,
  },
  filterButton: {
    height: SIZES.iconButton,
    width: SIZES.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
