import React from 'react';
import { View, Text } from 'react-native';
import { Amenity } from '../../types/stay';
import {
  Wifi,
  Flame,
  Utensils,
  ChefHat,
  Car,
  Waves,
  Umbrella,
  Wind,
  Coffee,
  Mountain,
  Dumbbell,
  Building,
  Tv,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface AmenityGridProps {
  amenities: Amenity[];
}

const ICON_MAP: Record<string, any> = {
  Wifi,
  Flame,
  Utensils,
  ChefHat,
  Car,
  Waves,
  Umbrella,
  Wind,
  Coffee,
  Mountain,
  Dumbbell,
  Building,
  Tv,
};

export const AmenityGrid: React.FC<AmenityGridProps> = ({ amenities }) => {
  return (
    <View className="py-4 border-b border-gray-100">
      <Text className="text-base font-bold text-gray-900 mb-3">Nơi này có những gì cho bạn</Text>
      <View className="flex-row flex-wrap">
        {amenities.map((item) => {
          const IconComp = ICON_MAP[item.icon] || CheckCircle2;
          return (
            <View key={item.id} className="w-1/2 flex-row items-center mb-3 pr-2">
              <View className="p-2 rounded-lg bg-gray-100 mr-2.5">
                <IconComp size={18} color={COLORS.dark} />
              </View>
              <Text className="text-sm text-gray-700 font-medium flex-1">{item.name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
