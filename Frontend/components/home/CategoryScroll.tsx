import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Building2, Home, Trees, Castle, Flame } from 'lucide-react-native';
import { COLORS, RADII, TYPOGRAPHY, SHADOWS, SPACING } from '../../constants/tokens';

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
}

// Categories extracted directly from Figma Node 13:1066 (Hotels, Homestays, Villas, Resorts, Cabins)
const CATEGORIES_DATA: CategoryItem[] = [
  { id: 'Hotel', name: 'Khách sạn', iconName: 'Building2' },
  { id: 'Homestay', name: 'Homestay', iconName: 'Home' },
  { id: 'Villas', name: 'Villa', iconName: 'Castle' },
  { id: 'Resort', name: 'Resort', iconName: 'Trees' },
  { id: 'Cabins', name: 'Nhà gỗ', iconName: 'Flame' },
];

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
              style={[
                styles.categoryChip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              {renderIcon(item.iconName, isSelected)}
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
    height: 54,
    borderRadius: RADII.full,
    gap: SPACING.sm,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: COLORS.primaryActive,
    borderColor: COLORS.primaryActive,
    ...SHADOWS.cardSubtle,
  },
  chipUnselected: {
    backgroundColor: COLORS.bgWhite,
    borderColor: COLORS.borderDefault,
  },
  categoryText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  textSelected: {
    color: COLORS.bgWhite,
  },
  textUnselected: {
    color: COLORS.primaryActive,
  },
});
