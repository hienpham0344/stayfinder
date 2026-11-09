import { MotionScreen } from '../ui/MotionScreen';
import { StayImage } from '../ui/StayImage';
import React, { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronRight, Heart, MapPin, Star, X } from '../../constants/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { findStay, stayGallery } from '../../constants/stayCatalog';
import { useBookingDraft } from '../../state/AppState';
import { availableRoom } from '../../utils/frontendState';
import { MissingStay } from '../ui/MissingStay';
import { HeartButton } from '../ui/HeartButton';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { ImageCarousel } from './ImageCarousel';
import { AmenityGrid } from './AmenityGrid';
import { PriceFooter } from './PriceFooter';
import { ComparePricesModal } from './ComparePricesModal';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';

const PROPERTY_DETAILS = 'Check-in from 3:00 PM. Check-out before 11:00 AM. Review the room cancellation policy before booking.';
const REVIEWER_IMAGES = [
  require('../../assets/figma/se121-parity/property/reviewer-original-1.png'),
  require('../../assets/figma/se121-parity/property/reviewer-original-2.png'),
  require('../../assets/figma/se121-parity/property/reviewer-original-3.png'),
];
const REVIEW_BY_STARS: Record<number, { heading: string; text: string }> = {
  1: { heading: 'Avery · 1 star', text: 'The room did not meet expectations. Staff followed up on our feedback.' },
  2: { heading: 'Noah · 2 stars', text: 'Good location, but check-in took longer than expected.' },
  3: { heading: 'Sofia · 3 stars', text: 'Comfortable stay overall, with room for improvement at breakfast.' },
  4: { heading: 'Liam · 4 stars', text: 'Clean room and helpful staff. The location was convenient.' },
  5: { heading: 'Maya Chen · 5 stars', text: 'Beautiful room, smooth check-in, and lovely staff. We would stay here again.' },
};

export function RoomDetailExperience() {
  const gradientId = `property-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { id } = useLocalSearchParams<{ id: string }>();
  const stay = findStay(id);
  const { draft, beginBooking } = useBookingDraft();
  const availableTier = stay ? availableRoom(stay, draft, draft.stayId === stay.id ? draft.tierId : undefined) : undefined;
  const propertyImages = stay ? stayGallery(stay) : [];
  const insets = useSafeAreaInsets();
  const { width } = useUserWindowDimensions();
  const reviewFilterWidth = Math.min(64, (width - 40 - 28) / 5);
  const [expanded, setExpanded] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [compareVisible, setCompareVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedReviewStars, setSelectedReviewStars] = useState(5);
  const dialogEntrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!dialogVisible) { dialogEntrance.setValue(0); return; }
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) dialogEntrance.setValue(1);
      else Animated.timing(dialogEntrance, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }).catch(() => { if (!cancelled) dialogEntrance.setValue(1); });
    return () => { cancelled = true; dialogEntrance.stopAnimation(); };
  }, [dialogVisible, dialogEntrance]);

  if (!stay) return <MissingStay />;
  return <MotionScreen style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      <View>
        <ImageCarousel key={stay.id} images={propertyImages.map((_, index) => `${stay.id}-${index}`)} imageSources={propertyImages} onOpen={() => setGalleryVisible(true)} />
        <Svg pointerEvents="none" width="100%" height={56 + insets.top} style={styles.heroGradient}><Defs><LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#000" stopOpacity={0.5} /><Stop offset="1" stopColor="#000" stopOpacity={0} /></LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${gradientId})`} /></Svg>
        <View style={[styles.heroActions, { top: insets.top + 4 }]}>
          <Pressable style={[styles.roundAction, styles.backAction]} onPress={() => router.canGoBack() ? router.back() : router.replace('/search')} accessibilityRole="button" accessibilityLabel="Back"><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/property-back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.photoText} />} /></Pressable>
          <HeartButton stayId={stay.id} style={styles.roundAction} />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}><Text style={styles.title} numberOfLines={2}>{stay.title}</Text><View style={styles.ratingPill}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/property-rating.svg')} width={11.6667} height={11.0833} nativeFallback={<Star size={12} color={COLORS.accentOrange} fill={COLORS.accentOrange} />} /><Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text></View></View>
        <Pressable style={styles.locationLine} onPress={() => setDialogVisible(true)} accessibilityRole="button" accessibilityLabel={`${stay.location.city}, ${stay.location.province}`}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/property-location.svg')} width={12} height={15} nativeFallback={<MapPin size={15} color={COLORS.textSecondary} />} /><Text style={styles.locationText}>{stay.location.city}, {stay.location.province}</Text></Pressable>
        <AmenityGrid amenities={stay.amenities} />
        <View style={styles.aboutSection}><Text style={styles.sectionTitle}>About this property</Text><Text style={styles.description}>{stay.description}{expanded ? `\n\n${PROPERTY_DETAILS}` : ''}</Text><Pressable onPress={() => setExpanded(!expanded)} style={styles.readMore} accessibilityRole="button"><Text style={styles.readMoreText}>{expanded ? 'Read less' : 'Read more'}</Text></Pressable></View>
        <View style={styles.locationSection}><Text style={styles.sectionTitle}>Location</Text><View style={styles.mapCard}>{stay.id === 'villa-azure' ? <Image source={require('./property-location-map.jpeg')} style={styles.mapImage} resizeMode="cover" /> : <Text style={{ padding: 24, color: COLORS.textSecondary }}>{stay.location.address}</Text>}<View style={styles.mapPinHalo}><View style={styles.mapPin}><MapPin size={16} color={COLORS.onPrimary} /></View></View></View></View>
        <View style={styles.reviewsSection}><View style={styles.reviewsSummary}><View style={styles.reviewScore}><Text style={styles.reviewRating}>{stay.rating.toFixed(1)}</Text><View><View style={styles.reviewStars}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={13} color={COLORS.accentOrange} fill={star < 5 ? COLORS.accentOrange : 'none'} />)}</View><Text style={styles.reviewCount}>({stay.reviewCount} reviews · demo)</Text></View></View><View style={styles.avatarStack}>{REVIEWER_IMAGES.map((source, index) => <Image key={index} source={source} style={[styles.reviewerAvatar, index > 0 && styles.overlapAvatar]} resizeMode="cover" />)}<View style={[styles.reviewerAvatar, styles.reviewerMore, styles.overlapAvatar]}><Text style={styles.reviewerMoreText}>+117</Text></View></View></View>
          <View style={styles.guestReviews}><Text style={styles.sectionTitle}>Guest reviews</Text><Text style={styles.reviewHint}>Explore sample reviews by rating</Text><View style={styles.reviewFilters}>{[1, 2, 3, 4, 5].map((stars) => <Pressable key={stars} style={[styles.reviewFilter, { width: reviewFilterWidth }, stars === selectedReviewStars && styles.selectedReviewFilter]} onPress={() => setSelectedReviewStars(stars)} accessibilityRole="button" accessibilityLabel={'Filter ' + stars + ' star reviews'} accessibilityState={{ selected: stars === selectedReviewStars }} aria-pressed={stars === selectedReviewStars}><Text style={[styles.reviewFilterText, stars === selectedReviewStars && styles.selectedReviewFilterText]}>{stars} ★</Text></Pressable>)}</View><View style={styles.reviewCard}><Text style={styles.reviewCardText}>{REVIEW_BY_STARS[selectedReviewStars].heading}</Text><Text style={styles.reviewCardText}>{REVIEW_BY_STARS[selectedReviewStars].text}</Text></View></View>
        </View>
      </View>
    </ScrollView>
    <PriceFooter stayId={stay.id} pricePerNight={availableTier?.pricePerNight ?? stay.pricePerNight} priceLabel={availableTier ? undefined : 'Unavailable'} onBookNow={() => { beginBooking(stay.id); setCompareVisible(true); }} />
    <ComparePricesModal visible={compareVisible} onClose={() => setCompareVisible(false)} stayId={stay.id} stayTitle={stay.title} comparisons={stay.priceComparisons || []} />
    <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}><View style={styles.contextRoot}><Pressable style={StyleSheet.absoluteFill} onPress={() => setDialogVisible(false)} accessibilityLabel="Close dialog" accessibilityRole="button" /><Animated.View style={[styles.contextCard, { opacity: dialogEntrance, transform: [{ scale: dialogEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}><Text style={styles.contextTitle}>Property location</Text><Text style={styles.contextDescription}>{stay.location.address}. Check the address with your confirmation before travelling.</Text><Pressable style={styles.contextConfirm} onPress={() => setDialogVisible(false)} accessibilityRole="button"><Text style={styles.contextConfirmText}>Done</Text></Pressable><Pressable style={styles.contextCancel} onPress={() => setDialogVisible(false)} accessibilityRole="button"><Text style={styles.contextCancelText}>Cancel</Text></Pressable></Animated.View></View></Modal>

    <Modal visible={galleryVisible} animationType="slide" onRequestClose={() => setGalleryVisible(false)}>
      <View style={[styles.gallery, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
        <View style={styles.galleryHeader}><Text style={styles.galleryTitle}>Photos</Text><Pressable style={styles.galleryClose} onPress={() => setGalleryVisible(false)} accessibilityLabel="Close gallery" accessibilityRole="button"><X size={24} color={COLORS.photoText} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.galleryList}>{propertyImages.map((source, index) => <StayImage key={index} source={source} style={styles.galleryImage} resizeMode="cover" />)}</ScrollView>
      </View>
    </Modal>
  </MotionScreen>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  scroll: { flexGrow: 1 },
  heroActions: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  heroGradient: { position: 'absolute', top: 0, left: 0 },
  roundAction: { width: 48, height: 48, borderRadius: RADII.full, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center', shadowColor: '#0A2E26', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 2.5, elevation: 4 },
  backAction: { width: 48, height: 48, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderControl, shadowOpacity: 0, elevation: 0 },
  body: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  ratingPill: { height: 28, paddingHorizontal: 8, borderRadius: RADII.full, backgroundColor: COLORS.bgSecondary, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
  locationText: { flex: 1, color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  aboutSection: { marginTop: SPACING.section, gap: 8 },
  locationSection: { marginTop: SPACING.section, gap: 8 },
  section: { paddingTop: SPACING.section },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  description: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 26 },
  readMore: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  readMoreText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  mapCard: { height: 160, borderRadius: 32, overflow: 'hidden', backgroundColor: COLORS.bgSecondary, ...SHADOWS.cardSoft },
  mapImage: { width: '100%', height: '100%' },
  mapPinHalo: { position: 'absolute', left: '50%', top: '50%', width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: RADII.full, backgroundColor: COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  mapPin: { width: 20, height: 20, borderRadius: RADII.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  mapAddress: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
  reviewLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reviewRating: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  reviewCount: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  reviewsSection: { marginTop: SPACING.section, paddingTop: 24, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  reviewsSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewScore: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewStars: { flexDirection: 'row', alignItems: 'center' },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: COLORS.borderLight },
  overlapAvatar: { marginLeft: -12 },
  reviewerMore: { backgroundColor: COLORS.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  reviewerMoreText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  guestReviews: { marginTop: 24, gap: 12 },
  reviewHint: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  reviewFilters: { flexDirection: 'row', alignItems: 'center', gap: 7, overflow: 'hidden' },
  reviewFilter: { width: 64, height: 36, borderRadius: 18, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center' },
  selectedReviewFilter: { backgroundColor: COLORS.primaryActive },
  reviewFilterText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  selectedReviewFilterText: { color: COLORS.onPrimary },
  reviewCard: { minHeight: 117, padding: 16, gap: 10, borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgSurface },
  reviewCardText: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  helperText: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: RADII.full },
  hostName: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  compareCard: { minHeight: 80, marginVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.borderTealSoft, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceMint, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compareCopy: { gap: 4 },
  compareTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 16 },
  compareSubtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  contextRoot: { flex: 1, backgroundColor: COLORS.bgSecondary },
  contextCard: { position: 'absolute', top: 220, left: 20, right: 20, padding: 24, borderRadius: 24, backgroundColor: COLORS.bgSurface, alignItems: 'center', gap: 16 },
  contextTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 24, textAlign: 'center' },
  contextDescription: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  contextConfirm: { alignSelf: 'stretch', height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  contextConfirmText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  contextCancel: { alignSelf: 'stretch', height: 44, alignItems: 'center', justifyContent: 'center' },
  contextCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  toastRoot: { flex: 1, backgroundColor: COLORS.bgSecondary, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 92 },
  toastCard: { height: 52, borderRadius: 16, paddingHorizontal: 20, justifyContent: 'center', backgroundColor: COLORS.bgSecondary },
  toastText: { color: COLORS.photoText, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  gallery: { flex: 1, backgroundColor: COLORS.overlayBlack },
  galleryHeader: { minHeight: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  galleryTitle: { color: COLORS.photoText, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  galleryClose: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  galleryList: { gap: 8, padding: 8 },
  galleryImage: { width: '100%', height: 220, borderRadius: RADII.md },
});
