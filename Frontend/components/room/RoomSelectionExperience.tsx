import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, BedDouble, Check, Ruler, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { StepIndicator } from '../ui/StepIndicator';
import { RoomTier } from '../../types/stay';

export function RoomSelectionExperience() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const insets = useSafeAreaInsets();
  const roomTiers: RoomTier[] = stay.roomTiers || [{
    id: 'rt-std', name: 'Phòng tiêu chuẩn', description: 'Phòng nghỉ phù hợp với chuyến đi của bạn',
    sizeSqm: 38, bedType: '1 giường King', pricePerNight: stay.pricePerNight, maxGuests: stay.maxGuests,
    includesBreakfast: true, cancellationPolicy: 'Miễn phí hủy trước 48h', availableCount: 3,
  }];
  const [selectedTierId, setSelectedTierId] = useState(roomTiers[0].id);
  const selectedTier = roomTiers.find((tier) => tier.id === selectedTierId) || roomTiers[0];
  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price);

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Quay lại"><ArrowLeft size={SIZES.icon} color={COLORS.inkSoft} /></Pressable><Text style={styles.headerTitle}>StayFinder</Text><View style={styles.back} /></View>
    <StepIndicator currentStep={1} />
    <ScrollView contentContainerStyle={[styles.list, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      {roomTiers.map((tier) => {
        const selected = tier.id === selectedTierId;
        return <Pressable key={tier.id} style={[styles.card, selected && styles.selectedCard]} onPress={() => setSelectedTierId(tier.id)} accessibilityState={{ selected }}>
          <View style={styles.imageWrap}><Image source={{ uri: stay.images[0] }} style={styles.image} resizeMode="cover" /><View style={[styles.badge, tier.availableCount <= 3 ? styles.limitedBadge : styles.availableBadge]}><Text style={styles.badgeText}>{tier.availableCount <= 3 ? 'Còn ít phòng' : 'Còn phòng'}</Text></View></View>
          <View style={styles.cardBody}>
            <View style={styles.titleRow}><Text style={styles.roomTitle}>{tier.name}</Text><View style={styles.priceColumn}><Text style={styles.cardPrice}>{formatPrice(tier.pricePerNight)}đ</Text><Text style={styles.night}>/ đêm</Text></View></View>
            <Text style={styles.description} numberOfLines={2}>{tier.description}</Text>
            <View style={styles.specRow}><View style={styles.spec}><Users size={16} color={COLORS.inkSoft} /><Text style={styles.specText}>{tier.maxGuests} khách</Text></View><View style={styles.spec}><Ruler size={16} color={COLORS.inkSoft} /><Text style={styles.specText}>{tier.sizeSqm} m²</Text></View><View style={styles.spec}><BedDouble size={16} color={COLORS.inkSoft} /><Text style={styles.specText} numberOfLines={1}>{tier.bedType}</Text></View></View>
            <View style={styles.amenities}>{tier.includesBreakfast && <View style={styles.chip}><Text style={styles.chipText}>Bữa sáng</Text></View>}{stay.amenities.slice(0, 2).map((amenity) => <View key={amenity.id} style={styles.chip}><Text style={styles.chipText} numberOfLines={1}>{amenity.name}</Text></View>)}</View>
            <View style={styles.cardFooter}><Text style={styles.roomsLeft}>{tier.availableCount} phòng còn</Text><View style={[styles.selectButton, selected && styles.selectButtonActive]}>{selected && <Check size={16} color={COLORS.bgWhite} />}<Text style={[styles.selectText, selected && styles.selectTextActive]}>{selected ? 'Đã chọn' : 'Chọn phòng'}</Text></View></View>
          </View>
        </Pressable>;
      })}
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: Math.max(12, insets.bottom) }]}><View style={styles.footerPriceWrap}><Text style={styles.footerLabel}>Giá phòng / đêm</Text><Text style={styles.footerPrice}>{formatPrice(selectedTier.pricePerNight)}đ</Text></View><Pressable style={styles.continueButton} onPress={() => router.push(`/booking/guest-info?id=${stay.id}&tierId=${selectedTierId}` as never)}><Text style={styles.continueText}>Tiếp tục</Text><ArrowRight size={18} color={COLORS.bgWhite} /></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: SPACING.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 23, letterSpacing: -0.24 },
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, gap: 16 },
  card: { borderRadius: RADII.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderSage, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  selectedCard: { borderWidth: 2, borderColor: COLORS.actionTeal },
  imageWrap: { height: 192 },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 16, left: 16, minHeight: 28, paddingHorizontal: 12, borderRadius: RADII.full, justifyContent: 'center' },
  limitedBadge: { backgroundColor: COLORS.accentOrange },
  availableBadge: { backgroundColor: COLORS.actionTeal },
  badgeText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12 },
  cardBody: { padding: 16, gap: 12 },
  titleRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  roomTitle: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 26 },
  priceColumn: { alignItems: 'flex-end' },
  cardPrice: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  night: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  description: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 19 },
  specRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  specText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, flexShrink: 1 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { minHeight: 27, maxWidth: '48%', paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.borderSage, borderRadius: RADII.full, justifyContent: 'center' },
  chipText: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  cardFooter: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomsLeft: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12 },
  selectButton: { minHeight: 44, minWidth: 112, paddingHorizontal: 16, borderRadius: RADII.full, backgroundColor: COLORS.surfaceMint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  selectButtonActive: { backgroundColor: COLORS.actionTeal },
  selectText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  selectTextActive: { color: COLORS.bgWhite },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: SIZES.stickyCta, paddingTop: 12, paddingHorizontal: SPACING.xl, backgroundColor: COLORS.bgWhite, borderTopWidth: 1, borderTopColor: COLORS.borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, ...SHADOWS.stickyFooter },
  footerPriceWrap: { flexShrink: 1 },
  footerLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  footerPrice: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 19 },
  continueButton: { height: SIZES.button, minWidth: 138, paddingHorizontal: 20, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  continueText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
});
