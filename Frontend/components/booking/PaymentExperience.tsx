import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Gift, ImageOff, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepIndicator } from '../ui/StepIndicator';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { calculateBookingPrice } from '../../utils/bookingPrice';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

type PaymentMethod = 'MOMO' | 'VNPay' | 'CreditCard';
const METHODS: { id: PaymentMethod; title: string; subtitle: string; icon: typeof CreditCard }[] = [
  { id: 'CreditCard', title: 'Thẻ tín dụng / ghi nợ', subtitle: 'Visa, Mastercard', icon: CreditCard },
  { id: 'MOMO', title: 'Ví MoMo', subtitle: 'Thanh toán bằng ví điện tử', icon: Wallet },
  { id: 'VNPay', title: 'VNPAY', subtitle: 'Thẻ ATM hoặc Internet Banking', icon: Wallet },
];
const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price);

export function PaymentExperience() {
  const { id, tierId, paymentState } = useLocalSearchParams<{ id: string; tierId?: string; paymentState?: 'failed' }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const tier = stay.roomTiers?.find((item) => item.id === tierId);
  const insets = useSafeAreaInsets();
  const compact = useUserWindowDimensions().width <= 340;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOMO');
  const [rewardApplied, setRewardApplied] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const processingRotation = useRef(new Animated.Value(0)).current;
  const [imageStatus, setImageStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const nights = 3;
  const { roomTotal, fees, total } = calculateBookingPrice(stay.pricePerNight, nights, stay.cleaningFee, stay.serviceFee);
  useEffect(() => {
    if (paymentState === 'failed') setPaymentFailed(true);
  }, [paymentState]);
  useEffect(() => {
    if (!processing) return;
    const timer = setTimeout(() => router.replace(`/booking/confirmation?id=${stay.id}` as never), 1500);
    return () => clearTimeout(timer);
  }, [processing, stay.id]);
  useEffect(() => {
    if (!processing) return;
    let cancelled = false;
    processingRotation.setValue(0);
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(processingRotation, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(800),
    ]));
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => { if (!cancelled && !reduce) animation.start(); });
    return () => { cancelled = true; animation.stop(); };
  }, [processing, processingRotation]);

  if (paymentFailed) return <View style={[styles.screen, { paddingTop: insets.top }]}><View style={styles.failedCenter}><View style={styles.failedCard}><Text style={styles.failedTitle}>Thanh toán chưa thành công</Text><Text style={styles.failedText}>Chưa có khoản thanh toán nào được thực hiện. Hãy kiểm tra phương thức thanh toán hoặc thử lại.</Text><Pressable style={styles.retryButton} onPress={() => setPaymentFailed(false)} accessibilityLabel="Thử lại thanh toán"><Text style={styles.retryText}>Thử lại thanh toán</Text></Pressable><Pressable style={styles.chooseMethodButton} onPress={() => setPaymentFailed(false)} accessibilityLabel="Chọn phương thức thanh toán"><Text style={styles.chooseMethodText}>Chọn phương thức thanh toán</Text></Pressable></View></View></View>;

  if (processing) return <View style={[styles.screen, { paddingTop: insets.top }]}><View style={styles.header}><View style={styles.back} /><Text style={styles.headerTitle}>StayFinder</Text><View style={styles.back} /></View><View style={styles.processingCenter}><View style={styles.processingCard}><View style={styles.spinnerCircle}><Animated.View style={{ transform: [{ rotate: processingRotation.interpolate({ inputRange: [0, 1], outputRange: ['0rad', '6.283rad'] }) }] }}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/processing-ring.svg')} width={31.2854} height={32} nativeFallback={<ActivityIndicator size="large" color={COLORS.actionTeal} />} /></Animated.View></View><Text style={styles.processingTitle}>Đang xác nhận đặt phòng</Text><Text style={styles.processingText}>Vui lòng chờ trong giây lát. Đây là luồng thanh toán mô phỏng.</Text><Text style={styles.processingHint}>Vui lòng giữ màn hình này mở</Text></View></View></View>;

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Quay lại"><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/guest-back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.primary} />} /></Pressable><Text style={styles.headerTitle}>StayFinder</Text><View style={styles.back} /></View>
    <View style={styles.stepper}><StepIndicator currentStep={3} /></View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tóm tắt đơn đặt phòng</Text>
        <View style={styles.stayRow}><View style={styles.stayImageWrap}>{imageStatus !== 'error' && <Image source={{ uri: stay.images[0] }} style={styles.stayImage} onLoad={() => setImageStatus('ready')} onError={() => setImageStatus('error')} />}{imageStatus !== 'ready' && <View style={styles.stayImagePlaceholder}>{imageStatus === 'error' ? <ImageOff size={20} color={COLORS.textMuted} /> : <ActivityIndicator color={COLORS.primary} />}</View>}</View><View style={styles.stayInfo}><View><Text style={styles.stayName} numberOfLines={2}>{stay.title}</Text><Text style={styles.stayMeta}>3 đêm · 2 khách</Text></View><View style={styles.stayDate}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/payment-calendar.svg')} width={12} height={13.3333} nativeFallback={<View />} /><Text style={styles.stayDateText}>15–18/10/2026</Text></View></View></View>
        <View style={styles.priceBreakdown}>
        <View style={styles.line}><Text style={styles.lineLabel}>Giá niêm yết ({nights} đêm)</Text><Text style={styles.lineValue}>{formatPrice(roomTotal)}đ</Text></View>
        <View style={styles.line}><Text style={styles.lineLabel}>Phí vệ sinh và dịch vụ</Text><Text style={styles.lineValue}>{formatPrice(fees)}đ</Text></View>
        <View style={styles.totalLine}><Text style={styles.totalLabel}>Tổng cộng</Text><Text style={styles.totalValue}>{formatPrice(total)}đ</Text></View></View>
      </View>
      {tier && tier.pricePerNight !== stay.pricePerNight && <Text style={styles.priceNotice}>Checkout demo tính theo giá niêm yết của chỗ ở, chưa áp dụng giá hạng phòng {tier.name}.</Text>}
      <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
      {METHODS.map((method) => {
        const selected = paymentMethod === method.id;
        const Icon = method.icon;
        return <Pressable key={method.id} style={[styles.method, selected && styles.methodSelected]} onPress={() => setPaymentMethod(method.id)} accessibilityRole="radio" accessibilityLabel={method.title} accessibilityState={{ checked: selected }} aria-checked={selected}><Icon size={24} color={COLORS.primary} /><View style={styles.methodCopy}><Text style={styles.methodTitle}>{method.title}</Text><Text style={styles.methodSubtitle}>{method.subtitle}</Text></View><View style={[styles.radio, selected && styles.radioSelected]} /></Pressable>;
      })}
      <View style={styles.rewardsCard}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/payment-gift.svg')} width={20} nativeFallback={<Gift size={20} color={COLORS.primary} />} /><View style={styles.rewardsCopy}><Text style={styles.rewardsTitle}>Đổi điểm thưởng</Text><Text style={styles.rewardsHint}>Minh họa chọn điểm · tổng giá giữ nguyên</Text></View><Pressable onPress={() => setRewardApplied((current) => !current)} style={styles.rewardToggle} accessibilityRole="switch" accessibilityLabel="Đổi điểm thưởng" accessibilityState={{ checked: rewardApplied }} aria-checked={rewardApplied}><Se121SharedAsset source={rewardApplied ? require('../../assets/figma/shared/243-966-imgStateOn.svg') : require('../../assets/figma/shared/243-966-imgStateOff.svg')} width={44} height={32} nativeFallback={<View style={[styles.rewardTrack, rewardApplied && styles.rewardTrackOn]}><View style={[styles.rewardThumb, rewardApplied && styles.rewardThumbOn]} /></View>} /></Pressable></View>
      <Text style={styles.demoNote}>Bản demo không thực hiện giao dịch thật.</Text>
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: Math.max(12, insets.bottom) }]}><View style={styles.footerPrice}><Text style={[styles.footerLabel, compact && styles.compactFooterLabel]}>Tổng thanh toán</Text><Text numberOfLines={1} style={[styles.footerTotal, compact && styles.compactFooterTotal]}>{formatPrice(total)}đ</Text></View><Pressable style={[styles.confirmButton, compact && styles.compactConfirmButton]} onPress={() => setProcessing(true)}><Text style={[styles.confirmText, compact && styles.compactConfirmText]}>Xác nhận đặt phòng</Text></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  stepper: { marginTop: 6 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 22 },
  summaryCard: { minHeight: 294, padding: 16, gap: 16, borderRadius: 32, backgroundColor: COLORS.bgWhite, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.04)' }, default: SHADOWS.cardSubtle }) },
  summaryTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  stayRow: { flexDirection: 'row', gap: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted },
  stayImageWrap: { width: 96, height: 96, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  stayImage: { width: '100%', height: '100%' },
  stayImagePlaceholder: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  stayInfo: { flex: 1, justifyContent: 'space-between' },
  stayDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stayDateText: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  priceBreakdown: { gap: 8 },
  stayName: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  stayMeta: { color: '#3E4946', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  stayDateMeta: { color: '#3E4946', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lineLabel: { flex: 1, color: '#3E4946', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  lineValue: { color: '#3E4946', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: COLORS.borderMuted, paddingTop: 8 },
  totalLabel: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  totalValue: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  priceNotice: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 19, marginTop: 12 },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, marginTop: 32, marginBottom: 16 },
  method: { minHeight: 74, padding: 16, marginBottom: 8, borderRadius: 32, borderWidth: 1, borderColor: COLORS.borderSage, backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', gap: 16 },
  methodSelected: { borderColor: COLORS.primaryActive, backgroundColor: COLORS.bgMain },
  methodCopy: { flex: 1, minWidth: 0 },
  methodTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  methodSubtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  radio: { width: 24, height: 24, borderRadius: RADII.full, borderWidth: 2, borderColor: COLORS.borderSage, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: COLORS.primaryActive, backgroundColor: COLORS.primaryActive },
  rewardsCard: { minHeight: 72, marginTop: 24, paddingHorizontal: 16, borderRadius: RADII.xl, backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', gap: 8, ...SHADOWS.cardSubtle },
  rewardsCopy: { flex: 1, gap: 2 },
  rewardsTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  rewardsHint: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  rewardToggle: { width: 44, height: 32, alignItems: 'center', justifyContent: 'center' },
  rewardTrack: { width: 40, height: 20, padding: 2, borderRadius: RADII.full, backgroundColor: '#CBD5E1' },
  rewardTrackOn: { backgroundColor: COLORS.primaryActive },
  rewardThumb: { width: 16, height: 16, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite },
  rewardThumbOn: { alignSelf: 'flex-end' },
  demoNote: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, marginTop: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: SIZES.stickyCta, paddingTop: 16, paddingHorizontal: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.borderMuted, backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, ...SHADOWS.stickyFooter },
  footerPrice: { flexShrink: 1 },
  footerLabel: { color: '#3E4946', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  footerTotal: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  compactFooterLabel: { fontSize: 10 },
  compactFooterTotal: { fontSize: 16, lineHeight: 20 },
  confirmButton: { width: 200, minHeight: SIZES.button, paddingHorizontal: 18, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  compactConfirmButton: { width: 154, paddingHorizontal: 8 },
  confirmText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  compactConfirmText: { fontSize: 12 },
  processingCenter: { flex: 1, justifyContent: 'flex-start', paddingTop: 216, paddingHorizontal: SPACING.xl },
  processingCard: { height: 300, paddingHorizontal: 28, paddingVertical: 32, borderRadius: 28, borderWidth: 1, borderColor: '#E5F0ED', backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center', gap: 18, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 10px 28px rgba(8,46,38,0.10)' }, default: { shadowColor: '#082E26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 14, elevation: 12 } }) },
  spinnerCircle: { width: 72, height: 72, borderRadius: RADII.full, backgroundColor: '#D9F7F0', alignItems: 'center', justifyContent: 'center' },
  processingTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  processingText: { color: '#4A5754', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  processingHint: { width: 230, maxWidth: '100%', color: '#38574F', fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', backgroundColor: '#EDFAF7', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 6 },
  failedCenter: { flex: 1, paddingHorizontal: SPACING.xl, paddingTop: 220, justifyContent: 'flex-start' },
  failedCard: { padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite, gap: 16 },
  failedTitle: { minHeight: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 25 },
  failedText: { minHeight: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  retryButton: { height: 48, borderRadius: RADII.promo, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  chooseMethodButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
  chooseMethodText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
});
