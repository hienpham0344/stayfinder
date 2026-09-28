import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { COLORS, RADII, TYPOGRAPHY } from '../../constants/tokens';

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
    <View style={styles.container}>
      <Text style={styles.title}>Tiện nghi nổi bật</Text>
      <View style={styles.items}>
        {amenities.map((item) => {
          const IconComp = ICON_MAP[item.icon] || CheckCircle2;
          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.iconCircle}>
                <IconComp size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 24 },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, marginBottom: 16 },
  items: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12 },
  item: { width: '22%', alignItems: 'center', gap: 8 },
  iconCircle: { width: 48, height: 48, borderRadius: RADII.full, backgroundColor: COLORS.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  name: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, textAlign: 'center' },
});
