import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
  onLocationPress?: () => void;
  onFilterPress?: () => void;
  onNotificationPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  locationName = 'Bali, Indonesia',
  onSearchPress,
  onLocationPress,
  onFilterPress,
  onNotificationPress,
}) => {
  const router = useRouter();
  const openSearch = onSearchPress || (() => router.push('/search'));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={onLocationPress} accessibilityRole="button" accessibilityLabel="Choose location">
          <Text style={styles.visibleGreeting}>Good morning</Text>
          <Text style={styles.location}>{locationName}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
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
          accessibilityLabel="Find your stay"
          onPress={openSearch}
          style={styles.searchMain}
        >
          <Se121SharedAsset source={locationAsset} width={16} height={20} nativeFallback={<MapPin size={20} color={COLORS.textMuted} />} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>Where do you want to stay?</Text>
        </TouchableOpacity>
        <View style={styles.dividerMargin}>
          <View style={styles.divider} />
        </View>
        <View style={styles.filterMargin}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Filters"
            onPress={onFilterPress || openSearch}
            style={styles.filterButton}
          >
            <Se121SharedAsset source={filtersAsset} width={18} nativeFallback={<SlidersHorizontal size={18} color={COLORS.primary} />} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'web' ? 24 : 0,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.section,
    backgroundColor: '#F6FBF9',
  },
  topRow: {
    height: SIZES.iconButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    paddingHorizontal: 17,
    paddingVertical: 1,
    ...SHADOWS.cardSoft,
  },
  searchMain: {
    flex: 1,
    minWidth: 0,
    height: SIZES.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.borderDark,
  },
  divider: {
    height: 32,
    width: 1,
    backgroundColor: COLORS.borderTealSoft,
  },
  dividerMargin: {
    width: 17,
    height: 32,
    paddingHorizontal: 8,
  },
  filterMargin: {
    width: 32.02,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    height: SIZES.iconButton,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -1 }],
  },
});
