import { MotionScreen } from '../ui/MotionScreen';
import { StayImage } from '../ui/StayImage';
import { STAY_CATALOG, stayImage } from '../../constants/stayCatalog';
import { useWishlist, useReservations } from '../../state/AppState';
import { formatMoney } from '../../utils/frontendState';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Heart, Star } from '../../constants/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

type Tab = 'all' | 'upcoming' | 'dream';

type WishlistStay = {
  id: string;
  title: string;
  location: string;
  price: string;
  rating: string;
  image: import('react-native').ImageSourcePropType;
};

const TABS: { key: Tab; title: string }[] = [
  { key: 'all', title: 'All Saves' },
  { key: 'upcoming', title: 'Upcoming Trips' },
  { key: 'dream', title: 'Dream Destinations' },
];

const WISHLIST_ASSETS = {
  back: require('../../assets/figma/se121-parity/wishlist/back.svg'),
  more: require('../../assets/figma/se121-parity/wishlist/more.svg'),
  heartSaved: require('../../assets/figma/se121-parity/wishlist/heart-saved.svg'),
  ratingStar: require('../../assets/figma/se121-parity/wishlist/rating-star.svg'),
};

function WishlistCard({ stay, onRemove }: { stay: WishlistStay; onRemove: () => void }) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.cardTap} onPress={() => router.push(`/room/${stay.id}` as never)} accessibilityRole="button" accessibilityLabel={`View ${stay.title}`}>
        <View style={styles.imageWrap}>
          <StayImage source={stay.image} style={styles.image} resizeMode="cover" />

          <View style={styles.ratingBadge}>
            <Se121SharedAsset source={WISHLIST_ASSETS.ratingStar} width={13.333} height={12.667} nativeFallback={<Star size={13} color={COLORS.warning} fill={COLORS.warning} />} />
            <Text style={styles.ratingText}>{stay.rating}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{stay.title}</Text>
          <Text style={styles.city}>{stay.location}</Text>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>{stay.price}</Text>
            <Text style={styles.night}>/ night</Text>
          </View>
        </View>
      </Pressable>
          <Pressable hitSlop={6} accessibilityRole="button" style={styles.heartButton} onPress={(event) => { event.stopPropagation(); onRemove(); }} accessibilityLabel={`Remove ${stay.title} from wishlist`}>
            <Se121SharedAsset source={WISHLIST_ASSETS.heartSaved} width={20} height={18.35} nativeFallback={<Heart size={20} color="#FF5285" fill="#FF5285" />} />
          </Pressable>
    </View>
  );
}

function EmptyWishlist() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptyText}>Save a place you love and find it here for your next trip.</Text>
      <Pressable style={styles.exploreButton} onPress={() => router.replace('/')} accessibilityLabel="Explore stays" accessibilityRole="button">
        <Text style={styles.exploreText}>Explore stays</Text>
      </Pressable>
    </View>
  );
}

export function WishlistExperience() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabsRef = useRef<ScrollView>(null);
  const infoOpacity = useRef(new Animated.Value(0)).current;
  const [tab, setTab] = useState<Tab>('all');
  const { savedIds, toggleWishlist } = useWishlist();
  const { bookings } = useReservations();
  const [lastRemoved, setLastRemoved] = useState<string | null>(null);
  useEffect(() => { if (!lastRemoved) return; const timer = setTimeout(() => setLastRemoved(null), 4500); return () => clearTimeout(timer); }, [lastRemoved]);
  const [showInfo, setShowInfo] = useState(false);
  const upcomingIds = bookings.filter((booking) => booking.status === 'upcoming').map((booking) => booking.stayId);
  const stays: WishlistStay[] = STAY_CATALOG.filter((stay) => savedIds.includes(stay.id) && (tab === 'all' || (tab === 'upcoming' ? upcomingIds.includes(stay.id) : !upcomingIds.includes(stay.id)))).map((stay) => ({ id: stay.id, title: stay.title, location: `${stay.location.city}, ${stay.location.province}`, price: formatMoney(stay.pricePerNight), rating: stay.rating.toFixed(2), image: stayImage(stay) }));

  useEffect(() => {
    if (!showInfo) { infoOpacity.setValue(0); return; }
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) infoOpacity.setValue(1);
      else Animated.timing(infoOpacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }).catch(() => { if (!cancelled) infoOpacity.setValue(1); });
    return () => { cancelled = true; infoOpacity.stopAnimation(); };
  }, [showInfo, infoOpacity]);

  return (
    <MotionScreen style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.replace('/')} accessibilityLabel="Back to home" accessibilityRole="button">
          <Se121SharedAsset source={WISHLIST_ASSETS.back} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.primary} />} />
        </Pressable>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Pressable style={styles.iconButton} onPress={() => setShowInfo(true)} accessibilityLabel="More wishlist options" accessibilityRole="button">
          <Se121SharedAsset source={WISHLIST_ASSETS.more} width={4} height={16} nativeFallback={<View />} />
        </Pressable>
      </View>
      <ScrollView ref={tabsRef} horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {TABS.map((item) => (
          <Pressable key={item.key} onPress={() => { setTab(item.key); requestAnimationFrame(() => tabsRef.current?.scrollTo({ x: 0, animated: false })); }} style={styles.tabTouchTarget} accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }} aria-selected={tab === item.key}>
            <View style={[styles.tab, tab === item.key && styles.activeTab, tab === 'all' && item.key === 'all' && styles.activeAllTab]}><Text style={[styles.tabText, tab === item.key && styles.activeTabText]}>{item.title}</Text></View>
          </Pressable>
        ))}
      </ScrollView>
      <FlatList
        data={stays}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WishlistCard stay={item} onRemove={() => { toggleWishlist(item.id); setLastRemoved(item.id); }} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyWishlist />}
      />
      {lastRemoved && <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, padding: 16, backgroundColor: COLORS.primaryContainer, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text accessibilityLiveRegion="polite" style={{ color: COLORS.textPrimary }}>Stay removed</Text><Pressable hitSlop={10} onPress={() => { if (!savedIds.includes(lastRemoved)) toggleWishlist(lastRemoved); setLastRemoved(null); }} accessibilityRole="button"><Text style={{ color: COLORS.primaryLight, fontFamily: TYPOGRAPHY.families.bold }}>Undo</Text></Pressable></View>}
      <Modal visible={showInfo} transparent animationType="none" onRequestClose={() => setShowInfo(false)}>
        <Animated.View style={[styles.infoOverlay, { opacity: infoOpacity }]}>
          <Pressable style={styles.infoScrim} onPress={() => setShowInfo(false)} accessibilityLabel="Close wishlist information" accessibilityRole="button" />
          <View style={[styles.infoCard, { width: Math.min(width - 40, 350) }]}>
            <Text style={styles.infoTitle}>Manage wishlist</Text>
            <Text style={styles.infoDescription}>Tap a heart to remove a saved stay. Use the tabs to browse upcoming trips and dream destinations.</Text>
            <Pressable style={styles.infoAction} onPress={() => setShowInfo(false)} accessibilityRole="button"><Text style={styles.infoActionText}>Done</Text></Pressable>
            <Pressable style={styles.infoCancel} onPress={() => setShowInfo(false)} accessibilityRole="button"><Text style={styles.infoCancelText}>Cancel</Text></Pressable>
          </View>
        </Animated.View>
      </Modal>
    </MotionScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  tabsScroll: { flexGrow: 0, flexShrink: 0, height: 86, marginHorizontal: SPACING.xl },
  tabs: { paddingTop: SPACING.xs, gap: SPACING.sm, alignItems: 'center' },
  tabTouchTarget: { height: 46, minHeight: 44, justifyContent: 'flex-start', transform: [{ translateY: -6 }] },
  tab: { height: 38, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: RADII.full, backgroundColor: COLORS.bgSecondary },
  activeTab: { backgroundColor: COLORS.primary },
  activeAllTab: { borderWidth: 0 },
  tabText: { color: COLORS.textPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  activeTabText: { color: COLORS.onPrimary },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 0, paddingBottom: 96, flexGrow: 1 },
  card: { borderRadius: 24, height: 336, marginBottom: SPACING.lg, overflow: 'hidden', backgroundColor: COLORS.bgSurface, ...SHADOWS.cardSoft },
  cardTap: { flex: 1 },
  imageWrap: { height: 192, backgroundColor: COLORS.bgCard },
  image: { width: '100%', height: '100%' },
  heartButton: { minWidth: 44, minHeight: 44, position: 'absolute', top: SPACING.lg, right: SPACING.lg, width: 40, height: 40, borderRadius: RADII.full, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.cardSubtle, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(2px)' } as ViewStyle : {}) },
  ratingBadge: { position: 'absolute', bottom: SPACING.lg, left: SPACING.lg, height: 24, borderRadius: RADII.md, backgroundColor: COLORS.bgSurface, paddingHorizontal: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(2px)' } as ViewStyle : {}) },
  ratingText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: TYPOGRAPHY.sizes.xs, lineHeight: TYPOGRAPHY.lineHeights.xs },
  cardBody: { height: 144, padding: SPACING.lg, gap: SPACING.sm },
  cardTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: TYPOGRAPHY.sizes.lg, lineHeight: TYPOGRAPHY.lineHeights.lg },
  city: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: TYPOGRAPHY.sizes.base, lineHeight: TYPOGRAPHY.lineHeights.base },
  priceBlock: { marginTop: SPACING.sm },
  price: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.bold, fontSize: TYPOGRAPHY.sizes.lg, lineHeight: TYPOGRAPHY.lineHeights.md },
  night: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: TYPOGRAPHY.sizes.xs, lineHeight: TYPOGRAPHY.lineHeights.xs },
  empty: { minHeight: 228, padding: SPACING.xxl, gap: SPACING.lg, borderRadius: RADII.promo, backgroundColor: COLORS.bgSurface },
  emptyTitle: { height: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: TYPOGRAPHY.sizes.lg, lineHeight: 25 },
  emptyText: { height: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: TYPOGRAPHY.sizes.base, lineHeight: 22 },
  exploreButton: { height: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: RADII.promo, backgroundColor: COLORS.primaryActive },
  exploreText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: TYPOGRAPHY.sizes.base, lineHeight: 18 },
  infoOverlay: { flex: 1, backgroundColor: COLORS.bgSecondary, alignItems: 'center' },
  infoScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  infoCard: { position: 'absolute', top: 220, padding: 24, borderRadius: 24, backgroundColor: COLORS.bgSurface, gap: 16, alignItems: 'center', overflow: 'hidden' },
  infoTitle: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 24, textAlign: 'center' },
  infoDescription: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  infoAction: { width: '100%', height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  infoActionText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  infoCancel: { width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' },
  infoCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
});
