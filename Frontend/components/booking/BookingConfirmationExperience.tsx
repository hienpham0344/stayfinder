import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, Home, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
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
  const { reveal } = useLocalSearchParams<{ reveal?: 'start' | 'end' }>();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'start' | 'end' | 'confirmation'>('start');
  const scale = useRef(new Animated.Value(52 / 144)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const startIconOpacity = useRef(new Animated.Value(1)).current;
  const endIconOpacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const confirmedIconOpacity = useRef(new Animated.Value(0)).current;
  const confirmedIconScale = useRef(new Animated.Value(0.92)).current;
  const confirmedHeading = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reveal === 'start') { scale.setValue(52 / 144); opacity.setValue(0); startIconOpacity.setValue(1); endIconOpacity.setValue(0); setPhase('start'); return; }
    if (reveal === 'end') { scale.setValue(1); opacity.setValue(1); startIconOpacity.setValue(0); endIconOpacity.setValue(1); setPhase('end'); return; }
    let cancelled = false;
    const animation = Animated.parallel([
      // Preserve the 52px/144px frame endpoints; Figma's 4.5 scale track conflicts with them.
      Animated.sequence([Animated.timing(scale, { toValue: 1.06, duration: 420, easing: Easing.bezier(0.45, 1.45, 0.8, 1), useNativeDriver: true }), Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true })]),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(startIconOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(endIconOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(rotation, { toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: true }),
    ]);
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) { scale.setValue(1); opacity.setValue(1); startIconOpacity.setValue(0); endIconOpacity.setValue(1); }
      else animation.start();
    });
    const endTimer = setTimeout(() => setPhase('end'), 600);
    // The prototype's raw AFTER_TIMEOUT value is 1050; treat it as milliseconds
    // after the End frame becomes visible, and allow a tap to continue sooner.
    const confirmationTimer = setTimeout(() => setPhase('confirmation'), 1650);
    return () => { cancelled = true; clearTimeout(endTimer); clearTimeout(confirmationTimer); animation.stop(); };
  }, [opacity, rotation, scale, startIconOpacity, endIconOpacity, reveal]);

  useEffect(() => {
    if (phase !== 'confirmation') return;
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    let repeatTimer: ReturnType<typeof setTimeout> | undefined;
    const applyMotionPreference = (reduceMotion: boolean) => {
      if (cancelled) return;
      if (repeatTimer) clearTimeout(repeatTimer);
      animation?.stop();
      confirmedIconOpacity.setValue(reduceMotion ? 1 : 0);
      confirmedIconScale.setValue(reduceMotion ? 1 : 0.92);
      confirmedHeading.setValue(reduceMotion ? 1 : 0);
      if (reduceMotion) return;
      const easeOut = Easing.bezier(0, 0, 0.58, 1);
      const runCycle = () => {
        if (cancelled) return;
        confirmedIconOpacity.setValue(0);
        confirmedIconScale.setValue(0.92);
        confirmedHeading.setValue(0);
        animation = Animated.parallel([
          Animated.timing(confirmedIconOpacity, { toValue: 1, duration: 300, easing: easeOut, useNativeDriver: true }),
          Animated.timing(confirmedIconScale, { toValue: 1, duration: 280, easing: easeOut, useNativeDriver: true }),
          Animated.sequence([Animated.delay(80), Animated.timing(confirmedHeading, { toValue: 1, duration: 300, easing: easeOut, useNativeDriver: true })]),
        ]);
        animation.start(({ finished }) => {
          if (finished && !cancelled) repeatTimer = setTimeout(runCycle, 1620);
        });
      };
      runCycle();
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', applyMotionPreference);
    AccessibilityInfo.isReduceMotionEnabled().then(applyMotionPreference).catch(() => applyMotionPreference(true));
    return () => { cancelled = true; subscription.remove(); if (repeatTimer) clearTimeout(repeatTimer); animation?.stop(); };
  }, [phase, confirmedHeading, confirmedIconOpacity, confirmedIconScale]);

  if (phase !== 'confirmation') return <Pressable style={styles.reveal} onPress={phase === 'end' ? () => setPhase('confirmation') : undefined} accessibilityRole={phase === 'end' ? 'button' : undefined} accessibilityLabel={phase === 'end' ? 'Continue to booking confirmation' : undefined}><View style={styles.revealContent}><View style={styles.revealVisual}><Animated.View style={[styles.revealCircle, { transform: [{ scale }] }]}><Animated.View style={[styles.revealRing, { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0rad', '6.283rad'] }) }] }]}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/reveal-ring.svg')} width={32} nativeFallback={<View />} /></Animated.View><Animated.View style={{ opacity: endIconOpacity }}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/reveal-check.svg')} width={64} nativeFallback={<View style={styles.revealCheck}><Check size={55} strokeWidth={5} color={COLORS.bgWhite} /></View>} /></Animated.View></Animated.View><Animated.View pointerEvents="none" style={[styles.startRevealIcon, { opacity: startIconOpacity }]}><Image source={require("../../assets/figma/se121-parity/reveal/start-check-426-858.png")} style={styles.startCheckImage} /></Animated.View><Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>{REVEAL_PARTICLES.map((particle, index) => <View key={index} style={{ position: 'absolute', left: particle.left, top: particle.top }}><Se121SharedAsset source={particle.asset} width={particle.size} nativeFallback={<View style={{ width: particle.size, height: particle.size, borderRadius: particle.size / 2, backgroundColor: COLORS.primary }} />} /></View>)}</Animated.View></View><Animated.Text style={[styles.revealTitle, { opacity }]}>Booking confirmed!</Animated.Text><Animated.Text style={[styles.revealText, { opacity }]}>Your stay is secured. Opening your confirmation…</Animated.Text><Animated.Text style={[styles.revealHint, { opacity }]}>Booking secured ✓</Animated.Text></View></Pressable>;

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.successCircle, { opacity: confirmedIconOpacity, transform: [{ scale: confirmedIconScale }] }]} ><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/confirmation-check.svg')} width={40} nativeFallback={<View style={styles.successCheck}><Check size={32} strokeWidth={4} color={COLORS.bgWhite} /></View>} /></Animated.View>
      <Animated.View style={{ alignSelf: 'stretch', alignItems: 'center', opacity: confirmedHeading, transform: [{ translateY: confirmedHeading.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}><Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>You're all set. A confirmation email has been sent to your inbox. Pack your bags!</Text></Animated.View>
      <View style={styles.card}>
        <View style={styles.heroImage}><Image source={require('../../assets/figma/se121-parity/bookings/confirmation-photo-250-980.png')} style={styles.heroPhoto} resizeMode="cover" /><View style={styles.heroShade} /><View style={styles.heroCopy}><Text style={styles.roomBadge}>Deluxe Ocean View</Text><Text style={styles.heroTitle} numberOfLines={1}>Villa Azure Retreat</Text><View style={styles.heroLocation}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/confirmation-location.svg')} width={10.6667} height={13.3333} nativeFallback={<MapPin size={15} color={COLORS.bgWhite} />} /><Text style={styles.heroLocationText}>Bali, Indonesia</Text></View></View></View>
        <View style={styles.cardDetails}><View style={styles.datesRow}><View style={styles.dateCell}><Text style={styles.detailLabel}>Check-in</Text><Text style={[styles.dateText, styles.dateCellDateText]}>Oct 12, 2026</Text><Text style={styles.detailMeta}>3:00 PM</Text></View><View style={styles.dateCell}><Text style={styles.detailLabel}>Check-out</Text><Text style={[styles.dateText, styles.dateCellDateText]}>Oct 15, 2026</Text><Text style={styles.detailMeta}>11:00 AM</Text></View></View><View style={styles.separator} /><View style={styles.infoRow}><View><Text style={styles.detailLabel}>Confirmation Code</Text><Text style={styles.demoCode}>SF-9A4B2</Text></View><View style={styles.guests}><Text style={styles.detailLabel}>Guests</Text><Text style={styles.dateText}>2 adults</Text></View></View><View style={styles.separator} /><View style={styles.totalRow}><Text style={styles.totalTitle}>Total Paid</Text><Text style={styles.total}>$1,032.00</Text></View></View>
      </View>
      <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/bookings')}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/confirmation-bookings.svg')} width={18} height={20} nativeFallback={<CalendarDays size={20} color={COLORS.bgWhite} />} /><Text style={styles.primaryText}>View My Bookings</Text></Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/confirmation-home.svg')} width={16} height={18} nativeFallback={<Home size={19} color={COLORS.primary} />} /><Text style={styles.secondaryText}>Back to Home</Text></Pressable>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 40, alignItems: 'center' },
  reveal: { flex: 1, backgroundColor: COLORS.bgMain, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  revealContent: { width: '100%', maxWidth: 350, height: 392, paddingHorizontal: 28, paddingVertical: 32, alignItems: 'center', justifyContent: 'center', gap: 18, overflow: 'hidden' },
  revealVisual: { width: 160, height: 160 },
  revealCircle: { position: 'absolute', left: 8, top: 8, width: 144, height: 144, borderRadius: RADII.full, overflow: 'hidden', backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  revealRing: { position: 'absolute', left: 36, top: 36 },
  startRevealIcon: { position: 'absolute', left: 68, top: 68, width: 24, height: 24 },
  startCheckImage: { width: 24, height: 24 },
  revealCheck: { width: 64, height: 64, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  revealTitle: { width: '100%', maxWidth: 294, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  revealText: { width: '100%', maxWidth: 280, minHeight: 44, color: '#4A5754', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  revealHint: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, color: '#006159', backgroundColor: '#F2FAF7', fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  successCircle: { width: 96, height: 96, borderRadius: RADII.full, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0px 10px 15px -3px rgba(152,243,227,0.2), 0px 4px 6px -4px rgba(152,243,227,0.2)' }, default: { shadowColor: '#98F3E3', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 7.5, elevation: 3 } }) },
  successCheck: { width: 40, height: 40, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 24, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64, textAlign: 'center' },
  subtitle: { maxWidth: 326, marginTop: 8, marginBottom: 40, color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  card: { alignSelf: 'stretch', borderWidth: 1, borderColor: COLORS.bgCard, backgroundColor: COLORS.bgWhite, overflow: 'hidden', ...SHADOWS.cardSoft },
  heroImage: { width: '100%', height: 192, justifyContent: 'flex-end', overflow: 'hidden' },
  heroPhoto: { position: 'absolute', top: 0, left: 0, width: '100%', height: 192 },
  heroShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, ...Platform.select({ web: { backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)' } as ViewStyle, default: { backgroundColor: COLORS.overlayBlack, opacity: 0.35 } }) },
  heroCopy: { padding: 16 },
  roomBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADII.full, borderWidth: 1, borderColor: 'rgba(152,243,227,0.3)', overflow: 'hidden', color: COLORS.primaryLight, backgroundColor: 'rgba(0,0,0,0.3)', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(2px)' } as ViewStyle : {}) },
  heroTitle: { marginTop: 7, color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  heroLocationText: { color: 'rgba(255,255,255,0.9)', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  cardDetails: { padding: 16 },
  datesRow: { flexDirection: 'row', gap: 16, paddingBottom: 8 },
  dateCell: { flex: 1 },
  dateCellDateText: { marginTop: 4 },
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
