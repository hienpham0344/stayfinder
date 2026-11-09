import { useBookingDraft } from '../../state/AppState';
import { findStay } from '../../constants/stayCatalog';
import { availableRoom, formatMoney, travelNights } from '../../utils/frontendState';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Star, Trophy } from '../../constants/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PriceProviderComparison } from '../../types/stay';
import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
import { useOverlayMotion } from '../ui/useOverlayMotion';
import { useReducedMotion } from '../ui/useReducedMotion';

interface ComparePricesModalProps {
  visible: boolean;
  onClose: () => void;
  stayId: string;
  stayTitle: string;
  comparisons: PriceProviderComparison[];
}

type Provider = { name: string; price?: string; image: number; kind: 'best' | 'regular' | 'native' | 'unavailable' };
const PROVIDERS: Provider[] = [
  { name: 'Traveloka', image: require('../../assets/figma/property-completion/traveloka.jpeg'), kind: 'regular' },
  { name: 'Booking.com', image: require('../../assets/figma/property-completion/booking-com.jpeg'), kind: 'regular' },
  { name: 'Agoda', image: require('../../assets/figma/property-completion/agoda.jpeg'), kind: 'regular' },
  { name: 'StayFinder', image: require('../../assets/figma/property-completion/stayfinder-star.svg'), kind: 'native' },
  { name: 'Trivago', image: require('../../assets/figma/se121-parity/property/trivago-badge-13-1441.png'), kind: 'unavailable' },
];
export const ComparePricesModal: React.FC<ComparePricesModalProps> = ({ visible, onClose, stayId, stayTitle, comparisons }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBookingDraft();
  const stay = findStay(stayId);
  const nativeRoom = stay ? availableRoom(stay, draft, draft.stayId === stayId ? draft.tierId : undefined) : undefined;
  const nativeRate = nativeRoom?.pricePerNight;
  const nights = travelNights(draft.checkIn, draft.checkOut);
  const [notice, setNotice] = useState('');
  const providers: Provider[] = PROVIDERS.flatMap((provider) => {
    const comparison = comparisons.find((item) => item.providerName.toLowerCase().includes(provider.name.toLowerCase()));
    if (provider.kind === 'unavailable') return [provider];
    if (!comparison && provider.kind !== 'native') return [];
    const roomMatches = nativeRate !== undefined && (provider.kind === 'native' || nativeRate === stay?.pricePerNight);
    return [{ ...provider, kind: provider.kind === 'native' ? 'native' : 'regular', price: roomMatches ? formatMoney((provider.kind === 'native' ? nativeRate! : comparison!.pricePerNight) * nights * draft.rooms, true) : 'Unavailable' }];
  });
  const { width, height } = useUserWindowDimensions();
  const [sheetHeight, setSheetHeight] = useState(0);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    if (!retrying) return;
    const timer = setTimeout(() => { setRetrying(false); setNotice('Demo refreshed · live provider prices are unavailable'); }, 800);
    return () => clearTimeout(timer);
  }, [retrying]);

  const motion = useOverlayMotion(visible, { distance: sheetHeight || height });
  const reduced = useReducedMotion();
  const skeletonOpacity = useRef(new Animated.Value(0.62)).current;
  useEffect(() => {
    if (!motion.presented) { setRetrying(false); setNotice(''); }
  }, [motion.presented]);
  useEffect(() => {
    if (Platform.OS === 'web' || !visible || !retrying || reduced) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(skeletonOpacity, { toValue: 0.92, duration: 550, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(skeletonOpacity, { toValue: 0.62, duration: 550, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]));
    animation.start();
    return () => { animation.stop(); skeletonOpacity.setValue(0.62); };
  }, [visible, retrying, reduced, skeletonOpacity]);
  const compact = width <= 350;
  const goToRoom = () => {
    onClose();
    router.push(('/room/select?id=' + stayId) as never);
  };
  const retryUnavailable = () => {
    setRetrying(true);
  };

  return (
    <Modal visible={motion.presented} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, motion.backdropStyle]}><Pressable style={[styles.backdrop, retrying && styles.loadingBackdrop]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close price comparison" /></Animated.View>
        <Animated.View testID="compare-prices-panel" onLayout={(event) => setSheetHeight(Math.round(event.nativeEvent.layout.height))} style={[styles.sheet, retrying && styles.loadingSheet, { paddingBottom: insets.bottom }, motion.panelStyle]}>
          <Pressable style={styles.handleArea} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close price comparison"><View style={styles.handle} /></Pressable>
          <View style={styles.header}>
            <Text numberOfLines={2} style={styles.title}>{retrying ? 'Refreshing demo prices…' : 'Compare Prices'}</Text>
            <Text style={styles.subtitle}>{notice || `${nights} nights · ${draft.adults + draft.children} guests · ${draft.rooms} room${draft.rooms > 1 ? 's' : ''} · Demo rates`}</Text>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {retrying ? providers.map((provider) => <View key={provider.name} style={[styles.skeletonRow, provider.kind === 'unavailable' && styles.lastSkeletonRow]}><Animated.View dataSet={{ skeleton: 'true' }} style={[styles.skeletonIcon, { opacity: skeletonOpacity }]} /><Animated.View dataSet={{ skeleton: 'true' }} style={[styles.skeletonName, { opacity: skeletonOpacity }]} /><Animated.View dataSet={{ skeleton: 'true' }} style={[styles.skeletonPrice, { opacity: skeletonOpacity }]} /></View>) : providers.map((provider) => <Animated.View key={provider.name} style={[styles.row, compact && styles.compactRow, provider.kind === 'best' && styles.bestRow, provider.kind === 'native' && styles.nativeRow]}>
              <View style={[styles.providerIcon, compact && styles.compactIcon, provider.kind === 'native' && styles.nativeIcon]}>
                {provider.kind === 'native' ? <Se121SharedAsset source={provider.image} width={23} height={19} nativeFallback={<Star size={23} fill={COLORS.bgWhite} color={COLORS.onPrimary} />} /> : provider.kind === 'unavailable' ? <Image source={provider.image} style={styles.trivagoImage} resizeMode="contain" /> : <Image source={provider.image} style={styles.providerImage} resizeMode="cover" />}
              </View>
              <View style={styles.providerInfo}><View style={styles.providerNameRow}><Text style={[styles.providerName, compact && styles.compactProviderName]} numberOfLines={1}>{provider.name}</Text>{provider.kind === 'native' && <Image source={require('../../assets/figma/se121-parity/property/verified-badge-13-1428.png')} style={styles.verifiedBadge} />}</View>
                {provider.kind === 'best' && <View style={[styles.bestBadge, compact && styles.compactBestBadge]}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/compare-best-badge.svg')} width={8} height={9} nativeFallback={<Trophy size={9} color={COLORS.onPrimary} />} /><Text style={[styles.bestLabel, compact && styles.compactBestLabel]}>BEST PRICE</Text></View>}
                <Text style={styles.nativeHint}>{provider.kind === 'native' ? `${nativeRoom?.name ?? 'Select a room'} · demo` : provider.kind === 'unavailable' ? 'Live quotes unavailable' : provider.price === 'Unavailable' ? 'No quote for this room' : 'Base room · demo quote'}</Text>
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  loadingBackdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', maxHeight: '89%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: COLORS.bgSurface, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0px -7px 13px rgba(5,41,33,0.08)' }, default: { shadowColor: COLORS.textSecondary, shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 6.5, elevation: 10 } }) },
  loadingSheet: { height: '89%', marginBottom: 0 },
  handleArea: { height: 38, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 48, height: 6, borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  header: { paddingHorizontal: 20, paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 4 },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  subtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 8 },
  row: { borderRadius: 16, overflow: 'hidden', minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgSurface },
  compactRow: { gap: 8, padding: 12 },
  bestRow: { borderColor: COLORS.accentOrange, borderLeftWidth: 4, paddingLeft: 13, backgroundColor: COLORS.bgSurface, ...SHADOWS.cardSoft },
  nativeRow: { borderColor: COLORS.primaryActive, borderLeftWidth: 4, paddingLeft: 13, backgroundColor: COLORS.bgSurface },
  providerIcon: { width: 48, height: 48, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
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
  bestLabel: { flexShrink: 1, minWidth: 0, color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  compactBestLabel: { fontSize: 11 },
  priceColumn: { alignItems: 'flex-end', gap: 8 },
  price: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  compactPrice: { fontSize: 17 },
  selectButton: { width: 84, minHeight: 44, borderRadius: RADII.full, backgroundColor: COLORS.accentOrange, alignItems: 'center', justifyContent: 'center' },
  compactButton: { width: 76, minHeight: 44 },
  selectText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  compactSelectText: { fontSize: 12 },
  nativeSelect: { minWidth: 84, height: 36, alignItems: 'center', justifyContent: 'center' },
  nativeSelectText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  skeletonRow: { height: 134, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgSurface },
  lastSkeletonRow: { height: 100 },
  skeletonIcon: { position: 'absolute', top: 21, left: 15, width: 38, height: 38, borderRadius: 6, backgroundColor: COLORS.bgSecondary },
  skeletonName: { position: 'absolute', top: 23, left: 67, width: 118, height: 12, borderRadius: 6, backgroundColor: COLORS.bgSecondary },
  skeletonPrice: { position: 'absolute', top: 23, right: 15, width: 54, height: 16, borderRadius: 6, backgroundColor: COLORS.bgSecondary },
  loadingFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, paddingHorizontal: 20, paddingTop: 16, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderLight },
  loadingFallback: { height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  loadingFallbackText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
});
