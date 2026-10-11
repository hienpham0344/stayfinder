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
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

interface AmenityGridProps {
  amenities: Amenity[];
  title?: string;
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

const FIGMA_ICONS: Record<string, { source: number; width: number; height: number }> = {
  Wifi: { source: require('../../assets/figma/exhaust-review-completion/property-wifi.svg'), width: 24, height: 17 },
  Wind: { source: require('../../assets/figma/exhaust-review-completion/property-ac.svg'), width: 20, height: 20 },
  Waves: { source: require('../../assets/figma/exhaust-review-completion/property-pool.svg'), width: 20, height: 18 },
  Dumbbell: { source: require('../../assets/figma/se121-parity/property/gym-icon-13-973.png'), width: 19.8, height: 19.8 },
};

export const AmenityGrid: React.FC<AmenityGridProps> = ({ amenities, title = 'Top Amenities' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.items}>
        {amenities.slice(0, 4).map((item) => {
          const IconComp = ICON_MAP[item.icon] || CheckCircle2;
          const asset = FIGMA_ICONS[item.icon];
          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.iconCircle}>
                {asset ? <Se121SharedAsset source={asset.source} width={asset.width} height={asset.height} nativeFallback={<IconComp size={24} color={COLORS.primary} />} /> : <IconComp size={24} color={COLORS.primary} />}
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
  container: { marginTop: SPACING.section },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, marginBottom: 16 },
  items: { flexDirection: 'row', gap: 16 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8 },
  iconCircle: { width: 48, height: 48, borderRadius: RADII.full, backgroundColor: COLORS.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  name: { color: '#3E4946', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
