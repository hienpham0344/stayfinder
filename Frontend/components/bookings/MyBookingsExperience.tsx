import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Heart, ImagePlus, MapPin, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { cancelDemoBooking, DemoBookingStates, reviewDemoBooking } from '../../utils/demoBookings';

type Tab = 'upcoming' | 'completed' | 'cancelled';
type Booking = { id: string; stay: typeof MOCK_STAYS[number]; checkIn: string; checkOut: string; guests: number; total: number };
const BOOKINGS: Booking[] = [
  { id: 'b-101', stay: MOCK_STAYS[0], checkIn: '15/10/2026', checkOut: '18/10/2026', guests: 2, total: 4050000 },
  { id: 'b-100', stay: MOCK_STAYS[1], checkIn: '01/08/2026', checkOut: '04/08/2026', guests: 2, total: 8900000 },
];
const INITIAL_STATES: DemoBookingStates = { 'b-101': { status: 'upcoming' }, 'b-100': { status: 'completed' } };
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

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.iconButton} onPress={() => router.replace('/')} accessibilityLabel="Về trang chủ"><ArrowLeft size={SIZES.icon} color={COLORS.inkSoft} /></Pressable><Text style={styles.brand}>StayFinder</Text><Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/wishlist')} accessibilityLabel="Mở yêu thích"><Heart size={SIZES.icon} color={COLORS.inkSoft} /></Pressable></View>
    <Text style={styles.title}>Đặt phòng của tôi</Text>
    <View style={styles.tabs}>{TABS.map((item) => <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.tab, tab === item.key && styles.activeTab]} accessibilityState={{ selected: tab === item.key }}><Text style={[styles.tabText, tab === item.key && styles.activeTabText]}>{item.label}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {visibleBookings.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Chưa có đặt phòng {STATUS_LABEL[tab].toLowerCase()}</Text><Text style={styles.emptyText}>Các thay đổi trong danh sách này chỉ là dữ liệu demo theo phiên màn hình.</Text></View> : visibleBookings.map((booking) => {
        const bookingState = states[booking.id];
        return <View key={booking.id} style={styles.card}>
          <Image source={{ uri: booking.stay.images[0] }} style={styles.cardImage} resizeMode="cover" />
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
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.modalCenter} keyboardShouldPersistTaps="handled"><View style={styles.modalCard}>
          {dialog?.type === 'cancel' && <><Text style={styles.modalTitle}>Hủy đặt phòng?</Text><Text style={styles.modalDescription}>Chuyến đi này sẽ chuyển sang tab Đã hủy trong phiên demo.</Text><View style={styles.modalInfo}><Text style={styles.modalInfoLabel}>Chỗ ở</Text><Text style={styles.modalInfoValue}>{dialog.booking.stay.title}</Text></View><View style={styles.modalInfo}><Text style={styles.modalInfoLabel}>Ngày lưu trú</Text><Text style={styles.modalInfoValue}>{dialog.booking.checkIn} – {dialog.booking.checkOut}</Text></View><Text style={styles.modalFootnote}>Không có đặt phòng thật bị hủy.</Text><Pressable style={styles.dangerButton} onPress={confirmCancel}><Text style={styles.dangerText}>Xác nhận hủy</Text></Pressable><Pressable style={styles.cancelButton} onPress={() => setDialog(null)}><Text style={styles.cancelText}>Quay lại</Text></Pressable></>}
          {dialog?.type === 'review' && <><Text style={styles.modalTitle}>Đánh giá {dialog.booking.stay.title}</Text><Text style={styles.modalDescription}>Chia sẻ cảm nhận về chuyến đi mẫu.</Text><View style={styles.ratingHeader}><Text style={styles.modalInfoLabel}>Đánh giá</Text><Text style={styles.modalInfoLabel}>Chạm để chọn sao</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating(value)} style={styles.starButton} accessibilityLabel={`${value} sao`}><Star size={22} color={COLORS.starGold} fill={value <= rating ? COLORS.starGold : 'none'} /></Pressable>)}</ScrollView>{reviewAttempted && rating === 0 && <Text style={styles.error}>Vui lòng chọn số sao.</Text>}<Text style={styles.modalInfoLabel}>Bình luận</Text><TextInput value={comment} onChangeText={setComment} multiline placeholder="Trải nghiệm của bạn..." placeholderTextColor={COLORS.inkSubtle} style={styles.commentInput} />{reviewAttempted && !comment.trim() && <Text style={styles.error}>Vui lòng nhập bình luận.</Text>}<Text style={styles.modalInfoLabel}>Ảnh minh họa</Text><Pressable style={styles.photoButton} onPress={() => setDemoPhoto(!demoPhoto)}>{demoPhoto ? <Image source={{ uri: dialog.booking.stay.images[0] }} style={styles.photoPreview} /> : <ImagePlus size={24} color={COLORS.primary} />}<Text style={styles.photoText}>{demoPhoto ? 'Ảnh mẫu đã thêm' : 'Thêm ảnh mẫu'}</Text></Pressable><Text style={styles.modalFootnote}>Đánh giá và ảnh chỉ hiển thị trong phiên, không được gửi đi.</Text><Pressable style={styles.submitButton} onPress={submitReview}><Text style={styles.submitText}>Gửi đánh giá demo</Text></Pressable><Pressable style={styles.cancelButton} onPress={() => setDialog(null)}><Text style={styles.cancelText}>Hủy</Text></Pressable></>}
        </View></ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWhite },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.sm, backgroundColor: COLORS.bgMain },
  iconButton: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  brand: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 23 },
  title: { marginHorizontal: SPACING.xl, marginTop: 16, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 23 },
  tabs: { minHeight: 64, marginTop: 16, paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tab: { minHeight: 42, paddingHorizontal: 10, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.bgWhite },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  activeTabText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.semibold },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 20, paddingBottom: 100, flexGrow: 1 },
  card: { marginBottom: 16, padding: 16, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSubtle },
  cardImage: { width: '100%', height: 128 },
  cardBody: { paddingTop: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stayTitle: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18, lineHeight: 24 },
  status: { minHeight: 24, paddingHorizontal: 8, backgroundColor: COLORS.primaryLight, justifyContent: 'center' },
  statusText: { color: COLORS.primaryContainer, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11 },
  cancelledStatus: { backgroundColor: COLORS.errorBg },
  cancelledText: { color: COLORS.validation },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13 },
  dates: { flexDirection: 'row', gap: 30, marginTop: 12 },
  dateLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  dateValue: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 16 },
  total: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 14 },
  action: { minHeight: 44, paddingHorizontal: 16, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 12 },
  demoNote: { marginTop: 12, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, textAlign: 'center' },
  empty: { marginTop: 64, padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.surfaceMint, alignItems: 'center', gap: 12 },
  emptyTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18, textAlign: 'center' },
  emptyText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: COLORS.overlayBlack },
  modalCenter: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  modalCard: { padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  modalTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, textAlign: 'center' },
  modalDescription: { marginTop: 16, marginBottom: 18, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 21, textAlign: 'center' },
  modalInfo: { minHeight: 72, marginBottom: 12, padding: 14, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceSage, justifyContent: 'center', gap: 5 },
  modalInfoLabel: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  modalInfoValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
  modalFootnote: { marginTop: 6, marginBottom: 14, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, textAlign: 'center' },
  dangerButton: { minHeight: SIZES.button, borderRadius: RADII.full, backgroundColor: COLORS.validation, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  cancelButton: { minHeight: SIZES.button, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
  ratingHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  stars: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 20 },
  starButton: { width: 48, height: 48, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.starGold, alignItems: 'center', justifyContent: 'center' },
  commentInput: { minHeight: 96, marginTop: 8, marginBottom: 16, padding: 14, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, textAlignVertical: 'top' },
  error: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, marginBottom: 8 },
  photoButton: { width: 112, minHeight: 88, marginTop: 8, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.borderSage, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoPreview: { width: 84, height: 50, borderRadius: RADII.md },
  photoText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11 },
  submitButton: { minHeight: SIZES.button, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
});
