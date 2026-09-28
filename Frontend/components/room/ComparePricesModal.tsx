import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, TrendingDown } from 'lucide-react-native';
import { BottomSheetWrapper } from '../ui/BottomSheetWrapper';
import { PriceProviderComparison } from '../../types/stay';
import { COLORS, RADII, TYPOGRAPHY } from '../../constants/tokens';

interface ComparePricesModalProps {
  visible: boolean;
  onClose: () => void;
  stayId: string;
  stayTitle: string;
  comparisons: PriceProviderComparison[];
}

export const ComparePricesModal: React.FC<ComparePricesModalProps> = ({ visible, onClose, stayId, stayTitle, comparisons }) => {
  const goToRoom = () => {
    onClose();
    router.push(('/room/select?id=' + stayId) as never);
  };
  return (
    <BottomSheetWrapper visible={visible} onClose={onClose} title="So sánh giá">
      <Text style={styles.subtitle}>{stayTitle} · Giá tham khảo mỗi đêm</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {comparisons.map((item) => (
          <View key={item.providerName} style={[styles.row, item.isBestValue && styles.bestRow]}>
            <View style={[styles.providerIcon, item.isBestValue && styles.bestIcon]}><TrendingDown size={20} color={item.isBestValue ? COLORS.bgWhite : COLORS.primary} /></View>
            <View style={styles.providerInfo}>
              <Text numberOfLines={1} style={styles.providerName}>{item.providerName}</Text>
              {item.isBestValue && <Text style={styles.bestLabel}>GIÁ TỐT NHẤT</Text>}
            </View>
            <View style={styles.priceColumn}>
              <Text style={styles.price}>{new Intl.NumberFormat('vi-VN').format(item.pricePerNight)}đ</Text>
              <Pressable onPress={goToRoom} style={styles.selectButton}><Text style={styles.selectText}>Chọn phòng</Text><ArrowRight size={13} color={COLORS.bgWhite} /></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.note}>Các mức giá là dữ liệu demo. Bạn sẽ chọn phòng trong StayFinder.</Text>
    </BottomSheetWrapper>
  );
};

const styles = StyleSheet.create({
  subtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, marginBottom: 16 },
  list: { maxHeight: 430 },
  row: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.bgWhite },
  bestRow: { borderColor: COLORS.actionTeal, borderLeftWidth: 4, backgroundColor: COLORS.surfaceSage },
  providerIcon: { width: 38, height: 38, borderRadius: RADII.full, backgroundColor: COLORS.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  bestIcon: { backgroundColor: COLORS.actionTeal },
  providerInfo: { flex: 1, minWidth: 0 },
  providerName: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  bestLabel: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.bold, fontSize: 10, marginTop: 4 },
  priceColumn: { alignItems: 'flex-end', gap: 6 },
  price: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 15 },
  selectButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal },
  selectText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 11 },
  note: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16, marginTop: 8 },
});
