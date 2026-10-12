import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart, ImageOff, ImagePlus, MapPin, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';

type Tab = 'upcoming' | 'completed' | 'cancelled';
type Booking = { id: string; title: string; location: string; checkIn: string; checkOut?: string; image: number };
const BOOKINGS: Booking[] = [
  { id: 'b-101', title: 'Villa Azure Retreat', location: 'Bali, Indonesia', checkIn: 'Oct 12, 2026', checkOut: 'Oct 15, 2026', image: require('../../assets/figma/se121-parity/bookings/villa-azure-retreat.jpeg') },
  { id: 'b-100', title: 'Zen City Hotel', location: 'Tokyo, Japan', checkIn: 'Aug 05, 2023', checkOut: 'Aug 10, 2023', image: require('../../assets/figma/se121-parity/bookings/zen-city-hotel.jpeg') },
  { id: 'b-099', title: 'Alpine Peak Lodge', location: 'Zermatt, Switzerland', checkIn: 'Dec 20, 2023', image: require('../../assets/figma/se121-parity/bookings/alpine-peak-lodge.jpeg') },
];
const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' }, { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
];
const BOOKING_BY_TAB: Record<Tab, Booking> = { upcoming: BOOKINGS[0], completed: BOOKINGS[1], cancelled: BOOKINGS[2] };

export function MyBookingsExperience() {
  const { mockState } = useLocalSearchParams<{ mockState?: string }>();
  const insets = useSafeAreaInsets();
  const compact = useUserWindowDimensions().width <= 340;
  const [tab, setTab] = useState<Tab>('upcoming');
  const [dialog, setDialog] = useState<{ type: 'cancel' | 'review'; booking: Booking } | null>(null);
  const [cancelledUpcoming, setCancelledUpcoming] = useState(false);
  const cancelEntrance = useRef(new Animated.Value(0)).current;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [demoPhoto, setDemoPhoto] = useState(false);
  const [reviewAttempted, setReviewAttempted] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const [emptyUpcoming, setEmptyUpcoming] = useState(false);
  useEffect(() => setEmptyUpcoming(mockState === 'empty-upcoming'), [mockState]);
  useEffect(() => {
    cancelEntrance.setValue(0);
    if (dialog?.type !== 'cancel') return;
    let cancelled = false;
    const reduceMotion = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? Promise.resolve(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      : AccessibilityInfo.isReduceMotionEnabled();
    reduceMotion.then((reduce) => {
      if (cancelled) return;
      if (reduce) cancelEntrance.setValue(1);
      else Animated.timing(cancelEntrance, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }).catch(() => { if (!cancelled) cancelEntrance.setValue(1); });
    return () => { cancelled = true; cancelEntrance.stopAnimation(); };
  }, [dialog?.type, cancelEntrance]);
  const openReview = (booking: Booking) => { setRating(0); setComment(''); setDemoPhoto(false); setReviewAttempted(false); setDialog({ type: 'review', booking }); };
  const submitReview = () => {
    if (!dialog || rating === 0 || !comment.trim()) { setReviewAttempted(true); return; }
    setDialog(null);
  };
  const booking = tab === 'upcoming' && (emptyUpcoming || cancelledUpcoming) ? null : tab === 'cancelled' && cancelledUpcoming ? BOOKINGS[0] : BOOKING_BY_TAB[tab];

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.iconButton} onPress={() => router.replace('/')} accessibilityLabel="Back to home"><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/bookings-back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.inkSoft} />} /></Pressable><Text style={styles.brand}>StayFinder</Text><Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/wishlist')} accessibilityLabel="Open wishlist"><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/bookings-heart.svg')} width={20} height={18.35} nativeFallback={<Heart size={20} color={COLORS.inkSoft} />} /></Pressable></View>
    <Text style={styles.title}>My Bookings</Text>
    <View style={styles.tabs}>{TABS.map((item, index) => <Pressable key={item.key} onPress={() => setTab(item.key)} hitSlop={{ top: 3, bottom: 3 }} style={[styles.tab, { width: [103, 110, 101][index] }, compact && styles.compactTab]} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: tab === item.key }} aria-selected={tab === item.key}><Text style={[styles.tabText, compact && styles.compactTabText, tab === item.key && styles.activeTabText]}>{item.label}</Text>{tab === item.key && <View style={styles.tabUnderline} />}</Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {!booking ? <View style={styles.empty}><Text style={styles.emptyTitle}>No upcoming stays</Text><Text style={styles.emptyText}>Your next trip starts here. Find a stay and book with confidence.</Text><Pressable style={styles.emptyAction} onPress={() => router.replace('/(tabs)/search')}><Text style={styles.emptyActionText}>Explore stays</Text></Pressable></View> : <View style={[styles.card, tab === 'completed' && styles.completedCard, tab === 'cancelled' && styles.cancelledCard]}>
          <View style={styles.cardImageWrap}>
            {failedImageIds.includes(booking.id)
              ? <ImageOff size={24} color={COLORS.textMuted} />
              : <Image source={booking.image} style={styles.cardImage} resizeMode="cover" onError={() => setFailedImageIds((current) => current.includes(booking.id) ? current : [...current, booking.id])} />}
          </View>
          <View style={styles.cardBody}><View style={styles.cardTitleRow}><Text style={[styles.stayTitle, tab === 'completed' && styles.completedTitle, tab === 'cancelled' && styles.cancelledTitle]} numberOfLines={2}>{booking.title}</Text><View style={[styles.status, tab === 'completed' && styles.completedStatus, tab === 'cancelled' && styles.cancelledStatus]}><Text style={[styles.statusText, tab === 'completed' && styles.completedStatusText, tab === 'cancelled' && styles.cancelledText]}>{TABS.find((item) => item.key === tab)?.label}</Text></View></View>
          <View style={styles.location}><Se121SharedAsset source={require('../../assets/figma/se121-parity/home/location-pin.svg')} width={10.667} height={13.333} nativeFallback={<MapPin size={14} color={COLORS.textMuted} />} /><Text style={styles.locationText}>{booking.location}</Text></View>
          <View style={[styles.dates, tab === 'completed' && styles.completedDates]}><View><Text style={styles.dateLabel}>{tab === 'cancelled' ? 'Original Check-in' : 'Check-in'}</Text><Text style={[styles.dateValue, tab === 'cancelled' && styles.cancelledDateValue]}>{booking.checkIn}</Text></View>{tab !== 'cancelled' && <View><Text style={styles.dateLabel}>Check-out</Text><Text style={styles.dateValue}>{booking.checkOut}</Text></View>}</View>
          <View style={styles.cardFooter}>{tab === 'upcoming' ? <Pressable style={styles.action} onPress={() => setDialog({ type: 'cancel', booking })}><Text style={styles.actionText}>Manage Booking</Text></Pressable> : tab === 'completed' ? <Pressable style={styles.reviewAction} onPress={() => openReview(booking)}><Text style={styles.reviewActionText}>Write a Review</Text></Pressable> : <Pressable style={styles.rebookAction} onPress={() => router.push('/room/stay-alpine' as never)}><Text style={styles.rebookActionText}>Rebook</Text></Pressable>}</View>
          </View>
        </View>}
    </ScrollView>
    <Modal visible={dialog !== null} transparent animationType={dialog?.type === 'cancel' ? 'none' : 'fade'} onRequestClose={() => setDialog(null)}>
      <KeyboardAvoidingView style={[styles.modalBackdrop, dialog?.type === 'cancel' ? styles.cancelBackdrop : styles.reviewBackdrop]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {dialog?.type === 'cancel' && <View pointerEvents="none" style={styles.cancelScrim} />}
        {dialog?.type === 'review' && <View pointerEvents="none" style={styles.reviewScrim} />}
        <ScrollView contentContainerStyle={styles.modalCenter} keyboardShouldPersistTaps="handled"><Animated.View style={[styles.modalCard, dialog?.type === 'cancel' ? styles.cancelCard : styles.reviewCard, dialog?.type === 'cancel' && { opacity: cancelEntrance, transform: [{ scale: cancelEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
          {dialog?.type === 'cancel' && <><Text style={styles.cancelTitle}>Cancel booking?</Text><Text style={styles.cancelDescription}>Cancel this upcoming reservation? Please review the cancellation policy before confirming.</Text><View style={styles.cancelInfo}><Text style={styles.cancelInfoLabel}>Room</Text><Text style={styles.cancelInfoValue}>Deluxe Ocean View • 3 nights</Text></View><View style={styles.cancelInfo}><Text style={styles.cancelInfoLabel}>Stay dates</Text><Text style={styles.cancelInfoValue}>12–15 Oct 2026 · 3 nights</Text></View><Pressable style={styles.dangerButton} onPress={() => { setCancelledUpcoming(true); setDialog(null); setTab('cancelled'); }} accessibilityRole="button"><Text style={styles.dangerText}>Confirm cancellation</Text></Pressable><Pressable style={styles.dialogCancelButton} onPress={() => setDialog(null)} accessibilityRole="button"><Text style={styles.dialogCancelText}>Cancel</Text></Pressable></>}
          {dialog?.type === 'review' && <><Text style={styles.reviewTitle}>Review Zen City Hotel</Text><Text style={styles.reviewDescription}>Tell other travelers about your stay.</Text><View style={styles.ratingBlock}><View style={styles.ratingHeader}><Text style={styles.reviewFieldLabel}>Rating</Text><Text style={styles.ratingHint}>Tap a star to rate</Text></View><View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating(value)} hitSlop={4} style={styles.starButton} accessibilityLabel={`Rate ${value} stars`} accessibilityRole="radio" accessibilityState={{ checked: value === rating }} aria-checked={value === rating}><Se121SharedAsset source={require('../../assets/figma/se121-parity/bookings/review-star.svg')} width={24} nativeFallback={<Star size={24} color={COLORS.starGold} fill={COLORS.starGold} />} /></Pressable>)}</View></View>{reviewAttempted && rating === 0 && <Text style={styles.error}>Select a rating.</Text>}<View style={styles.commentField}><Text style={[styles.reviewFieldLabel, styles.commentLabel]}>Comment</Text><TextInput value={comment} onChangeText={setComment} multiline placeholder="alex.johnson@example.com" placeholderTextColor="#70807A" style={styles.commentInput} /></View>{reviewAttempted && !comment.trim() && <Text style={styles.error}>Add a comment.</Text>}<View style={styles.photosSection}>
  <Text style={styles.reviewFieldLabel}>Photos</Text>
  <View style={styles.photoRow}>
    {demoPhoto ? <>
      <Pressable style={[styles.photoButton, styles.photoPreviewButton]} onPress={() => setDemoPhoto(false)} accessibilityLabel="Remove photo">
        <Se121SharedAsset source={require('../../assets/figma/se121-parity/bookings/review-photo-added.svg')} width={26} nativeFallback={<ImagePlus size={26} color="#006B5E" />} />
        <Text style={[styles.photoText, styles.photoAddedText]}>Photo added</Text>
      </Pressable>
      <Pressable style={[styles.photoButton, styles.addMoreButton]} onPress={() => setDemoPhoto(true)} accessibilityLabel="Add more photos">
        <Se121SharedAsset source={require('../../assets/figma/se121-parity/bookings/review-add-more.svg')} width={24} nativeFallback={<ImagePlus size={24} color="#006B5E" />} />
        <Text style={[styles.photoText, styles.photoAddedText]}>Add more</Text>
      </Pressable>
    </> : <Pressable style={styles.photoButton} onPress={() => setDemoPhoto(true)} accessibilityLabel="Add photos">
      <Se121SharedAsset source={require('../../assets/figma/se121-parity/bookings/review-add-photo.svg')} width={26} nativeFallback={<ImagePlus size={26} color="#006B5E" />} />
      <Text style={styles.photoText}>Add photos</Text>
    </Pressable>}
  </View>
</View><Pressable style={styles.submitButton} onPress={submitReview}><Text style={styles.submitText}>Submit review</Text></Pressable><Pressable style={styles.dialogCancelButton} onPress={() => setDialog(null)}><Text style={[styles.dialogCancelText, styles.reviewCancelText]}>Cancel</Text></Pressable></>}
        </Animated.View></ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWhite },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, backgroundColor: COLORS.bgMain },
  iconButton: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  brand: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  title: { marginHorizontal: SPACING.xl, marginTop: 16, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  tabs: { height: 38, marginTop: 24, paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tab: { height: 38, minWidth: 0, flexShrink: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, backgroundColor: COLORS.actionTeal },
  compactTab: { paddingHorizontal: 6 },
  tabText: { flexShrink: 1, maxWidth: '100%', textAlign: 'center', color: '#596680', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  compactTabText: { fontSize: 12, lineHeight: 16 },
  activeTabText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.semibold },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 40, paddingBottom: 100, flexGrow: 1 },
  card: { marginBottom: 24, padding: 16, paddingBottom: 15, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  completedCard: { opacity: 0.9 },
  cancelledCard: { opacity: 0.75 },
  cardImageWrap: { height: 128, overflow: 'hidden', backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  cardImage: { position: 'absolute', top: '-17.69%', width: '100%', height: '135.38%' },
  cardBody: { paddingTop: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stayTitle: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  completedTitle: { color: COLORS.textSecondary },
  cancelledTitle: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  status: { minHeight: 24, paddingHorizontal: 8, backgroundColor: COLORS.primaryLight, justifyContent: 'center' },
  statusText: { color: COLORS.primaryContainer, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  completedStatus: { backgroundColor: COLORS.borderLight },
  completedStatusText: { color: COLORS.textSecondary },
  cancelledStatus: { minHeight: 26, paddingHorizontal: 9, borderWidth: 1, borderColor: COLORS.error, backgroundColor: COLORS.bgWhite },
  cancelledText: { color: COLORS.error },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  dates: { flexDirection: 'row', gap: 16, marginTop: 8 },
  completedDates: { opacity: 0.75 },
  dateLabel: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  dateValue: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  cancelledDateValue: { color: COLORS.textMuted },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  total: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 14 },
  action: { minHeight: 44, paddingHorizontal: 24, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  reviewAction: { height: 46, paddingHorizontal: 25, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  reviewActionText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  rebookAction: { height: 44, paddingHorizontal: 24, borderRadius: RADII.full, backgroundColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center' },
  rebookActionText: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  demoNote: { marginTop: 12, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, textAlign: 'center' },
  empty: { minHeight: 228, padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite, gap: 16 },
  emptyTitle: { height: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 25 },
  emptyText: { height: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  emptyAction: { height: 48, borderRadius: RADII.promo, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  emptyActionText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  modalBackdrop: { flex: 1 },
  cancelBackdrop: { backgroundColor: '#232323' },
  cancelScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(6px)' } as ViewStyle : {}) },
  reviewBackdrop: { backgroundColor: '#1D1D1D' },
  reviewScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.2)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(4px)' } as ViewStyle : {}) },
  modalCenter: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 24 },
  modalCard: { width: '100%', maxWidth: 350, alignSelf: 'center', padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  manageCenter: { justifyContent: 'flex-start', paddingTop: 220 },
  manageCard: { gap: 16 },
  manageTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  manageDescription: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  manageConfirm: { height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  manageConfirmText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  manageCancel: { height: 44, alignItems: 'center', justifyContent: 'center' },
  manageCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  cancelCard: { gap: 16 },
  cancelTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 24, textAlign: 'center' },
  cancelDescription: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  cancelInfo: { height: 68, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surfaceSage, justifyContent: 'center', gap: 8 },
  cancelInfoLabel: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 16 },
  cancelInfoValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  dangerButton: { height: 48, borderRadius: RADII.promo, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  dialogCancelButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
  dialogCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  reviewCard: { minHeight: 598, gap: 14, shadowColor: '#051F1A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 14, boxShadow: '0px 10px 28px 0px rgba(5,31,26,0.12)' },
  reviewCancelText: { fontFamily: TYPOGRAPHY.families.medium },
  reviewTitle: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  reviewDescription: { width: '100%', color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  ratingBlock: { width: '100%', minHeight: 78, paddingVertical: 2, gap: 6 },
  ratingHeader: { height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewFieldLabel: { color: '#42544F', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18 },
  ratingHint: { color: '#7A8C87', fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 18, textAlign: 'right' },
  commentLabel: { lineHeight: 16 },
  stars: { width: '100%', height: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  starButton: { flex: 1, maxWidth: 42, aspectRatio: 1, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.starGold, backgroundColor: COLORS.starSurface, alignItems: 'center', justifyContent: 'center' },
  commentField: { width: '100%', height: 104, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#DBE8E3', backgroundColor: COLORS.surfacePale, gap: 6 },
  commentInput: { flex: 1, minHeight: 0, padding: 0, paddingTop: Platform.OS === 'web' ? 16 : 0, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20, textAlignVertical: 'center' },
  error: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  photosSection: { width: '100%', minHeight: 118, gap: 8 },
  photoButton: { width: 88, height: 88, borderRadius: 14, borderWidth: 1, borderColor: '#C2D6CF', backgroundColor: '#F9FCFA', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  photoPreviewButton: { backgroundColor: '#E8F6F1', borderColor: '#73B8A6' },
  photoRow: { height: 88, flexDirection: 'row', alignItems: 'center', gap: 10 },
  addMoreButton: { backgroundColor: '#F9FCFA', borderColor: '#C2D6CF' },
  photoAddedText: { color: '#005E54' },
  photoPreview: { width: '100%', height: '100%' },
  photoText: { color: '#005E54', fontFamily: TYPOGRAPHY.families.medium, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  modalFootnote: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  submitButton: { height: 48, borderRadius: RADII.promo, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
});
