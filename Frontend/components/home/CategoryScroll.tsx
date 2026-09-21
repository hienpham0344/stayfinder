import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Building2, Home, Trees, Castle, Flame } from 'lucide-react-native';
import { COLORS, RADII, TYPOGRAPHY, SHADOWS } from '../../constants/tokens';

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
    const iconColor = isSelected ? '#FFFFFF' : COLORS.textMuted;
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
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADII.xl, // 32px pill
    gap: 8,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.cardSubtle,
  },
  chipUnselected: {
    backgroundColor: COLORS.bgWhite,
    borderColor: COLORS.borderLight,
  },
  categoryText: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '600',
  },
  textSelected: {
    color: '#FFFFFF',
  },
  textUnselected: {
    color: COLORS.textSecondary,
  },
});
