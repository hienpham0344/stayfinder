import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CalendarDays, ChevronDown, ChevronRight, CircleHelp, Globe2, Heart, LayoutGrid, LogOut, Settings, Star, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { BottomSheetWrapper } from '../ui/BottomSheetWrapper';
import { Button } from '../ui/Button';
import { MOCK_USER_TIER } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';

type Dialog = 'edit' | 'settings' | 'password' | 'report' | 'category' | 'language' | null;
const CATEGORIES = ['Đặt phòng', 'Thanh toán', 'Tài khoản', 'Điểm thưởng', 'Khác'];
const AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

function MenuRow({ title, icon: Icon, onPress, value }: { title: string; icon: typeof Heart; onPress: () => void; value?: string }) {
  return <Pressable style={styles.menuRow} onPress={onPress} accessibilityRole="button"><View style={styles.menuIcon}><Icon size={22} color={COLORS.primary} /></View><Text style={styles.menuText}>{title}</Text>{value && <Text style={styles.menuValue}>{value}</Text>}<ChevronRight size={20} color={COLORS.inkSubtle} /></Pressable>;
}

export function ProfileExperience() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('Phạm Văn Hiển');
  const [email, setEmail] = useState('hienpham@stayfinder.vn');
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [notifications, setNotifications] = useState(true);
  const [draftNotifications, setDraftNotifications] = useState(true);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const closeDialog = () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(''); setDialog(null); };
  const openEdit = () => { setDraftName(name); setDraftEmail(email); setError(''); setDialog('edit'); };
  const openPassword = () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(''); setDialog('password'); };
  const saveProfile = () => {
    if (!draftName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim())) { setError('Vui lòng nhập tên và email hợp lệ.'); return; }
    setName(draftName.trim()); setEmail(draftEmail.trim()); setNotice('Hồ sơ đã đổi trong phiên demo, chưa lưu vào tài khoản.'); setDialog(null);
  };
  const previewPassword = () => {
    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) { setError('Nhập mật khẩu hiện tại và mật khẩu mới ít nhất 8 ký tự, xác nhận trùng khớp.'); return; }
    setNotice('Mật khẩu thật không thay đổi trong bản demo.'); closeDialog();
  };
  const submitReport = () => {
    if (!category || !description.trim()) { setError('Vui lòng chọn danh mục và nhập mô tả.'); return; }
    setNotice('Báo cáo chỉ được ghi nhận trên màn hình demo, chưa gửi đi.'); setDialog(null); setCategory(''); setDescription('');
  };

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.replace('/')} accessibilityLabel="Về trang chủ"><ArrowLeft size={SIZES.icon} color={COLORS.primary} /></Pressable><Text style={styles.brand}>StayFinder</Text><View style={styles.back} /></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}><Image source={{ uri: AVATAR }} style={styles.avatar} /><View style={styles.profileInfo}><Text style={styles.name} numberOfLines={1}>{name}</Text><Text style={styles.email} numberOfLines={1}>{email}</Text><Pressable style={styles.editButton} onPress={openEdit}><Text style={styles.editText}>Sửa hồ sơ</Text></Pressable></View></View>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Pressable style={styles.rewardCard} onPress={() => router.push('/rewards')} accessibilityLabel="Xem ví điểm thưởng"><Svg style={StyleSheet.absoluteFill} width="100%" height="100%"><Defs><LinearGradient id="rewardGradient" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={COLORS.primary} /><Stop offset="1" stopColor={COLORS.actionTeal} /></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#rewardGradient)" /></Svg><View style={styles.rewardTop}><Text style={styles.rewardLabel}>Điểm thưởng StayFinder</Text><Star size={22} color={COLORS.primaryLight} /></View><View style={styles.pointsLine}><Text style={styles.points}>{new Intl.NumberFormat('vi-VN').format(MOCK_USER_TIER.currentPoints)}</Text><Text style={styles.pointsUnit}>điểm</Text></View><View style={styles.walletButton}><Text style={styles.walletText}>Xem ví điểm</Text><ChevronRight size={18} color={COLORS.primary} /></View></Pressable>
      <View style={styles.menuCard}>
        <MenuRow title="Đặt phòng của tôi" icon={CalendarDays} onPress={() => router.push('/(tabs)/bookings')} />
        <MenuRow title="Yêu thích" icon={Heart} onPress={() => router.push('/(tabs)/wishlist')} />
        <MenuRow title="Ví điểm thưởng" icon={Wallet} onPress={() => router.push('/rewards')} />
        <MenuRow title="Ngôn ngữ" icon={Globe2} value="Tiếng Việt" onPress={() => setDialog('language')} />
        <MenuRow title="Cài đặt" icon={Settings} onPress={() => { setDraftNotifications(notifications); setDialog('settings'); }} />
        <MenuRow title="Báo cáo sự cố" icon={CircleHelp} onPress={() => { setError(''); setDialog('report'); }} />
        <MenuRow title="Thư viện giao diện USER" icon={LayoutGrid} onPress={() => router.push('/ui-gallery')} />
        <MenuRow title="Xem đăng xuất demo" icon={LogOut} onPress={() => router.push('/auth/demo?mode=signed-out' as never)} />
      </View>
      <Text style={styles.demoFooter}>Các thay đổi tài khoản ở đây chỉ là bản demo.</Text>
    </ScrollView>

    <BottomSheetWrapper visible={dialog === 'settings'} onClose={closeDialog} title="Cài đặt">
      <View style={styles.settingRow}><Text style={styles.settingText}>Thông báo đặt phòng</Text><Switch value={draftNotifications} onValueChange={setDraftNotifications} trackColor={{ false: COLORS.borderSage, true: COLORS.actionTeal }} thumbColor={COLORS.bgWhite} /></View>
      <Pressable style={styles.settingRow} onPress={openPassword}><View><Text style={styles.settingText}>Đổi mật khẩu</Text><Text style={styles.settingHint}>Chỉ xem thử giao diện</Text></View><ChevronRight size={20} color={COLORS.inkSubtle} /></Pressable>
      <Button title="Lưu cài đặt demo" size="lg" fullWidth onPress={() => { setNotifications(draftNotifications); setNotice('Cài đặt chỉ áp dụng trong phiên demo.'); closeDialog(); }} style={styles.sheetAction} />
      <Pressable style={styles.cancelButton} onPress={closeDialog}><Text style={styles.cancelText}>Hủy</Text></Pressable>
    </BottomSheetWrapper>
    <BottomSheetWrapper visible={dialog === 'category'} onClose={() => setDialog('report')} title="Chọn danh mục">
      {CATEGORIES.map((item) => <Pressable key={item} style={styles.categoryRow} onPress={() => { setCategory(item); setDialog('report'); }}><Text style={styles.settingText}>{item}</Text></Pressable>)}
    </BottomSheetWrapper>
    <BottomSheetWrapper visible={dialog === 'language'} onClose={closeDialog} title="Ngôn ngữ">
      <Text style={styles.languageNote}>Bản demo hiện hỗ trợ giao diện tiếng Việt. Ngôn ngữ tài khoản không thay đổi.</Text><Button title="Đã hiểu" size="lg" fullWidth onPress={closeDialog} />
    </BottomSheetWrapper>

    <Modal visible={dialog === 'edit' || dialog === 'password' || dialog === 'report'} transparent animationType="fade" onRequestClose={closeDialog}><KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.modalCenter} keyboardShouldPersistTaps="handled"><View style={styles.modalCard}>
      {dialog === 'edit' && <><Text style={styles.modalTitle}>Sửa hồ sơ</Text><Text style={styles.modalHint}>Cập nhật thông tin liên hệ trong phiên demo.</Text><View style={styles.formTile}><Text style={styles.formLabel}>Họ và tên</Text><TextInput value={draftName} onChangeText={setDraftName} style={styles.formInput} /></View><View style={styles.formTile}><Text style={styles.formLabel}>Email</Text><TextInput value={draftEmail} onChangeText={setDraftEmail} keyboardType="email-address" autoCapitalize="none" style={styles.formInput} /></View>{!!error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.submitButton} onPress={saveProfile}><Text style={styles.submitText}>Lưu thay đổi demo</Text></Pressable></>}
      {dialog === 'password' && <><Text style={styles.modalTitle}>Đổi mật khẩu</Text><Text style={styles.modalHint}>Biểu mẫu demo không thay đổi mật khẩu thật.</Text>{([{ label: 'Mật khẩu hiện tại', value: currentPassword, setter: setCurrentPassword }, { label: 'Mật khẩu mới', value: newPassword, setter: setNewPassword }, { label: 'Xác nhận mật khẩu', value: confirmPassword, setter: setConfirmPassword }] as const).map((field) => <View key={field.label} style={styles.formTile}><Text style={styles.formLabel}>{field.label}</Text><TextInput value={field.value} onChangeText={field.setter} secureTextEntry style={styles.formInput} /></View>)}{!!error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.submitButton} onPress={previewPassword}><Text style={styles.submitText}>Xác nhận bản demo</Text></Pressable></>}
      {dialog === 'report' && <><Text style={styles.modalTitle}>Báo cáo sự cố</Text><Text style={styles.modalHint}>Mô tả vấn đề để xem thử biểu mẫu hỗ trợ.</Text><Pressable style={styles.formTile} onPress={() => setDialog('category')}><Text style={styles.formLabel}>Danh mục</Text><View style={styles.categoryValue}><Text style={styles.formValue}>{category || 'Chọn danh mục'}</Text><ChevronDown size={20} color={COLORS.inkSoft} /></View></Pressable><View style={styles.formTile}><Text style={styles.formLabel}>Mô tả</Text><TextInput value={description} onChangeText={setDescription} multiline placeholder="Mô tả sự cố..." placeholderTextColor={COLORS.inkSubtle} style={[styles.formInput, styles.descriptionInput]} /></View>{!!error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.submitButton} onPress={submitReport}><Text style={styles.submitText}>Gửi báo cáo demo</Text></Pressable></>}
      <Pressable style={styles.cancelButton} onPress={closeDialog}><Text style={styles.cancelText}>Hủy</Text></Pressable>
    </View></ScrollView></KeyboardAvoidingView></Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.sm },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  brand: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 23 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 24, paddingBottom: 100 },
  profileCard: { minHeight: 120, padding: 16, borderRadius: RADII.promo, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', gap: 16, ...SHADOWS.cardSoft },
  avatar: { width: 68, height: 68, borderRadius: RADII.full },
  profileInfo: { flex: 1, alignItems: 'flex-start', gap: 4 },
  name: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  email: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  editButton: { minHeight: 36, marginTop: 4, paddingHorizontal: 22, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, alignItems: 'center', justifyContent: 'center' },
  editText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 12 },
  notice: { marginTop: 12, color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18 },
  rewardCard: { height: 144, marginTop: 20, padding: 16, borderRadius: RADII.promo, overflow: 'hidden', backgroundColor: COLORS.primary, ...SHADOWS.cardSoft },
  rewardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardLabel: { color: COLORS.primaryLight, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  pointsLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  points: { color: COLORS.primaryLight, fontFamily: TYPOGRAPHY.families.bold, fontSize: 30 },
  pointsUnit: { color: COLORS.primaryLight, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13 },
  walletButton: { height: 36, alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 16, borderRadius: RADII.full, backgroundColor: COLORS.primaryLight, flexDirection: 'row', alignItems: 'center', gap: 4 },
  walletText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 12 },
  menuCard: { marginTop: 20, paddingHorizontal: 16, borderRadius: RADII.promo, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  menuRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  menuValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  demoFooter: { marginTop: 20, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, textAlign: 'center' },
  settingRow: { minHeight: 64, marginBottom: 12, paddingHorizontal: 16, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceMint, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
  settingHint: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  sheetAction: { marginTop: 4 },
  categoryRow: { minHeight: 48, paddingHorizontal: 16, marginBottom: 10, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, justifyContent: 'center' },
  languageNote: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, marginBottom: 20 },
  modalBackdrop: { flex: 1, backgroundColor: COLORS.overlayBlack },
  modalCenter: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  modalCard: { padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  modalTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, textAlign: 'center' },
  modalHint: { marginTop: 16, marginBottom: 18, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  formTile: { minHeight: 64, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, justifyContent: 'center' },
  formLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  formInput: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13, padding: 0, minHeight: 28 },
  formValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  categoryValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  descriptionInput: { minHeight: 90, textAlignVertical: 'top', paddingTop: 8 },
  error: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, marginBottom: 12 },
  submitButton: { minHeight: SIZES.button, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  cancelButton: { minHeight: SIZES.button, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
});
