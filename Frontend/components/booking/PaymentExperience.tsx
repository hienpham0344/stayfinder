import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepIndicator } from '../ui/StepIndicator';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { calculateBookingPrice } from '../../utils/bookingPrice';

type PaymentMethod = 'MOMO' | 'VNPay' | 'CreditCard';
const METHODS: { id: PaymentMethod; title: string; subtitle: string; icon: typeof CreditCard }[] = [
  { id: 'CreditCard', title: 'Thẻ tín dụng / ghi nợ', subtitle: 'Visa, Mastercard', icon: CreditCard },
  { id: 'MOMO', title: 'Ví MoMo', subtitle: 'Thanh toán bằng ví điện tử', icon: Wallet },
  { id: 'VNPay', title: 'VNPAY', subtitle: 'Thẻ ATM hoặc Internet Banking', icon: Wallet },
];
const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price);

export function PaymentExperience() {
  const { id, tierId } = useLocalSearchParams<{ id: string; tierId?: string }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const tier = stay.roomTiers?.find((item) => item.id === tierId);
  const insets = useSafeAreaInsets();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOMO');
  const [processing, setProcessing] = useState(false);
  const nights = 3;
  const { roomTotal, fees, total } = calculateBookingPrice(stay.pricePerNight, nights, stay.cleaningFee, stay.serviceFee);
  useEffect(() => {
    if (!processing) return;
    const timer = setTimeout(() => router.replace(`/booking/confirmation?id=${stay.id}` as never), 1500);
    return () => clearTimeout(timer);
  }, [processing, stay.id]);

  if (processing) return <View style={[styles.screen, { paddingTop: insets.top }]}><View style={styles.processingHeader}><Text style={styles.headerTitle}>StayFinder</Text></View><View style={styles.processingCenter}><View style={styles.processingCard}><View style={styles.spinnerCircle}><ActivityIndicator size="large" color={COLORS.actionTeal} /></View><Text style={styles.processingTitle}>Đang xác nhận đặt phòng</Text><Text style={styles.processingText}>Vui lòng chờ trong giây lát. Đây là luồng thanh toán mô phỏng.</Text><Text style={styles.processingHint}>Vui lòng giữ màn hình này mở</Text></View></View></View>;

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Quay lại"><ArrowLeft size={SIZES.icon} color={COLORS.primary} /></Pressable><Text style={styles.headerTitle}>StayFinder</Text><View style={styles.back} /></View>
    <StepIndicator currentStep={3} />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tóm tắt đơn đặt phòng</Text>
        <View style={styles.stayRow}><Image source={{ uri: stay.images[0] }} style={styles.stayImage} /><View style={styles.stayInfo}><Text style={styles.stayName} numberOfLines={2}>{stay.title}</Text><Text style={styles.stayMeta}>3 đêm · 2 khách</Text><Text style={styles.stayMeta}>15–18/10/2026</Text></View></View>
        <View style={styles.divider} />
        <View style={styles.line}><Text style={styles.lineLabel}>Giá niêm yết ({nights} đêm)</Text><Text style={styles.lineValue}>{formatPrice(roomTotal)}đ</Text></View>
        <View style={styles.line}><Text style={styles.lineLabel}>Phí vệ sinh và dịch vụ</Text><Text style={styles.lineValue}>{formatPrice(fees)}đ</Text></View>
        <View style={styles.divider} />
        <View style={styles.totalLine}><Text style={styles.totalLabel}>Tổng cộng</Text><Text style={styles.totalValue}>{formatPrice(total)}đ</Text></View>
      </View>
      {tier && tier.pricePerNight !== stay.pricePerNight && <Text style={styles.priceNotice}>Checkout demo tính theo giá niêm yết của chỗ ở, chưa áp dụng giá hạng phòng {tier.name}.</Text>}
      <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
      {METHODS.map((method) => {
        const selected = paymentMethod === method.id;
        const Icon = method.icon;
        return <Pressable key={method.id} style={[styles.method, selected && styles.methodSelected]} onPress={() => setPaymentMethod(method.id)} accessibilityState={{ selected }}><Icon size={25} color={COLORS.primary} /><View style={styles.methodCopy}><Text style={styles.methodTitle}>{method.title}</Text><Text style={styles.methodSubtitle}>{method.subtitle}</Text></View><View style={[styles.radio, selected && styles.radioSelected]} /></Pressable>;
      })}
      <Text style={styles.demoNote}>Bản demo không thực hiện giao dịch thật.</Text>
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: Math.max(12, insets.bottom) }]}><View style={styles.footerPrice}><Text style={styles.footerLabel}>Tổng thanh toán</Text><Text style={styles.footerTotal}>{formatPrice(total)}đ</Text></View><Pressable style={styles.confirmButton} onPress={() => setProcessing(true)}><Text style={styles.confirmText}>Xác nhận đặt phòng</Text></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: SPACING.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 23, letterSpacing: -0.24 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 24 },
  summaryCard: { padding: 16, borderRadius: RADII.xl, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  summaryTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, marginBottom: 16 },
  stayRow: { flexDirection: 'row', gap: 16 },
  stayImage: { width: 96, height: 96 },
  stayInfo: { flex: 1, gap: 5 },
  stayName: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  stayMeta: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 16 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  lineLabel: { flex: 1, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13 },
  lineValue: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  totalLabel: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  totalValue: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 21 },
  priceNotice: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 19, marginTop: 12 },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, marginTop: 32, marginBottom: 16 },
  method: { minHeight: 76, paddingHorizontal: 16, marginBottom: 8, borderRadius: RADII.xl, borderWidth: 1, borderColor: COLORS.borderSage, backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', gap: 16 },
  methodSelected: { borderColor: COLORS.actionTeal, backgroundColor: COLORS.surfaceMint },
  methodCopy: { flex: 1, gap: 3 },
  methodTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  methodSubtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  radio: { width: 24, height: 24, borderRadius: RADII.full, borderWidth: 2, borderColor: COLORS.borderSage },
  radioSelected: { backgroundColor: COLORS.actionTeal, borderColor: COLORS.actionTeal },
  demoNote: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, marginTop: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: SIZES.stickyCta, paddingTop: 12, paddingHorizontal: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, ...SHADOWS.stickyFooter },
  footerPrice: { flexShrink: 1 },
  footerLabel: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  footerTotal: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  confirmButton: { minHeight: SIZES.button, paddingHorizontal: 18, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  processingHeader: { height: SIZES.appBar, alignItems: 'center', justifyContent: 'center' },
  processingCenter: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  processingCard: { padding: 32, borderRadius: RADII.xl, backgroundColor: COLORS.bgWhite, alignItems: 'center', gap: 18, ...SHADOWS.cardSoft },
  spinnerCircle: { width: 72, height: 72, borderRadius: RADII.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  processingTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 22, textAlign: 'center' },
  processingText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  processingHint: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, backgroundColor: COLORS.surfaceMint, borderRadius: RADII.full, paddingHorizontal: 20, paddingVertical: 8 },
});
