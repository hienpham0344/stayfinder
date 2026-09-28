import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADII, SPACING, SIZES, TYPOGRAPHY, SHADOWS } from '../../constants/tokens';

interface HomeHeaderProps {
  locationName?: string;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  locationName = 'Việt Nam',
  onSearchPress,
  onFilterPress,
}) => {
  const router = useRouter();
  const openSearch = onSearchPress || (() => router.push('/search'));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>Chào buổi sáng</Text>
          <Text style={styles.location}>{locationName}</Text>
        </View>
        <View style={styles.notification}>
          <Bell size={20} color={COLORS.primary} />
        </View>
      </View>
      <Text style={styles.brand}>StayFinder</Text>
      <View style={styles.searchBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tìm chỗ ở"
          onPress={openSearch}
          style={styles.searchMain}
        >
          <MapPin size={20} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>Bạn muốn ở đâu?</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Bộ lọc"
          onPress={onFilterPress || openSearch}
          style={styles.filterButton}
        >
          <SlidersHorizontal size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
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
    width: SIZES.iconButton,
    height: SIZES.iconButton,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: 26,
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
    gap: 12,
    paddingLeft: SPACING.lg,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPlaceholder,
  },
  divider: {
    height: 32,
    width: 1,
    backgroundColor: COLORS.borderLight,
  },
  filterButton: {
    height: SIZES.iconButton,
    width: SIZES.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
