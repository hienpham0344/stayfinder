import { MotionScreen } from '../ui/MotionScreen';
import { useOverlayMotion } from '../ui/useOverlayMotion';
import { useReservations } from '../../state/AppState';
import { StayImage } from '../ui/StayImage';
import { findStay, stayImage } from '../../constants/stayCatalog';
import { formatDateRange, formatMoney, parseTravelDate } from '../../utils/frontendState';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarDays, Heart, ImagePlus, MapPin, Star } from '../../constants/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';

type Tab = 'upcoming' | 'completed' | 'cancelled';
type Booking = { id: string; title: string; location: string; checkIn: string; checkOut?: string; image: import('react-native').ImageSourcePropType; stayId: string; tierName: string; nights: number; total: number; review?: { rating: number; comment: string } };
const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' }, { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
];
const EMPTY_COPY: Record<Tab, string> = {
  upcoming: 'Your next trip is waiting. Explore places picked for a memorable getaway.',
  completed: 'After your first stay, you can revisit it here.',
  cancelled: 'Any cancelled stays will appear here.',
};


export function MyBookingsExperience() {
  const { mockState } = useLocalSearchParams<{ mockState?: string }>();
  const insets = useSafeAreaInsets();
  const { bookings, cancelReservation, saveReview } = useReservations();
  const compact = useUserWindowDimensions().width <= 340;
  const [tab, setTab] = useState<Tab>('upcoming');
  const [dialog, setDialog] = useState<{ type: 'cancel' | 'review'; booking: Booking } | null>(null);
  const dialogMotion = useOverlayMotion(dialog !== null, { kind: 'dialog' });
  const lastDialog = useRef(dialog);
  if (dialog) lastDialog.current = dialog;
  const shownDialog = dialog ?? lastDialog.current;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [demoPhoto, setDemoPhoto] = useState(false);
  const [reviewAttempted, setReviewAttempted] = useState(false);
  const [emptyUpcoming, setEmptyUpcoming] = useState(false);
  useEffect(() => setEmptyUpcoming(mockState === 'empty-upcoming'), [mockState]);
  const openReview = (booking: Booking) => { setRating(booking.review?.rating ?? 0); setComment(booking.review?.comment ?? ''); setDemoPhoto(false); setReviewAttempted(false); setDialog({ type: 'review', booking }); };
  const submitReview = () => {
    if (!dialog || rating === 0 || !comment.trim()) { setReviewAttempted(true); return; }
    saveReview(dialog.booking.id, rating, comment);
    setDialog(null);
  };
  const visibleBookings: Booking[] = bookings.filter((item) => item.status === tab && !(tab === 'upcoming' && emptyUpcoming)).flatMap((item) => {
    const stay = findStay(item.stayId); if (!stay) return [];
    const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return [{ id: item.id, stayId: stay.id, title: stay.title, location: `${stay.location.city}, ${stay.location.province}`, checkIn: dateFormat.format(parseTravelDate(item.checkIn)!), checkOut: dateFormat.format(parseTravelDate(item.checkOut)!), image: stayImage(stay, item.tierId), tierName: stay.roomTiers?.find((room) => room.id === item.tierId)?.name ?? 'Room', nights: item.quote.nights, total: item.quote.total, review: item.review }];
  });


  return <MotionScreen style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.iconButton} onPress={() => router.replace('/')} accessibilityLabel="Back to home" accessibilityRole="button"><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/bookings-back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.inkSoft} />} /></Pressable><Text style={styles.brand}>StayFinder</Text><Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/wishlist')} accessibilityLabel="Open wishlist" accessibilityRole="button"><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/bookings-heart.svg')} width={20} height={18.35} nativeFallback={<Heart size={20} color={COLORS.inkSoft} />} /></Pressable></View>
    <Text style={styles.title}>My Bookings</Text>
    <Text style={styles.subtitle}>Your trips, all in one place.</Text>
    <View style={styles.tabs}>{TABS.map((item) => <Pressable key={item.key} onPress={() => setTab(item.key)} hitSlop={{ top: 3, bottom: 3 }} style={[styles.tab, compact && styles.compactTab]} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: tab === item.key }} aria-selected={tab === item.key}><Text style={[styles.tabText, compact && styles.compactTabText, tab === item.key && styles.activeTabText]}>{item.label}</Text>{tab === item.key && <View style={styles.tabUnderline} />}</Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {!visibleBookings.length ? <View style={styles.empty}><View style={styles.emptyIcon}><CalendarDays size={28} color={COLORS.primary} strokeWidth={1.5} /></View><Text style={styles.emptyTitle}>No {tab} stays</Text><Text style={styles.emptyText}>{EMPTY_COPY[tab]}</Text><Pressable style={styles.emptyAction} onPress={() => router.replace('/(tabs)/search')} accessibilityRole="button"><Text style={styles.emptyActionText}>Explore stays</Text></Pressable></View> : visibleBookings.map((booking) => <View key={booking.id} style={[styles.card]}>
          <View style={styles.cardImageWrap}>
            <StayImage source={booking.image} style={styles.cardImage} accessibilityLabel={`${booking.title}, ${booking.tierName}`} />
          </View>
          <View style={styles.cardBody}><View style={styles.cardTitleRow}><Text style={[styles.stayTitle, tab === 'completed' && styles.completedTitle, tab === 'cancelled' && styles.cancelledTitle]} numberOfLines={2}>{booking.title}</Text><View style={[styles.status, tab === 'completed' && styles.completedStatus, tab === 'cancelled' && styles.cancelledStatus]}><Text style={[styles.statusText, tab === 'completed' && styles.completedStatusText, tab === 'cancelled' && styles.cancelledText]}>{TABS.find((item) => item.key === tab)?.label}</Text></View></View>
          <View style={styles.location}><Se121SharedAsset source={require('../../assets/figma/se121-parity/home/location-pin.svg')} width={10.667} height={13.333} nativeFallback={<MapPin size={14} color={COLORS.textMuted} />} /><Text style={styles.locationText}>{booking.location}</Text></View>
          <View style={[styles.dates]}><View><Text style={styles.dateLabel}>{tab === 'cancelled' ? 'Original Check-in' : 'Check-in'}</Text><Text style={[styles.dateValue, tab === 'cancelled' && styles.cancelledDateValue]}>{booking.checkIn}</Text></View>{tab !== 'cancelled' && <View><Text style={styles.dateLabel}>Check-out</Text><Text style={styles.dateValue}>{booking.checkOut}</Text></View>}</View>
          <View style={styles.reservationSummary}><Text style={styles.roomName}>{booking.tierName} · {booking.nights} nights</Text><Text style={styles.bookingTotal}>{formatMoney(booking.total, true)}</Text></View>
          <View style={styles.cardFooter}>{tab === 'upcoming' ? <Pressable style={styles.action} onPress={() => setDialog({ type: 'cancel', booking })} accessibilityRole="button"><Text style={styles.actionText}>Manage Booking</Text></Pressable> : tab === 'completed' ? <Pressable style={styles.reviewAction} onPress={() => openReview(booking)} accessibilityRole="button"><Text style={styles.reviewActionText}>{booking.review ? 'Edit Review' : 'Write a Review'}</Text></Pressable> : <Pressable style={styles.rebookAction} onPress={() => router.push(`/room/${booking.stayId}` as never)} accessibilityRole="button"><Text style={styles.rebookActionText}>Rebook</Text></Pressable>}</View>
          </View>
        </View>)}
    </ScrollView>
    <Modal visible={dialogMotion.presented} transparent animationType="none" onRequestClose={() => setDialog(null)}>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dialogScrim, dialogMotion.backdropStyle]} />
        <ScrollView pointerEvents={dialog ? 'auto' : 'none'} contentContainerStyle={styles.modalCenter} keyboardShouldPersistTaps="handled"><Animated.View style={[styles.modalCard, shownDialog?.type === 'cancel' ? styles.cancelCard : styles.reviewCard, dialogMotion.panelStyle]}>
          {shownDialog?.type === 'cancel' && <><Text style={styles.cancelTitle}>Cancel booking?</Text><Text style={styles.cancelDescription}>Cancel this upcoming reservation? Please review the cancellation policy before confirming.</Text><View style={styles.cancelInfo}><Text style={styles.cancelInfoLabel}>Room</Text><Text style={styles.cancelInfoValue}>{shownDialog.booking.tierName} · {shownDialog.booking.nights} nights</Text></View><View style={styles.cancelInfo}><Text style={styles.cancelInfoLabel}>Stay dates</Text><Text style={styles.cancelInfoValue}>{shownDialog.booking.checkIn} – {shownDialog.booking.checkOut}</Text></View><Pressable style={styles.dangerButton} onPress={() => { cancelReservation(shownDialog.booking.id); setDialog(null); setTab('cancelled'); }} accessibilityRole="button"><Text style={styles.dangerText}>Confirm cancellation</Text></Pressable><Pressable style={styles.dialogCancelButton} onPress={() => setDialog(null)} accessibilityRole="button"><Text style={styles.dialogCancelText}>Cancel</Text></Pressable></>}
          {shownDialog?.type === 'review' && <><Text style={styles.reviewTitle}>Review {shownDialog.booking.title}</Text><Text style={styles.reviewDescription}>Tell other travelers about your stay.</Text><View style={styles.ratingBlock}><View style={styles.ratingHeader}><Text style={styles.reviewFieldLabel}>Rating</Text><Text style={styles.ratingHint}>Tap a star to rate</Text></View><View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating(value)} hitSlop={4} style={styles.starButton} accessibilityLabel={`Rate ${value} stars`} accessibilityRole="radio" accessibilityState={{ checked: value === rating }} aria-checked={value === rating}><Star size={28} color={COLORS.starGold} fill={value <= rating ? COLORS.starGold : 'none'} /></Pressable>)}</View></View>{reviewAttempted && rating === 0 && <Text style={styles.error}>Select a rating.</Text>}<View style={styles.commentField}><Text style={[styles.reviewFieldLabel, styles.commentLabel]}>Comment</Text><TextInput value={comment} onChangeText={setComment} multiline placeholder="What made your stay memorable?" placeholderTextColor={COLORS.textSecondary} style={styles.commentInput} /></View>{reviewAttempted && !comment.trim() && <Text style={styles.error}>Add a comment.</Text>}<View style={styles.photosSection}>
  <Text style={styles.reviewFieldLabel}>Photos</Text>
  <View style={styles.photoRow}>
    {demoPhoto ? <>
      <Pressable style={[styles.photoButton, styles.photoPreviewButton]} onPress={() => setDemoPhoto(false)} accessibilityLabel="Remove photo" accessibilityRole="button">
        <Se121SharedAsset source={require('../../assets/figma/se121-parity/bookings/review-photo-added.svg')} width={26} nativeFallback={<ImagePlus size={26} color={COLORS.primary} />} />
        <Text style={[styles.photoText, styles.photoAddedText]}>Photo added</Text>
      </Pressable>
      <Pressable style={[styles.photoButton, styles.addMoreButton]} onPress={() => setDemoPhoto(true)} accessibilityLabel="Add more photos" accessibilityRole="button">
        <Se121SharedAsset source={require('../../assets/figma/se121-parity/bookings/review-add-more.svg')} width={24} nativeFallback={<ImagePlus size={24} color={COLORS.primary} />} />
        <Text style={[styles.photoText, styles.photoAddedText]}>Add more</Text>
      </Pressable>
    </> : <Pressable style={styles.photoButton} onPress={() => setDemoPhoto(true)} accessibilityLabel="Add photos" accessibilityRole="button">
      <Se121SharedAsset source={require('../../assets/figma/se121-parity/bookings/review-add-photo.svg')} width={26} nativeFallback={<ImagePlus size={26} color={COLORS.primary} />} />
      <Text style={styles.photoText}>Add photos</Text>
    </Pressable>}
  </View>
</View><Pressable style={styles.submitButton} onPress={submitReview} accessibilityRole="button"><Text style={styles.submitText}>Submit review</Text></Pressable><Pressable style={styles.dialogCancelButton} onPress={() => setDialog(null)} accessibilityRole="button"><Text style={[styles.dialogCancelText, styles.reviewCancelText]}>Cancel</Text></Pressable></>}
        </Animated.View></ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  </MotionScreen>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, backgroundColor: COLORS.bgMain },
  iconButton: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  brand: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  title: { marginHorizontal: SPACING.xl, marginTop: 12, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 28, lineHeight: 36, letterSpacing: -0.8 },
  subtitle: { marginHorizontal: SPACING.xl, marginTop: 2, color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20 },
  tabs: { height: 44, marginTop: 22, paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tab: { height: 44, flex: 1, minWidth: 0, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  tabUnderline: { position: 'absolute', bottom: -1, left: '25%', right: '25%', height: 2, backgroundColor: COLORS.actionTeal },
  compactTab: { paddingHorizontal: 2 },
  tabText: { flexShrink: 1, maxWidth: '100%', textAlign: 'center', color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13, lineHeight: 20 },
  compactTabText: { fontSize: 12, lineHeight: 16 },
  activeTabText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.semibold },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 20, paddingBottom: 100, flexGrow: 1 },
  card: { borderRadius: RADII.promo, overflow: 'hidden', marginBottom: 16, padding: 14, backgroundColor: COLORS.bgCard },
  cardImageWrap: { height: 128, overflow: 'hidden', backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  cardImage: { position: 'absolute', top: '-17.69%', width: '100%', height: '135.38%' },
  cardBody: { paddingTop: 16 },
  reservationSummary: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight, gap: 6 },
  roomName: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20 },
  bookingTotal: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 22, lineHeight: 30 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stayTitle: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  completedTitle: { color: COLORS.textSecondary },
  cancelledTitle: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  status: { minHeight: 24, paddingHorizontal: 8, backgroundColor: COLORS.primaryLight, justifyContent: 'center' },
  statusText: { color: COLORS.primaryContainer, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  completedStatus: { backgroundColor: COLORS.borderLight },
  completedStatusText: { color: COLORS.textSecondary },
  cancelledStatus: { minHeight: 26, paddingHorizontal: 9, borderWidth: 1, borderColor: COLORS.error, backgroundColor: COLORS.bgSurface },
  cancelledText: { color: COLORS.error },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  dates: { flexDirection: 'row', gap: 16, marginTop: 8 },
  dateLabel: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  dateValue: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  cancelledDateValue: { color: COLORS.textMuted },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  total: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 14 },
  action: { minHeight: 44, paddingHorizontal: 24, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  reviewAction: { height: 46, paddingHorizontal: 25, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  reviewActionText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  rebookAction: { height: 44, paddingHorizontal: 24, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  rebookActionText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  demoNote: { marginTop: 12, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, textAlign: 'center' },
  empty: { minHeight: 320, flexGrow: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  emptyText: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 270, marginTop: 8 },
  emptyAction: { minHeight: 44, marginTop: 22, paddingHorizontal: 24, borderRadius: RADII.md, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  emptyActionText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  modalBackdrop: { flex: 1 },
  dialogScrim: { backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCenter: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 24 },
  modalCard: { width: '100%', maxWidth: 350, alignSelf: 'center', padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgSurface },
  manageCenter: { justifyContent: 'flex-start', paddingTop: 220 },
  manageCard: { gap: 16 },
  manageTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  manageDescription: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  manageConfirm: { height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  manageConfirmText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  manageCancel: { height: 44, alignItems: 'center', justifyContent: 'center' },
  manageCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  cancelCard: { gap: 16 },
  cancelTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 24, textAlign: 'center' },
  cancelDescription: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  cancelInfo: { height: 68, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surfaceSage, justifyContent: 'center', gap: 8 },
  cancelInfoLabel: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 16 },
  cancelInfoValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  dangerButton: { height: 48, borderRadius: RADII.promo, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  dialogCancelButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
  dialogCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  reviewCard: { minHeight: 598, gap: 14, shadowColor: COLORS.textSecondary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 14, boxShadow: '0px 10px 28px 0px rgba(5,31,26,0.12)' },
  reviewCancelText: { fontFamily: TYPOGRAPHY.families.medium },
  reviewTitle: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  reviewDescription: { width: '100%', color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  ratingBlock: { width: '100%', minHeight: 78, paddingVertical: 2, gap: 6 },
  ratingHeader: { height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewFieldLabel: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18 },
  ratingHint: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 18, textAlign: 'right' },
  commentLabel: { lineHeight: 16 },
  stars: { width: '100%', height: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  starButton: { flex: 1, maxWidth: 42, aspectRatio: 1, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.starGold, backgroundColor: COLORS.starSurface, alignItems: 'center', justifyContent: 'center' },
  commentField: { width: '100%', height: 104, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.surfacePale, gap: 6 },
  commentInput: { flex: 1, minHeight: 0, padding: 0, paddingTop: Platform.OS === 'web' ? 16 : 0, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20, textAlignVertical: 'center' },
  error: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  photosSection: { width: '100%', minHeight: 118, gap: 8 },
  photoButton: { width: 88, height: 88, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderDark, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  photoPreviewButton: { backgroundColor: COLORS.bgSurface, borderColor: COLORS.primary },
  photoRow: { height: 88, flexDirection: 'row', alignItems: 'center', gap: 10 },
  addMoreButton: { backgroundColor: COLORS.bgSurface, borderColor: COLORS.borderDark },
  photoAddedText: { color: COLORS.primary },
  photoPreview: { width: '100%', height: '100%' },
  photoText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  modalFootnote: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  submitButton: { height: 48, borderRadius: RADII.promo, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
});
