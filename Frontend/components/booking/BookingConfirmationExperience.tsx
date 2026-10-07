import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, Home, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { calculateBookingPrice } from '../../utils/bookingPrice';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

const REVEAL_PARTICLES = [
  { left: 77, top: 2, size: 7, asset: require('../../assets/figma/exhaust-account-completion/reveal-particle-1.svg') },
  { left: 132, top: 25, size: 6, asset: require('../../assets/figma/exhaust-account-completion/reveal-particle-2.svg') },
  { left: 149, top: 78, size: 8, asset: require('../../assets/figma/exhaust-account-completion/reveal-particle-3.svg') },
  { left: 126, top: 132, size: 6, asset: require('../../assets/figma/exhaust-account-completion/reveal-particle-2.svg') },
  { left: 27, top: 132, size: 7, asset: require('../../assets/figma/exhaust-account-completion/reveal-particle-1.svg') },
  { left: 3, top: 77, size: 6, asset: require('../../assets/figma/exhaust-account-completion/reveal-particle-6.svg') },
  { left: 25, top: 24, size: 5, asset: require('../../assets/figma/exhaust-account-completion/reveal-particle-7.svg') },
];

export function BookingConfirmationExperience() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const insets = useSafeAreaInsets();
  const [revealing, setRevealing] = useState(true);
  const scale = useRef(new Animated.Value(52 / 144)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const confirmedIconOpacity = useRef(new Animated.Value(0)).current;
  const confirmedIconScale = useRef(new Animated.Value(0.92)).current;
  const confirmedHeading = useRef(new Animated.Value(0)).current;
  const { total } = calculateBookingPrice(stay.pricePerNight, 3, stay.cleaningFee, stay.serviceFee);

  useEffect(() => {
    let cancelled = false;
    const animation = Animated.parallel([
      // Preserve the 52px/144px frame endpoints; Figma's 4.5 scale track conflicts with them.
      Animated.sequence([Animated.timing(scale, { toValue: 1.06, duration: 420, easing: Easing.bezier(0.45, 1.45, 0.8, 1), useNativeDriver: true }), Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true })]),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(rotation, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
    ]);
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) { scale.setValue(1); opacity.setValue(1); }
      else animation.start();
    });
    const timer = setTimeout(() => setRevealing(false), 950);
    return () => { cancelled = true; clearTimeout(timer); animation.stop(); };
  }, [opacity, rotation, scale]);

  useEffect(() => {
    if (revealing) return;
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    const applyMotionPreference = (reduceMotion: boolean) => {
      if (cancelled) return;
      animation?.stop();
      confirmedIconOpacity.setValue(reduceMotion ? 1 : 0);
      confirmedIconScale.setValue(reduceMotion ? 1 : 0.92);
      confirmedHeading.setValue(reduceMotion ? 1 : 0);
      if (reduceMotion) return;
      const easeOut = Easing.bezier(0, 0, 0.58, 1);
      // One coordinated 2s timeline: icon 0–300ms, heading 80–380ms, then hold.
      animation = Animated.loop(Animated.parallel([
        Animated.sequence([Animated.timing(confirmedIconOpacity, { toValue: 1, duration: 300, easing: easeOut, useNativeDriver: true }), Animated.delay(1700)]),
        Animated.sequence([Animated.timing(confirmedIconScale, { toValue: 1, duration: 280, easing: easeOut, useNativeDriver: true }), Animated.delay(1720)]),
        Animated.sequence([Animated.delay(80), Animated.timing(confirmedHeading, { toValue: 1, duration: 300, easing: easeOut, useNativeDriver: true }), Animated.delay(1620)]),
      ]));
      animation.start();
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', applyMotionPreference);
    AccessibilityInfo.isReduceMotionEnabled().then(applyMotionPreference).catch(() => applyMotionPreference(true));
    return () => { cancelled = true; subscription.remove(); animation?.stop(); };
  }, [revealing, confirmedHeading, confirmedIconOpacity, confirmedIconScale]);

  if (revealing) return <View style={styles.reveal}><View style={styles.revealContent}><View style={styles.revealVisual}><Animated.View style={[styles.revealCircle, { transform: [{ scale }] }]}><Animated.View style={[styles.revealRing, { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0rad', '6.283rad'] }) }] }]}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/reveal-ring.svg')} width={32} nativeFallback={<View />} /></Animated.View><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/reveal-check.svg')} width={64} nativeFallback={<View style={styles.revealCheck}><Check size={55} strokeWidth={5} color={COLORS.bgWhite} /></View>} /></Animated.View><Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>{REVEAL_PARTICLES.map((particle, index) => <View key={index} style={{ position: 'absolute', left: particle.left, top: particle.top }}><Se121SharedAsset source={particle.asset} width={particle.size} nativeFallback={<View style={{ width: particle.size, height: particle.size, borderRadius: particle.size / 2, backgroundColor: COLORS.primary }} />} /></View>)}</Animated.View></View><Animated.Text style={[styles.revealTitle, { opacity }]}>Đặt phòng demo thành công!</Animated.Text><Animated.Text style={[styles.revealText, { opacity }]}>Đang mở thông tin xác nhận…</Animated.Text><Animated.Text style={[styles.revealHint, { opacity }]}>Đặt phòng mẫu đã được giữ chỗ ✓</Animated.Text></View></View>;

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.successCircle, { opacity: confirmedIconOpacity, transform: [{ scale: confirmedIconScale }] }]} ><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/confirmation-check.svg')} width={40} nativeFallback={<View style={styles.successCheck}><Check size={32} strokeWidth={4} color={COLORS.bgWhite} /></View>} /></Animated.View>
      <Animated.View style={{ alignSelf: 'stretch', alignItems: 'center', opacity: confirmedHeading, transform: [{ translateY: confirmedHeading.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}><Text style={styles.title}>Đặt phòng demo thành công!</Text>
      <Text style={styles.subtitle}>Thông tin dưới đây chỉ để minh họa. Chưa có thanh toán, email hoặc booking nào được tạo.</Text></Animated.View>
      <View style={styles.card}>
        <ImageBackground source={{ uri: stay.images[0] }} style={styles.heroImage} resizeMode="cover"><View style={styles.heroShade} /><View style={styles.heroCopy}><Text style={styles.roomBadge}>Phòng đã chọn</Text><Text style={styles.heroTitle} numberOfLines={1}>{stay.title}</Text><View style={styles.heroLocation}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/confirmation-location.svg')} width={10.6667} height={13.3333} nativeFallback={<MapPin size={15} color={COLORS.bgWhite} />} /><Text style={styles.heroLocationText}>{stay.location.city}, {stay.location.province}</Text></View></View></ImageBackground>
        <View style={styles.cardDetails}><View style={styles.datesRow}><View style={styles.dateCell}><Text style={styles.detailLabel}>Nhận phòng</Text><Text style={styles.dateText}>15/10/2026</Text><Text style={styles.detailMeta}>15:00</Text></View><View style={styles.dateCell}><Text style={styles.detailLabel}>Trả phòng</Text><Text style={styles.dateText}>18/10/2026</Text><Text style={styles.detailMeta}>11:00</Text></View></View><View style={styles.separator} /><View style={styles.infoRow}><View><Text style={styles.detailLabel}>Mã minh họa</Text><Text style={styles.demoCode}>SF-DEMO</Text></View><View style={styles.guests}><Text style={styles.detailLabel}>Số khách</Text><Text style={styles.dateText}>2 người lớn</Text></View></View><View style={styles.separator} /><View style={styles.totalRow}><Text style={styles.totalTitle}>Tổng theo demo</Text><Text style={styles.total}>{new Intl.NumberFormat('vi-VN').format(total)}đ</Text></View></View>
      </View>
      <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/bookings')}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/confirmation-bookings.svg')} width={18} height={20} nativeFallback={<CalendarDays size={20} color={COLORS.bgWhite} />} /><Text style={styles.primaryText}>Xem đặt phòng mẫu</Text></Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/confirmation-home.svg')} width={16} height={18} nativeFallback={<Home size={19} color={COLORS.primary} />} /><Text style={styles.secondaryText}>Về trang chủ</Text></Pressable>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 40, alignItems: 'center' },
  reveal: { flex: 1, backgroundColor: COLORS.bgMain, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  revealContent: { width: '100%', maxWidth: 350, minHeight: 392, paddingHorizontal: 28, paddingVertical: 32, alignItems: 'center', justifyContent: 'center', gap: 18 },
  revealVisual: { width: 160, height: 160 },
  revealCircle: { position: 'absolute', left: 8, top: 8, width: 144, height: 144, borderRadius: RADII.full, overflow: 'hidden', backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  revealRing: { position: 'absolute', left: 36, top: 36 },
  revealCheck: { width: 64, height: 64, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  revealTitle: { width: '100%', maxWidth: 294, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  revealText: { width: '100%', maxWidth: 280, minHeight: 44, color: '#4A5754', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  revealHint: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, color: '#006159', backgroundColor: '#F2FAF7', fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  successCircle: { width: 96, height: 96, borderRadius: RADII.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0px 10px 15px -3px rgba(152,243,227,0.2), 0px 4px 6px -4px rgba(152,243,227,0.2)' }, default: { shadowColor: '#98F3E3', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 7.5, elevation: 3 } }) },
  successCheck: { width: 40, height: 40, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 24, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64, textAlign: 'center' },
  subtitle: { maxWidth: 326, marginTop: 8, marginBottom: 40, color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  card: { alignSelf: 'stretch', borderWidth: 1, borderColor: COLORS.bgCard, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  heroImage: { height: 192, justifyContent: 'flex-end' },
  heroShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, ...Platform.select({ web: { backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)' } as ViewStyle, default: { backgroundColor: COLORS.overlayBlack, opacity: 0.35 } }) },
  heroCopy: { padding: 16 },
  roomBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADII.full, borderWidth: 1, borderColor: 'rgba(152,243,227,0.3)', overflow: 'hidden', color: COLORS.primaryLight, backgroundColor: 'rgba(0,0,0,0.3)', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(2px)' } as ViewStyle : {}) },
  heroTitle: { marginTop: 7, color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  heroLocationText: { color: 'rgba(255,255,255,0.9)', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  cardDetails: { padding: 16 },
  datesRow: { flexDirection: 'row', gap: 16, paddingBottom: 8 },
  dateCell: { flex: 1, gap: 4 },
  detailLabel: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  dateText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  detailMeta: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  separator: { height: 1, marginVertical: 16, backgroundColor: COLORS.borderLight },
  infoRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  demoCode: { marginTop: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADII.full, color: COLORS.dark, backgroundColor: COLORS.bgSecondary, fontFamily: Platform.OS === 'web' ? 'Liberation Mono, monospace' : TYPOGRAPHY.monoFamily, fontSize: TYPOGRAPHY.mono.fontSize, letterSpacing: TYPOGRAPHY.mono.letterSpacing },
  guests: { alignItems: 'flex-end', gap: 6 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  totalTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  total: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  primaryButton: { alignSelf: 'stretch', minHeight: SIZES.button, marginTop: 40, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  secondaryButton: { alignSelf: 'stretch', minHeight: SIZES.button, marginTop: 16, borderRadius: RADII.full, borderWidth: 2, borderColor: COLORS.primaryActive, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
});
