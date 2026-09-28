import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BedDouble, Check, ChevronRight, CircleHelp, Gift, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { BottomSheetWrapper } from '../ui/BottomSheetWrapper';
import { UserBottomNavigation } from '../ui/UserBottomNavigation';
import { MOCK_USER_TIER, MOCK_VOUCHERS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';

type Sheet = 'catalog' | 'help' | null;
const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export function RewardsExperience() {
  const insets = useSafeAreaInsets();
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [notice, setNotice] = useState('');
  const featured = vouchers.find((voucher) => !voucher.isUnlocked) || vouchers[0];
  const claim = (id: string) => {
    setVouchers((current) => current.map((voucher) => voucher.id === id ? { ...voucher, isUnlocked: true } : voucher));
    setNotice('Ưu đãi chỉ được mở khóa trong phiên demo; điểm không bị trừ.');
    setSheet(null);
  };

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headingRow}><View style={styles.headingCopy}><Text style={styles.title}>Ví điểm thưởng</Text><Text style={styles.subtitle}>Quản lý điểm và ưu đãi StayFinder.</Text></View><Pressable style={styles.helpButton} onPress={() => setSheet('help')} accessibilityLabel="Thông tin điểm thưởng"><CircleHelp size={23} color={COLORS.primary} /></Pressable></View>
      <View style={styles.balanceCard}><Svg style={StyleSheet.absoluteFill} width="100%" height="100%"><Defs><LinearGradient id="balanceGradient" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={COLORS.primary} /><Stop offset="1" stopColor={COLORS.accentOrange} /></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#balanceGradient)" /></Svg><View style={styles.balanceLabel}><Star size={15} color={COLORS.bgWhite} /><Text style={styles.balanceLabelText}>Điểm hiện có · {MOCK_USER_TIER.name}</Text></View><Text style={styles.balance}>{formatNumber(MOCK_USER_TIER.currentPoints)}</Text><Text style={styles.balanceHint}>Mở khóa ưu đãi trong bản demo</Text><View style={styles.balanceActions}><Pressable style={styles.redeemButton} onPress={() => setSheet('catalog')}><Text style={styles.redeemText}>Xem ưu đãi</Text></Pressable><Pressable style={styles.earnButton} onPress={() => setSheet('help')}><Text style={styles.earnText}>Cách nhận điểm</Text></Pressable></View></View>
      {!!notice && <Text style={styles.notice}>{notice}</Text>}
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Ưu đãi hiện có</Text><Pressable onPress={() => setSheet('catalog')}><Text style={styles.viewAll}>Xem tất cả</Text></Pressable></View>
      <View style={styles.featuredCard}><View style={styles.featuredIcon}><Gift size={24} color={COLORS.accentOrange} /></View><Text style={styles.rewardTitle}>{featured.title}</Text><Text style={styles.rewardDescription}>Đơn tối thiểu {formatNumber(featured.minSpend)}đ · Hạn dùng {featured.expiryDate}</Text><View style={styles.featuredFooter}><Text style={styles.pointsRequired}>{formatNumber(featured.pointsRequired)} điểm</Text><Pressable onPress={() => featured.isUnlocked ? setSheet('catalog') : claim(featured.id)}><Text style={styles.claimText}>{featured.isUnlocked ? 'Đã mở' : 'Mở khóa demo'} →</Text></Pressable></View></View>
      <Text style={styles.historyTitle}>Lịch sử điểm</Text><View style={styles.historyEmpty}><BedDouble size={25} color={COLORS.primary} /><View style={styles.historyCopy}><Text style={styles.historyEmptyTitle}>Chưa có giao dịch điểm</Text><Text style={styles.historyEmptyText}>Dữ liệu mẫu hiện chưa có lịch sử tích hoặc đổi điểm.</Text></View></View>
      <Text style={styles.benefitTitle}>Quyền lợi {MOCK_USER_TIER.name}</Text><View style={styles.benefits}>{MOCK_USER_TIER.benefits.map((benefit) => <View key={benefit} style={styles.benefitRow}><Check size={17} color={COLORS.primary} /><Text style={styles.benefitText}>{benefit}</Text></View>)}</View>
    </ScrollView>
    <UserBottomNavigation active="Tài khoản" />
    <BottomSheetWrapper visible={sheet === 'catalog'} onClose={() => setSheet(null)} title="Ưu đãi hiện có">
      <ScrollView style={styles.catalog} showsVerticalScrollIndicator={false}>{vouchers.map((voucher) => <Pressable key={voucher.id} style={styles.catalogRow} onPress={() => voucher.isUnlocked ? setNotice('Ưu đãi này đã có trong dữ liệu mẫu.') : claim(voucher.id)}><View style={styles.catalogCopy}><Text style={styles.catalogTitle} numberOfLines={2}>{voucher.title}</Text><Text style={styles.catalogHint}>{voucher.isUnlocked ? 'Đã mở khóa' : 'Nhấn để mở khóa demo'}</Text></View><Text style={styles.catalogPoints}>{formatNumber(voucher.pointsRequired)} điểm</Text><ChevronRight size={17} color={COLORS.primary} /></Pressable>)}</ScrollView>
      <Text style={styles.catalogNote}>Đổi ưu đãi chỉ thay đổi giao diện trong phiên, không trừ điểm hoặc tạo voucher thật.</Text>
    </BottomSheetWrapper>
    <BottomSheetWrapper visible={sheet === 'help'} onClose={() => setSheet(null)} title="Về điểm thưởng">
      <Text style={styles.helpText}>Bạn đang xem {formatNumber(MOCK_USER_TIER.currentPoints)} điểm mẫu. Cách tích điểm và quy đổi thực tế chưa có trong dữ liệu demo.</Text><Pressable style={styles.helpClose} onPress={() => setSheet(null)}><Text style={styles.helpCloseText}>Đã hiểu</Text></Pressable>
    </BottomSheetWrapper>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 24, paddingBottom: 60 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingCopy: { flex: 1 },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 30, letterSpacing: -0.24 },
  subtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 21, marginTop: 4 },
  helpButton: { width: SIZES.iconButton, height: SIZES.iconButton, borderRadius: RADII.full, backgroundColor: COLORS.surfaceMint, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { height: 200, marginTop: 24, padding: 24, borderRadius: RADII.xl, overflow: 'hidden', backgroundColor: COLORS.primary, ...SHADOWS.cardSoft },
  balanceLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceLabelText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  balance: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.bold, fontSize: 34, marginTop: 5 },
  balanceHint: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13 },
  balanceActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  redeemButton: { flex: 1, minHeight: 44, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center' },
  redeemText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  earnButton: { flex: 1, minHeight: 44, borderRadius: RADII.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  earnText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  notice: { marginTop: 12, color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18 },
  sectionHeading: { marginTop: 28, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 22 },
  viewAll: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  featuredCard: { minHeight: 150, padding: 16, borderRadius: RADII.xl, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  featuredIcon: { position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderBottomLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, backgroundColor: COLORS.errorBg, alignItems: 'center', justifyContent: 'center' },
  rewardTitle: { maxWidth: '75%', color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  rewardDescription: { maxWidth: '90%', marginTop: 8, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
  featuredFooter: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pointsRequired: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  claimText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  historyTitle: { marginTop: 36, marginBottom: 16, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 22 },
  historyEmpty: { minHeight: 90, padding: 16, borderRadius: RADII.xl, backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', gap: 14 },
  historyCopy: { flex: 1, gap: 4 },
  historyEmptyTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  historyEmptyText: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  benefitTitle: { marginTop: 32, marginBottom: 12, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  benefits: { padding: 16, borderRadius: RADII.xl, backgroundColor: COLORS.bgWhite, gap: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  benefitText: { flex: 1, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
  catalog: { maxHeight: 390 },
  catalogRow: { minHeight: 62, paddingHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderTealSoft, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceMint, flexDirection: 'row', alignItems: 'center', gap: 8 },
  catalogCopy: { flex: 1, gap: 3 },
  catalogTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  catalogHint: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 10 },
  catalogPoints: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 12 },
  catalogNote: { marginTop: 10, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  helpText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  helpClose: { minHeight: SIZES.button, marginTop: 20, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  helpCloseText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
});
