import React, { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, Home, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { calculateBookingPrice } from '../../utils/bookingPrice';

export function BookingConfirmationExperience() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const insets = useSafeAreaInsets();
  const [revealing, setRevealing] = useState(true);
  const scale = useRef(new Animated.Value(0.36)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { total } = calculateBookingPrice(stay.pricePerNight, 3, stay.cleaningFee, stay.serviceFee);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.sequence([Animated.timing(scale, { toValue: 1.06, duration: 420, useNativeDriver: true }), Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true })]),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]);
    animation.start();
    const timer = setTimeout(() => setRevealing(false), 950);
    return () => { clearTimeout(timer); animation.stop(); };
  }, [opacity, scale]);

  if (revealing) return <View style={styles.reveal}><Animated.View style={[styles.revealCircle, { opacity, transform: [{ scale }] }]}><View style={styles.revealCheck}><Check size={55} strokeWidth={5} color={COLORS.bgWhite} /></View></Animated.View><Text style={styles.revealTitle}>Đặt phòng demo thành công!</Text><Text style={styles.revealText}>Đang mở thông tin xác nhận…</Text></View>;

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.successCircle}><View style={styles.successCheck}><Check size={32} strokeWidth={4} color={COLORS.bgWhite} /></View></View>
      <Text style={styles.title}>Đặt phòng demo thành công!</Text>
      <Text style={styles.subtitle}>Thông tin dưới đây chỉ để minh họa. Chưa có thanh toán, email hoặc booking nào được tạo.</Text>
      <View style={styles.card}>
        <ImageBackground source={{ uri: stay.images[0] }} style={styles.heroImage} resizeMode="cover"><View style={styles.heroShade} /><View style={styles.heroCopy}><Text style={styles.heroTitle}>{stay.title}</Text><View style={styles.heroLocation}><MapPin size={15} color={COLORS.bgWhite} /><Text style={styles.heroLocationText}>{stay.location.city}, {stay.location.province}</Text></View></View></ImageBackground>
        <View style={styles.cardDetails}><View style={styles.datesRow}><View style={styles.dateCell}><Text style={styles.detailLabel}>Nhận phòng</Text><Text style={styles.dateText}>15/10/2026</Text><Text style={styles.detailMeta}>15:00</Text></View><View style={styles.dateCell}><Text style={styles.detailLabel}>Trả phòng</Text><Text style={styles.dateText}>18/10/2026</Text><Text style={styles.detailMeta}>11:00</Text></View></View><View style={styles.separator} /><View style={styles.infoRow}><View><Text style={styles.detailLabel}>Mã minh họa</Text><Text style={styles.demoCode}>SF-DEMO</Text></View><View style={styles.guests}><Text style={styles.detailLabel}>Số khách</Text><Text style={styles.dateText}>2 người lớn</Text></View></View><View style={styles.separator} /><View style={styles.totalRow}><Text style={styles.totalTitle}>Tổng theo demo</Text><Text style={styles.total}>{new Intl.NumberFormat('vi-VN').format(total)}đ</Text></View></View>
      </View>
      <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/bookings')}><CalendarDays size={20} color={COLORS.bgWhite} /><Text style={styles.primaryText}>Xem đặt phòng mẫu</Text></Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}><Home size={19} color={COLORS.primary} /><Text style={styles.secondaryText}>Về trang chủ</Text></Pressable>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 40, alignItems: 'center' },
  reveal: { flex: 1, backgroundColor: COLORS.bgMain, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  revealCircle: { width: 146, height: 146, borderRadius: RADII.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  revealCheck: { width: 62, height: 62, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  revealTitle: { marginTop: 28, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 22, textAlign: 'center' },
  revealText: { marginTop: 12, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, textAlign: 'center' },
  successCircle: { width: 96, height: 96, borderRadius: RADII.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  successCheck: { width: 42, height: 42, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 28, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 29, lineHeight: 36, letterSpacing: -0.24, textAlign: 'center' },
  subtitle: { marginTop: 12, marginBottom: 24, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  card: { alignSelf: 'stretch', backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  heroImage: { height: 192, justifyContent: 'flex-end' },
  heroShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: COLORS.overlayBlack, opacity: 0.35 },
  heroCopy: { padding: 16 },
  heroTitle: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 19 },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  heroLocationText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  cardDetails: { padding: 16 },
  datesRow: { flexDirection: 'row' },
  dateCell: { flex: 1, gap: 5 },
  detailLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  dateText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  detailMeta: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  separator: { height: 1, marginVertical: 16, backgroundColor: COLORS.borderLight },
  infoRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  demoCode: { marginTop: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADII.full, color: COLORS.inkNavy, backgroundColor: COLORS.bgSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13, letterSpacing: 1 },
  guests: { alignItems: 'flex-end', gap: 6 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  totalTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  total: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  primaryButton: { alignSelf: 'stretch', minHeight: SIZES.button, marginTop: 24, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  secondaryButton: { alignSelf: 'stretch', minHeight: SIZES.button, marginTop: 12, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
});
