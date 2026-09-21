import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADII, TYPOGRAPHY, SHADOWS } from '../../constants/tokens';

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

  const handleSearchClick = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push('/search');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Row: Brand Logo "StayFinder" + Location Subtitle */}
      <View style={styles.topRow}>
        <View style={styles.brandWrapper}>
          <Text style={styles.brandTitle}>StayFinder</Text>
          <View style={styles.locationBadge}>
            <MapPin size={13} color={COLORS.primary} />
            <Text style={styles.locationText}>{locationName}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar Input */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleSearchClick}
        style={styles.searchBarContainer}
      >
        <Search size={20} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Bạn muốn đi đâu? (Điểm đến, khách sạn...)"
          placeholderTextColor={COLORS.textPlaceholder}
          style={styles.searchInput}
          editable={false}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={onFilterPress || handleSearchClick}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={18} color={COLORS.bgWhite} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.bgMain,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandWrapper: {
    flex: 1,
  },
  brandTitle: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: 26, // Heading 1 brand title in Figma Node 13:1040
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgWhite,
    borderRadius: RADII.xl, // 32px
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.cardSoft,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.dark,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
