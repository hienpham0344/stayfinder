import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Star, Trophy } from 'lucide-react-native';
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

type Provider = { name: string; price?: string; image: number; kind: 'best' | 'regular' | 'native' | 'unavailable' };
const PROVIDERS: Provider[] = [
  { name: 'Traveloka', price: '$897.00', image: require('../../assets/figma/property-completion/traveloka.jpeg'), kind: 'best' },
  { name: 'Booking.com', price: '$927', image: require('../../assets/figma/property-completion/booking-com.jpeg'), kind: 'regular' },
  { name: 'Agoda', price: '$942', image: require('../../assets/figma/property-completion/agoda.jpeg'), kind: 'regular' },
  { name: 'StayFinder', price: '$897.00', image: require('../../assets/figma/property-completion/stayfinder-star.svg'), kind: 'native' },
  { name: 'Trivago', image: require('../../assets/figma/se121-parity/property/trivago-badge-13-1441.png'), kind: 'unavailable' },
];
const prefersReducedMotion = () => Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? Promise.resolve(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  : AccessibilityInfo.isReduceMotionEnabled();

export const ComparePricesModal: React.FC<ComparePricesModalProps> = ({ visible, onClose, stayId }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useUserWindowDimensions();
  const [sheetHeight, setSheetHeight] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const entrance = useRef(new Animated.Value(1)).current;
  const didEnter = useRef(false);
  const shake = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(0.62)).current;
  useLayoutEffect(() => {
    if (!visible) {
      didEnter.current = false;
      entrance.setValue(1);
      setRetrying(false);
      return;
    }
    if (!sheetHeight || didEnter.current) return;
    didEnter.current = true;
    let cancelled = false;
    const animation = Animated.timing(entrance, { toValue: 0, duration: 300, useNativeDriver: true });
    prefersReducedMotion().then((reduce) => {
      if (cancelled) return;
      if (reduce) entrance.setValue(0);
      else animation.start();
    }).catch(() => { if (!cancelled) entrance.setValue(0); });
    return () => { cancelled = true; animation.stop(); };
  }, [visible, sheetHeight, entrance]);
  useLayoutEffect(() => {
    if (!visible || retrying) return;
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    prefersReducedMotion().then((reduce) => {
      if (cancelled || reduce) return;
      animation = Animated.loop(Animated.sequence([
        Animated.timing(shake, { toValue: -3, duration: 0, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 3, duration: 80, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shake, { toValue: -2, duration: 80, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 80, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(1760),
      ]));
      animation.start();
    }).catch(() => undefined);
    return () => { cancelled = true; animation?.stop(); shake.setValue(0); };
  }, [visible, retrying, shake]);
  useEffect(() => {
    skeletonOpacity.setValue(0.62);
    if (!visible || !retrying) return;
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    prefersReducedMotion().then((reduce) => {
      if (cancelled || reduce) return;
      animation = Animated.loop(Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 0.92, duration: 550, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.62, duration: 550, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(900),
      ]));
      animation.start();
    }).catch(() => undefined);
    return () => { cancelled = true; animation?.stop(); skeletonOpacity.setValue(0.62); };
  }, [visible, retrying, skeletonOpacity]);
  const compact = width <= 350;
  const goToRoom = () => {
    onClose();
    router.push(('/room/select?id=' + stayId) as never);
  };
  const retryUnavailable = () => {
    setRetrying(true);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={[styles.backdrop, retrying && styles.loadingBackdrop]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close price comparison" />
        <Animated.View onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)} style={[styles.sheet, retrying && styles.loadingSheet, { paddingBottom: insets.bottom, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [0, sheetHeight || height] }) }] }]}>
          <Pressable style={styles.handleArea} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close price comparison"><View style={styles.handle} /></Pressable>
          <View style={styles.header}>
            <Text style={styles.title}>{retrying ? 'Comparing live prices…' : 'Compare Prices'}</Text>
            <Text style={styles.subtitle}>{retrying ? '3 nights, 2 adults' : '3 nights · 2 adults'}</Text>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {retrying ? PROVIDERS.map((provider) => <View key={provider.name} style={[styles.skeletonRow, provider.kind === 'unavailable' && styles.lastSkeletonRow]}><Animated.View style={[styles.skeletonIcon, { opacity: skeletonOpacity }]} /><Animated.View style={[styles.skeletonName, { opacity: skeletonOpacity }]} /><Animated.View style={[styles.skeletonPrice, { opacity: skeletonOpacity }]} /></View>) : PROVIDERS.map((provider) => <Animated.View key={provider.name} style={[styles.row, compact && styles.compactRow, provider.kind === 'best' && styles.bestRow, provider.kind === 'native' && styles.nativeRow, provider.kind === 'unavailable' && { transform: [{ translateX: shake }] }]}>
              <View style={[styles.providerIcon, compact && styles.compactIcon, provider.kind === 'native' && styles.nativeIcon]}>
                {provider.kind === 'native' ? <Se121SharedAsset source={provider.image} width={23} height={19} nativeFallback={<Star size={23} fill={COLORS.bgWhite} color={COLORS.bgWhite} />} /> : provider.kind === 'unavailable' ? <Image source={provider.image} style={styles.trivagoImage} resizeMode="contain" /> : <Image source={provider.image} style={styles.providerImage} resizeMode="cover" />}
              </View>
              <View style={styles.providerInfo}><View style={styles.providerNameRow}><Text style={[styles.providerName, compact && styles.compactProviderName]} numberOfLines={1}>{provider.name}</Text>{provider.kind === 'native' && <Image source={require('../../assets/figma/se121-parity/property/verified-badge-13-1428.png')} style={styles.verifiedBadge} />}</View>
                {provider.kind === 'best' && <View style={[styles.bestBadge, compact && styles.compactBestBadge]}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/compare-best-badge.svg')} width={8} height={9} nativeFallback={<Trophy size={9} color={COLORS.bgWhite} />} /><Text style={[styles.bestLabel, compact && styles.compactBestLabel]}>BEST PRICE</Text></View>}
                {provider.kind === 'native' && <Text style={styles.nativeHint}>In-app booking</Text>}
              </View>
              <View style={styles.priceColumn}>{provider.price && <Text style={[styles.price, compact && styles.compactPrice]}>{provider.price}</Text>}
                {provider.kind === 'best' && <Pressable onPress={goToRoom} style={[styles.selectButton, compact && styles.compactButton]} accessibilityRole="button" accessibilityLabel="Book with Traveloka"><Text style={[styles.selectText, compact && styles.compactSelectText]}>Book</Text></Pressable>}
                {provider.kind === 'native' && <Pressable onPress={goToRoom} style={styles.nativeSelect} accessibilityRole="button" accessibilityLabel="Select StayFinder"><Text style={styles.nativeSelectText}>Select</Text></Pressable>}
                {provider.kind === 'unavailable' && <Pressable onPress={retryUnavailable} style={[styles.selectButton, compact && styles.compactButton]} accessibilityRole="button" accessibilityLabel="Retry Trivago"><Text style={[styles.selectText, compact && styles.compactSelectText]}>Retry</Text></Pressable>}
              </View>
            </Animated.View>)}
          </ScrollView>
        </Animated.View>
        {retrying && <View style={styles.loadingFooter}><Pressable style={styles.loadingFallback} onPress={() => setRetrying(false)} accessibilityRole="button"><Text style={styles.loadingFallbackText}>See available prices</Text></Pressable></View>}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#1B1B1B' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.16)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(5px)' } as ViewStyle : {}) },
  loadingBackdrop: { backgroundColor: 'rgba(0,0,0,0.35)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(1px)' } as ViewStyle : {}) },
  sheet: { maxHeight: '89%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#F6FAF8', overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0px -7px 13px rgba(5,41,33,0.08)' }, default: { shadowColor: '#052921', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 6.5, elevation: 10 } }) },
  loadingSheet: { height: '89%', marginBottom: 0 },
  handleArea: { height: 38, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 48, height: 6, borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  header: { paddingHorizontal: 20, paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: '#E5E9E7', gap: 4 },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  subtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 8 },
  row: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderWidth: 1, borderColor: '#E5E9E7', backgroundColor: COLORS.bgWhite },
  compactRow: { gap: 8, padding: 12 },
  bestRow: { borderColor: COLORS.accentOrange, borderLeftWidth: 4, paddingLeft: 13, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  nativeRow: { borderColor: COLORS.primaryActive, borderLeftWidth: 4, paddingLeft: 13, backgroundColor: '#F1F4F2' },
  providerIcon: { width: 48, height: 48, borderRadius: RADII.full, borderWidth: 1, borderColor: '#E5E9E7', backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  providerImage: { position: 'absolute', height: '100%', width: '183.51%', left: '-41.76%' },
  compactIcon: { width: 40, height: 40 },
  nativeIcon: { borderColor: COLORS.primaryActive, backgroundColor: COLORS.primaryActive },
  trivagoImage: { width: 46, height: 46 },
  providerInfo: { flex: 1, minWidth: 0, gap: 4 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  providerName: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  verifiedBadge: { width: 11.667, height: 11.667 },
  nativeHint: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  compactProviderName: { fontSize: 13 },
  bestBadge: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2, backgroundColor: COLORS.accentOrange },
  compactBestBadge: { paddingHorizontal: 4 },
  bestLabel: { flexShrink: 1, minWidth: 0, color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  compactBestLabel: { fontSize: 9 },
  priceColumn: { alignItems: 'flex-end', gap: 8 },
  price: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  compactPrice: { fontSize: 17 },
  selectButton: { width: 84, height: 36, borderRadius: RADII.full, backgroundColor: COLORS.accentOrange, alignItems: 'center', justifyContent: 'center' },
  compactButton: { width: 76, height: 32 },
  selectText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  compactSelectText: { fontSize: 12 },
  nativeSelect: { minWidth: 84, height: 36, alignItems: 'center', justifyContent: 'center' },
  nativeSelectText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  skeletonRow: { height: 134, borderWidth: 1, borderColor: '#E0E8E8', backgroundColor: COLORS.bgWhite },
  lastSkeletonRow: { height: 100 },
  skeletonIcon: { position: 'absolute', top: 21, left: 15, width: 38, height: 38, borderRadius: 6, backgroundColor: '#E3EDED' },
  skeletonName: { position: 'absolute', top: 23, left: 67, width: 118, height: 12, borderRadius: 6, backgroundColor: '#E3EDED' },
  skeletonPrice: { position: 'absolute', top: 23, right: 15, width: 54, height: 16, borderRadius: 6, backgroundColor: '#E3EDED' },
  loadingFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, paddingHorizontal: 20, paddingTop: 16, backgroundColor: COLORS.bgWhite, borderWidth: 1, borderColor: '#E5EDF0' },
  loadingFallback: { height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  loadingFallbackText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
});
