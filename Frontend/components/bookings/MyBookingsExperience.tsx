import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Heart, ImageOff, ImagePlus, MapPin, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { cancelDemoBooking, DemoBookingStates, reviewDemoBooking } from '../../utils/demoBookings';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

type Tab = 'upcoming' | 'completed' | 'cancelled';
type Booking = { id: string; title: string; location: string; checkIn: string; checkOut?: string; image: number; stay: typeof MOCK_STAYS[number]; total: number };
const BOOKINGS: Booking[] = [
  { id: 'b-101', title: 'Villa Azure Retreat', location: 'Bali, Indonesia', checkIn: 'Oct 12, 2026', checkOut: 'Oct 15, 2026', image: require('../../assets/figma/se121-parity/bookings/villa-azure-retreat.jpeg'), stay: { ...MOCK_STAYS[0], title: 'Villa Azure Retreat', location: { city: 'Bali', province: 'Indonesia' } }, total: 0 },
  { id: 'b-100', title: 'Zen City Hotel', location: 'Tokyo, Japan', checkIn: 'Aug 05, 2023', checkOut: 'Aug 10, 2023', image: require('../../assets/figma/se121-parity/bookings/zen-city-hotel.jpeg'), stay: { ...MOCK_STAYS[1], title: 'Zen City Hotel', location: { city: 'Tokyo', province: 'Japan' } }, total: 0 },
  { id: 'b-099', title: 'Alpine Peak Lodge', location: 'Zermatt, Switzerland', checkIn: 'Dec 20, 2023', image: require('../../assets/figma/se121-parity/bookings/alpine-peak-lodge.jpeg'), stay: { ...MOCK_STAYS[2], title: 'Alpine Peak Lodge', location: { city: 'Zermatt', province: 'Switzerland' } }, total: 0 },
];
const INITIAL_STATES: DemoBookingStates = { 'b-101': { status: 'upcoming' }, 'b-100': { status: 'completed' }, 'b-099': { status: 'cancelled' } };
const ENGLISH_TAB_LABEL: Record<Tab, string> = { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };
const ENGLISH_STATUS_LABEL: Record<Tab, string> = { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };
const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Sắp tới' }, { key: 'completed', label: 'Hoàn thành' }, { key: 'cancelled', label: 'Đã hủy' },
];
const STATUS_LABEL: Record<Tab, string> = { upcoming: 'Sắp tới', completed: 'Hoàn thành', cancelled: 'Đã hủy' };

export function MyBookingsExperience() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [states, setStates] = useState(INITIAL_STATES);
  const [dialog, setDialog] = useState<{ type: 'cancel' | 'review'; booking: Booking } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [demoPhoto, setDemoPhoto] = useState(false);
  const [reviewAttempted, setReviewAttempted] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const visibleBookings = BOOKINGS.filter((booking) => states[booking.id]?.status === tab);
  const openReview = (booking: Booking) => { setRating(0); setComment(''); setDemoPhoto(false); setReviewAttempted(false); setDialog({ type: 'review', booking }); };
  const submitReview = () => {
    if (!dialog || rating === 0 || !comment.trim()) { setReviewAttempted(true); return; }
    setStates((current) => reviewDemoBooking(current, dialog.booking.id));
    setDialog(null);
  };
  const confirmCancel = () => {
    if (!dialog) return;
    setStates((current) => cancelDemoBooking(current, dialog.booking.id));
    setDialog(null);
    setTab('cancelled');
  };

  Object.assign(STATUS_LABEL, ENGLISH_STATUS_LABEL);

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.iconButton} onPress={() => router.replace('/')} accessibilityLabel="Về trang chủ"><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/bookings-back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.inkSoft} />} /></Pressable><Text style={styles.brand}>StayFinder</Text><Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/wishlist')} accessibilityLabel="Mở yêu thích"><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/bookings-heart.svg')} width={20} height={18.35} nativeFallback={<Heart size={20} color={COLORS.inkSoft} />} /></Pressable></View>
    <Text style={styles.title}>Đặt phòng của tôi</Text>
    <Text style={styles.parityTitle}>My Bookings</Text>
    <View style={styles.tabs}>{TABS.map((item, index) => <Pressable key={item.key} onPress={() => setTab(item.key)} hitSlop={{ top: 3, bottom: 3 }} style={[styles.tab, { width: [103, 110, 101][index] }, tab === item.key && styles.activeTab]} accessibilityRole="tab" accessibilityLabel={ENGLISH_TAB_LABEL[item.key]} accessibilityState={{ selected: tab === item.key }} aria-selected={tab === item.key}><Text style={[styles.tabText, tab === item.key && styles.activeTabText]}>{ENGLISH_TAB_LABEL[item.key]}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {visibleBookings.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Chưa có đặt phòng {STATUS_LABEL[tab].toLowerCase()}</Text><Text style={styles.emptyText}>Các thay đổi trong danh sách này chỉ là dữ liệu demo theo phiên màn hình.</Text></View> : visibleBookings.map((booking) => {
        const bookingState = states[booking.id];
        return <View key={booking.id} style={styles.card}>
          <View style={styles.cardImageWrap}>
            {failedImageIds.includes(booking.id)
              ? <ImageOff size={24} color={COLORS.textMuted} />
              : <Image source={booking.image} style={styles.cardImage} resizeMode="cover" onError={() => setFailedImageIds((current) => current.includes(booking.id) ? current : [...current, booking.id])} />}
          </View>
          <View style={styles.cardBody}><View style={styles.cardTitleRow}><Text style={styles.stayTitle} numberOfLines={2}>{booking.stay.title}</Text><View style={[styles.status, bookingState.status === 'cancelled' && styles.cancelledStatus]}><Text style={[styles.statusText, bookingState.status === 'cancelled' && styles.cancelledText]}>{STATUS_LABEL[bookingState.status]}</Text></View></View>
          <View style={styles.location}><MapPin size={15} color={COLORS.inkSoft} /><Text style={styles.locationText}>{booking.stay.location.city}, {booking.stay.location.province}</Text></View>
          <View style={styles.dates}><View><Text style={styles.dateLabel}>Nhận phòng</Text><Text style={styles.dateValue}>{booking.checkIn}</Text></View><View><Text style={styles.dateLabel}>Trả phòng</Text><Text style={styles.dateValue}>{booking.checkOut}</Text></View></View>
          <View style={styles.cardFooter}><Text style={styles.total}>{new Intl.NumberFormat('vi-VN').format(booking.total)}đ</Text>{bookingState.status === 'upcoming' ? <Pressable style={styles.action} onPress={() => setDialog({ type: 'cancel', booking })}><Text style={styles.actionText}>Hủy đặt phòng</Text></Pressable> : bookingState.status === 'completed' ? <Pressable style={styles.action} onPress={() => openReview(booking)} disabled={bookingState.reviewed}><Text style={styles.actionText}>{bookingState.reviewed ? 'Đã đánh giá' : 'Viết đánh giá'}</Text></Pressable> : null}</View>
          </View>
        </View>;
      })}
      <Text style={styles.demoNote}>Đặt phòng, hủy và đánh giá trên màn này chỉ là dữ liệu mẫu.</Text>
    </ScrollView>
    <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
      <KeyboardAvoidingView style={[styles.modalBackdrop, dialog?.type === 'cancel' ? styles.cancelBackdrop : styles.reviewBackdrop]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.modalCenter} keyboardShouldPersistTaps="handled"><View style={[styles.modalCard, dialog?.type === 'cancel' ? styles.cancelCard : styles.reviewCard]}>
          {dialog?.type === 'cancel' && <><Text style={styles.cancelTitle}>Hủy đặt phòng?</Text><Text style={styles.cancelDescription}>Hủy chỗ ở sắp tới trong phiên demo? Thay đổi chỉ áp dụng cho dữ liệu mẫu.</Text><View style={styles.cancelInfo}><Text style={styles.cancelInfoLabel}>Chỗ ở</Text><Text style={styles.cancelInfoValue}>{dialog.booking.stay.title}</Text></View><View style={styles.cancelInfo}><Text style={styles.cancelInfoLabel}>Ngày lưu trú</Text><Text style={styles.cancelInfoValue}>{dialog.booking.checkIn} – {dialog.booking.checkOut}</Text></View><Pressable style={styles.dangerButton} onPress={confirmCancel}><Text style={styles.dangerText}>Xác nhận hủy</Text></Pressable><Pressable style={styles.dialogCancelButton} onPress={() => setDialog(null)}><Text style={styles.dialogCancelText}>Quay lại</Text></Pressable></>}
          {dialog?.type === 'review' && <><Text style={styles.reviewTitle}>Đánh giá {dialog.booking.stay.title}</Text><Text style={styles.reviewDescription}>Chia sẻ cảm nhận về chuyến đi mẫu.</Text><View style={styles.ratingBlock}><View style={styles.ratingHeader}><Text style={styles.reviewFieldLabel}>Đánh giá</Text><Text style={styles.ratingHint}>Chạm để chọn sao</Text></View><View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating(value)} hitSlop={4} style={styles.starButton} accessibilityLabel={`${value} sao`} accessibilityRole="radio" accessibilityState={{ checked: value === rating }} aria-checked={value === rating}><Star size={22} color={COLORS.starGold} fill={value <= rating ? COLORS.starGold : 'none'} /></Pressable>)}</View></View>{reviewAttempted && rating === 0 && <Text style={styles.error}>Vui lòng chọn số sao.</Text>}<View style={styles.commentField}><Text style={styles.reviewFieldLabel}>Bình luận</Text><TextInput value={comment} onChangeText={setComment} multiline placeholder="Trải nghiệm của bạn..." placeholderTextColor={COLORS.inkSubtle} style={styles.commentInput} /></View>{reviewAttempted && !comment.trim() && <Text style={styles.error}>Vui lòng nhập bình luận.</Text>}<View style={styles.photosSection}><Text style={styles.reviewFieldLabel}>Ảnh minh họa</Text><Pressable style={[styles.photoButton, demoPhoto && styles.photoPreviewButton]} onPress={() => setDemoPhoto((current) => !current)} accessibilityLabel={demoPhoto ? 'Xóa ảnh minh họa' : 'Thêm ảnh minh họa'}>{demoPhoto ? (failedImageIds.includes(`review-${dialog.booking.id}`) ? <ImageOff size={26} color={COLORS.textMuted} /> : <Image source={{ uri: dialog.booking.stay.images[0] }} style={styles.photoPreview} onError={() => setFailedImageIds((current) => current.includes(`review-${dialog.booking.id}`) ? current : [...current, `review-${dialog.booking.id}`])} />) : <><ImagePlus size={26} color={COLORS.primary} /><Text style={styles.photoText}>Thêm ảnh</Text></>}</Pressable></View><Text style={styles.modalFootnote}>Đánh giá và ảnh chỉ hiển thị trong phiên, không được gửi đi.</Text><Pressable style={styles.submitButton} onPress={submitReview}><Text style={styles.submitText}>Gửi đánh giá demo</Text></Pressable><Pressable style={styles.dialogCancelButton} onPress={() => setDialog(null)}><Text style={styles.dialogCancelText}>Hủy</Text></Pressable></>}
        </View></ScrollView>
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
  tab: { height: 38, minWidth: 0, flexShrink: 1, borderRadius: RADII.full, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.bgWhite },
  activeTab: { borderBottomColor: COLORS.actionTeal },
  tabText: { flexShrink: 1, maxWidth: '100%', textAlign: 'center', color: '#596680', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  activeTabText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.semibold },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 40, paddingBottom: 100, flexGrow: 1 },
  card: { marginBottom: 24, padding: 16, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  cardImageWrap: { height: 128, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', height: '100%' },
  cardBody: { paddingTop: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stayTitle: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  status: { minHeight: 24, paddingHorizontal: 8, backgroundColor: COLORS.primaryLight, justifyContent: 'center' },
  statusText: { color: COLORS.primaryContainer, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11 },
  cancelledStatus: { backgroundColor: COLORS.errorBg },
  cancelledText: { color: COLORS.validation },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  dates: { flexDirection: 'row', gap: 16, marginTop: 4 },
  dateLabel: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  dateValue: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 16, paddingTop: 16 },
  total: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 14 },
  action: { minHeight: 44, paddingHorizontal: 24, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  demoNote: { marginTop: 12, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, textAlign: 'center' },
  empty: { marginTop: 64, padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.surfaceMint, alignItems: 'center', gap: 12 },
  emptyTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18, textAlign: 'center' },
  emptyText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, textAlign: 'center' },
  modalBackdrop: { flex: 1 },
  cancelBackdrop: { backgroundColor: 'rgba(0,0,0,0.35)' },
  reviewBackdrop: { backgroundColor: 'rgba(0,0,0,0.2)' },
  modalCenter: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 24 },
  modalCard: { width: '100%', maxWidth: 350, alignSelf: 'center', padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  cancelCard: { gap: 16 },
  cancelTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  cancelDescription: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  cancelInfo: { height: 68, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surfaceSage, justifyContent: 'center', gap: 2 },
  cancelInfoLabel: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
  cancelInfoValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  dangerButton: { height: 48, borderRadius: RADII.promo, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  dialogCancelButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
  dialogCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  reviewCard: { minHeight: 598, gap: 14, ...SHADOWS.elevated_layer2 },
  reviewTitle: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  reviewDescription: { width: '100%', color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  ratingBlock: { width: '100%', minHeight: 78, paddingVertical: 2, gap: 6 },
  ratingHeader: { height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewFieldLabel: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18 },
  ratingHint: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 18, textAlign: 'right' },
  stars: { width: '100%', height: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  starButton: { flex: 1, maxWidth: 42, aspectRatio: 1, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.starGold, backgroundColor: COLORS.starSurface, alignItems: 'center', justifyContent: 'center' },
  commentField: { width: '100%', minHeight: 104, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfacePale, gap: 6 },
  commentInput: { flex: 1, minHeight: 52, padding: 0, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  error: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  photosSection: { width: '100%', minHeight: 118, gap: 8 },
  photoButton: { width: 88, height: 88, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderSage, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  photoPreviewButton: { backgroundColor: COLORS.bgCard },
  photoPreview: { width: '100%', height: '100%' },
  photoText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  modalFootnote: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  submitButton: { height: 48, borderRadius: RADII.promo, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
});
