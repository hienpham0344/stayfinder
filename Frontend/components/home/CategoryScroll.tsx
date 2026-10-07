import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Building2, Home, Trees, Castle, Flame } from 'lucide-react-native';
import { COLORS, RADII, TYPOGRAPHY, SPACING } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
}

// Categories extracted directly from Figma Node 13:1066 (Hotels, Homestays, Villas, Resorts, Cabins)
const CATEGORIES_DATA: CategoryItem[] = [
  { id: 'Hotel', name: 'Khách sạn', iconName: 'Building2' },
  { id: 'Homestay', name: 'Homestay', iconName: 'Home' },
  { id: 'Resort', name: 'Resort', iconName: 'Trees' },
  { id: 'Villas', name: 'Villa', iconName: 'Castle' },
  { id: 'Cabins', name: 'Nhà gỗ', iconName: 'Flame' },
];

const CATEGORY_ASSETS: Record<string, { selected: number; unselected: number; width: number; height: number }> = {
  Building2: { selected: require('../../assets/figma/exhaust-account-completion/category-hotel-on.svg'), unselected: require('../../assets/figma/exhaust-account-completion/category-hotel-off.svg'), width: 13.5, height: 13.5 },
  Home: { selected: require('../../assets/figma/exhaust-account-completion/category-homestay-on.svg'), unselected: require('../../assets/figma/exhaust-account-completion/category-homestay-off.svg'), width: 15, height: 11.25 },
  Trees: { selected: require('../../assets/figma/exhaust-account-completion/category-resort-on.svg'), unselected: require('../../assets/figma/exhaust-account-completion/category-resort-off.svg'), width: 15, height: 12 },
  Castle: { selected: require('../../assets/figma/exhaust-account-completion/category-villa-on.svg'), unselected: require('../../assets/figma/exhaust-account-completion/category-villa-off.svg'), width: 13.5, height: 13.5 },
};

interface CategoryScrollProps {
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
}

export const CategoryScroll: React.FC<CategoryScrollProps> = ({
  selectedCategory = 'Hotel',
  onSelectCategory,
}) => {
  const renderIcon = (iconName: string, isSelected: boolean) => {
    const iconColor = isSelected ? COLORS.bgWhite : COLORS.primaryActive;
    const iconSize = 18;

    switch (iconName) {
      case 'Building2':
        return <Building2 size={iconSize} color={iconColor} />;
      case 'Home':
        return <Home size={iconSize} color={iconColor} />;
      case 'Trees':
        return <Trees size={iconSize} color={iconColor} />;
      case 'Castle':
        return <Castle size={iconSize} color={iconColor} />;
      case 'Flame':
      default:
        return <Flame size={iconSize} color={iconColor} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES_DATA.map((item) => {
          const isSelected = selectedCategory === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => onSelectCategory && onSelectCategory(item.id)}
              accessibilityRole="radio"
              accessibilityLabel={item.name}
              accessibilityState={{ checked: isSelected }} aria-checked={isSelected}
              style={[
                styles.categoryChip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                item.id === 'Hotel' && styles.hotelChip,
              ]}
            >
              {CATEGORY_ASSETS[item.iconName] ? <Se121SharedAsset source={isSelected ? CATEGORY_ASSETS[item.iconName].selected : CATEGORY_ASSETS[item.iconName].unselected} width={CATEGORY_ASSETS[item.iconName].width} height={CATEGORY_ASSETS[item.iconName].height} nativeFallback={renderIcon(item.iconName, isSelected)} /> : renderIcon(item.iconName, isSelected)}
              <Text
                style={[
                  styles.categoryText,
                  isSelected ? styles.textSelected : styles.textUnselected,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    marginBottom: SPACING.section,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: SPACING.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    height: 46,
    borderRadius: RADII.full,
    gap: SPACING.sm,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: COLORS.primaryActive,
    borderColor: COLORS.primaryActive,
  },
  chipUnselected: {
    backgroundColor: COLORS.bgWhite,
    borderColor: COLORS.borderDefault,
  },
  hotelChip: {
    borderWidth: 0,
    ...Platform.select({ web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.04)' }, default: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 } }),
  },
  categoryText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 24,
  },
  textSelected: {
    color: COLORS.bgWhite,
  },
  textUnselected: {
    color: COLORS.primaryActive,
  },
});
