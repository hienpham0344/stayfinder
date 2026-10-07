import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ArrowLeft, ArrowRight, BedDouble, CircleCheck, Flame, ImageOff, Ruler, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { StepIndicator } from '../ui/StepIndicator';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
import { RoomTier } from '../../types/stay';

export function RoomSelectionExperience() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const insets = useSafeAreaInsets();
  const compact = useUserWindowDimensions().width <= 340;
  const roomTiers: RoomTier[] = stay.roomTiers || [{
    id: 'rt-std', name: 'Phòng tiêu chuẩn', description: 'Phòng nghỉ phù hợp với chuyến đi của bạn',
    sizeSqm: 38, bedType: '1 giường King', pricePerNight: stay.pricePerNight, maxGuests: stay.maxGuests,
    includesBreakfast: true, cancellationPolicy: 'Miễn phí hủy trước 48h', availableCount: 3,
  }];
  const [selectedTierId, setSelectedTierId] = useState(roomTiers[0].id);
  const [imageFailed, setImageFailed] = useState(false);
  const selectedTier = roomTiers.find((tier) => tier.id === selectedTierId) || roomTiers[0];
  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price);

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Quay lại"><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/room-selection-back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.inkSoft} />} /></Pressable><Text style={styles.headerTitle}>StayFinder</Text><View style={styles.back} /></View>
    <View style={styles.stepIndicator}><StepIndicator currentStep={1} /></View>
    <ScrollView contentContainerStyle={[styles.list, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      {roomTiers.map((tier) => {
        const selected = tier.id === selectedTierId;
        return <Pressable key={tier.id} style={({ pressed }) => [styles.card, compact && styles.compactCard, selected && styles.selectedCard, pressed && styles.cardPressed]} onPress={() => setSelectedTierId(tier.id)} accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected}>
          <View style={styles.imageWrap}>{imageFailed ? <ImageOff size={24} color={COLORS.textMuted} /> : <Image source={{ uri: stay.images[0] }} style={styles.image} resizeMode="cover" onError={() => setImageFailed(true)} />}<View style={[styles.badge, tier.availableCount <= 3 ? styles.limitedBadge : styles.availableBadge]}>{tier.availableCount <= 3 ? <Flame size={11} color={COLORS.bgWhite} /> : <CircleCheck size={12} color={COLORS.bgWhite} />}<Text style={styles.badgeText}>{tier.availableCount <= 3 ? 'Còn ít phòng' : 'Còn phòng'}</Text></View></View>
          <View style={[styles.cardBody, compact && styles.compactCardBody]}>
            <View style={styles.titleRow}><Text style={[styles.roomTitle, compact && styles.compactRoomTitle]}>{tier.name}</Text><View style={styles.priceColumn}><Text style={styles.cardPrice}>{formatPrice(tier.pricePerNight)}đ</Text><Text style={styles.night}>/ đêm</Text></View></View>
            <View style={styles.specRow}><View style={styles.spec}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/room-selection-guests.svg')} width={12} nativeFallback={<Users size={16} color={COLORS.inkSoft} />} /><Text style={styles.specText}>{tier.maxGuests} khách</Text></View><View style={styles.spec}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/room-selection-size.svg')} width={12.7631} nativeFallback={<Ruler size={16} color={COLORS.inkSoft} />} /><Text style={styles.specText}>{tier.sizeSqm} m²</Text></View><View style={styles.spec}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/room-selection-bed.svg')} width={15} height={10.5} nativeFallback={<BedDouble size={16} color={COLORS.inkSoft} />} /><Text style={styles.specText} numberOfLines={1}>{tier.bedType}</Text></View></View>
            <View style={styles.amenities}>{tier.includesBreakfast && <View style={styles.chip}><Text style={styles.chipText}>Bữa sáng</Text></View>}{stay.amenities.slice(0, 2).map((amenity) => <View key={amenity.id} style={styles.chip}><Text style={styles.chipText}>{amenity.name}</Text></View>)}</View>
            <View style={styles.cardFooter}><View style={styles.availability}>{tier.availableCount <= 3 && <AlertTriangle size={15} color={COLORS.validation} />}<Text style={styles.roomsLeft}>{tier.availableCount} phòng còn</Text></View><View style={[styles.selectButton, selected && styles.selectButtonActive]}><Text style={[styles.selectText, selected && styles.selectTextActive]}>{selected ? 'Đã chọn' : 'Chọn phòng'}</Text></View></View>
          </View>
        </Pressable>;
      })}
    </ScrollView>
    <View style={[styles.footer, { height: 84 + Math.max(0, insets.bottom - 16), paddingBottom: Math.max(16, insets.bottom) }]}><View style={styles.footerPriceWrap}><Text style={styles.footerLabel}>Giá phòng / đêm</Text><Text style={styles.footerPrice}>{formatPrice(selectedTier.pricePerNight)}đ</Text></View><Pressable style={styles.continueButton} onPress={() => router.push(`/booking/guest-info?id=${stay.id}&tierId=${selectedTierId}` as never)}><Text style={styles.continueText}>Tiếp tục</Text><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/room-selection-continue.svg')} width={12.4999} nativeFallback={<ArrowRight size={18} color={COLORS.bgWhite} />} /></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  stepIndicator: { marginTop: 6 },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 30, gap: 16 },
  card: { minHeight: 400, borderRadius: RADII.xl, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  compactCard: { minHeight: 412 },
  selectedCard: { borderWidth: 2, borderColor: COLORS.actionTeal },
  cardPressed: { opacity: 0.92 },
  imageWrap: { height: 192, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 16, left: 16, height: 24, paddingHorizontal: 12, borderRadius: RADII.full, flexDirection: 'row', alignItems: 'center', gap: 4 },
  limitedBadge: { backgroundColor: COLORS.accentOrange },
  availableBadge: { backgroundColor: COLORS.actionTeal },
  badgeText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12 },
  cardBody: { minHeight: 204, padding: 16 },
  compactCardBody: { height: undefined, minHeight: 216 },
  titleRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  roomTitle: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  compactRoomTitle: { fontSize: 18, lineHeight: 24 },
  priceColumn: { alignItems: 'flex-end', gap: 5.5, paddingBottom: 2.5 },
  cardPrice: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  night: { color: '#6E7976', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  specRow: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%', flexShrink: 1 },
  specText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  amenities: { minHeight: 36, marginTop: 8, paddingTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { minHeight: 28, maxWidth: '100%', paddingHorizontal: 13, borderWidth: 1, borderColor: '#DFE3E1', borderRadius: RADII.full, justifyContent: 'center' },
  chipText: { color: '#6E7976', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  cardFooter: { height: 40, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  roomsLeft: { color: '#AC3323', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  selectButton: { height: 40, minWidth: 112, paddingHorizontal: 25, borderWidth: 1, borderColor: COLORS.primaryActive, borderRadius: RADII.full, backgroundColor: '#F1F4F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  selectButtonActive: { backgroundColor: COLORS.primaryActive },
  selectText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  selectTextActive: { color: COLORS.bgWhite },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 84, paddingTop: 17, paddingHorizontal: SPACING.xl, backgroundColor: COLORS.bgWhite, borderTopWidth: 1, borderTopColor: COLORS.borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, ...SHADOWS.stickyFooter },
  footerPriceWrap: { flexShrink: 1 },
  footerLabel: { color: '#6E7976', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  footerPrice: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  continueButton: { height: 52, minWidth: 138, paddingHorizontal: 24, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  continueText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
});
