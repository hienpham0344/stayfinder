import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Star, TrendingDown, Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PriceProviderComparison } from '../../types/stay';
import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

interface ComparePricesModalProps {
  visible: boolean;
  onClose: () => void;
  stayId: string;
  stayTitle: string;
  comparisons: PriceProviderComparison[];
}

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';
const providerImages: Record<string, number> = {
  'Agoda Official': require('../../assets/figma/property-completion/agoda.jpeg'),
  'Booking.com': require('../../assets/figma/property-completion/booking-com.jpeg'),
};

export const ComparePricesModal: React.FC<ComparePricesModalProps> = ({ visible, onClose, stayId, stayTitle, comparisons }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useUserWindowDimensions();
  const [sheetHeight, setSheetHeight] = useState(0);
  const entrance = useRef(new Animated.Value(1)).current;
  useLayoutEffect(() => {
    entrance.setValue(1);
    if (!visible || !sheetHeight) return;
    let cancelled = false;
    const animation = Animated.timing(entrance, { toValue: 0, duration: 300, useNativeDriver: true });
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) entrance.setValue(0);
      else animation.start();
    }).catch(() => { if (!cancelled) entrance.setValue(0); });
    return () => { cancelled = true; animation.stop(); };
  }, [visible, sheetHeight, entrance]);
  const compact = width <= 350;
  const goToRoom = () => {
    onClose();
    router.push(('/room/select?id=' + stayId) as never);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng so sánh giá" />
        <Animated.View onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [0, sheetHeight || height] }) }] }]}>
          <View style={styles.handleArea}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <Text style={styles.title}>So sánh giá</Text>
            <Text style={styles.subtitle}>{stayTitle} · Giá tham khảo mỗi đêm</Text>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {comparisons.map((item) => (
              <View key={item.providerName} style={[styles.row, compact && styles.compactRow, item.isBestValue && styles.bestRow]}>
                <View style={[styles.providerIcon, compact && styles.compactIcon, item.isBestValue && styles.bestIcon]}>
                  {item.providerName === 'StayFinder Direct' ? <Se121SharedAsset source={require('../../assets/figma/property-completion/stayfinder-star.svg')} width={23} height={19} nativeFallback={<Star size={23} fill={COLORS.bgWhite} color={COLORS.bgWhite} />} /> : providerImages[item.providerName] ? <Image source={providerImages[item.providerName]} style={styles.providerImage} resizeMode="cover" /> : <TrendingDown size={20} color={item.isBestValue ? COLORS.bgWhite : COLORS.primary} />}
                </View>
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerName, compact && styles.compactProviderName]}>{item.providerName}</Text>
                  {item.isBestValue && <View style={[styles.bestBadge, compact && styles.compactBestBadge]}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/compare-best-badge.svg')} width={8} height={9} nativeFallback={<Trophy size={9} color={COLORS.bgWhite} />} /><Text style={[styles.bestLabel, compact && styles.compactBestLabel]}>GIÁ TỐT NHẤT</Text></View>}
                </View>
                <View style={styles.priceColumn}>
                  <Text style={[styles.price, compact && styles.compactPrice]}>{formatPrice(item.pricePerNight)}</Text>
                  <Pressable onPress={goToRoom} style={[styles.selectButton, compact && styles.compactButton, item.isBestValue && styles.bestButton]} accessibilityRole="button" accessibilityLabel={'Chọn phòng từ ' + item.providerName}>
                    <Text style={[styles.selectText, compact && styles.compactSelectText]}>Chọn phòng</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.note}>Các mức giá là dữ liệu demo. Bạn sẽ chọn phòng trong StayFinder.</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.16)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(5px)' } as ViewStyle : {}) },
  sheet: { maxHeight: '89%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: COLORS.bgMain, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0px -7px 13px rgba(5,41,33,0.08)' }, default: { shadowColor: '#052921', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 6.5, elevation: 10 } }) },
  handleArea: { height: 38, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 48, height: 6, borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  header: { paddingHorizontal: 20, paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: '#E5E9E7', gap: 4 },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  subtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 8 },
  row: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 17, borderWidth: 1, borderColor: '#E5E9E7', backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  compactRow: { gap: 8, padding: 12 },
  bestRow: { borderColor: COLORS.primaryActive, borderLeftWidth: 4, backgroundColor: '#F1F4F2' },
  providerIcon: { width: 48, height: 48, borderRadius: RADII.full, borderWidth: 1, borderColor: '#E5E9E7', backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  providerImage: { position: 'absolute', height: '100%', width: '183.51%', left: '-41.76%' },
  compactIcon: { width: 40, height: 40 },
  bestIcon: { borderColor: COLORS.primaryActive, backgroundColor: COLORS.primaryActive },
  providerInfo: { flex: 1, minWidth: 0, gap: 4 },
  providerName: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  compactProviderName: { fontSize: 13 },
  bestBadge: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2, backgroundColor: COLORS.accentOrange },
  compactBestBadge: { paddingHorizontal: 4 },
  bestLabel: { flexShrink: 1, minWidth: 0, color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  compactBestLabel: { fontSize: 9 },
  priceColumn: { alignItems: 'flex-end', gap: 8 },
  price: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  compactPrice: { fontSize: 17 },
  selectButton: { minHeight: 36, paddingHorizontal: 24, borderRadius: RADII.full, backgroundColor: COLORS.accentOrange, alignItems: 'center', justifyContent: 'center' },
  compactButton: { minHeight: 32, paddingHorizontal: 12 },
  bestButton: { backgroundColor: COLORS.primaryActive },
  selectText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  compactSelectText: { fontSize: 12 },
  note: { paddingHorizontal: 20, paddingTop: 4, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
});
