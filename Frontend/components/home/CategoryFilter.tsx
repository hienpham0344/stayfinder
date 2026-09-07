import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { CATEGORIES } from '../../constants/mockStays';
import { Compass, Flame, Umbrella, TreePine, Mountain, Crown, Waves } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

const ICON_MAP: Record<string, any> = {
  Compass,
  Flame,
  Umbrella,
  TreePine,
  Mountain,
  Crown,
  Waves,
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View className="bg-white py-3 border-b border-gray-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = ICON_MAP[cat.icon] || Compass;
          const iconColor = isSelected ? COLORS.primary : COLORS.gray;

          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
              className={`items-center mr-6 pb-1 ${
                isSelected ? 'border-b-2 border-primary' : ''
              }`}
            >
              <IconComponent size={22} color={iconColor} />
              <Text
                className={`text-xs mt-1.5 font-medium ${
                  isSelected ? 'text-primary font-bold' : 'text-gray-500'
                }`}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
