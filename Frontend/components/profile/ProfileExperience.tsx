import React, { useLayoutEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CalendarDays, ChevronDown, ChevronRight, CircleHelp, Globe2, Heart, LogOut, Settings, Star, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';

type Dialog = 'edit' | 'settings' | 'password' | 'report' | 'category' | 'language' | null;
const CATEGORIES = ['Booking', 'Payment', 'Account', 'Rewards', 'Other'];
const PROFILE_ASSETS = {
  back: require('../../assets/figma/se121-parity/profile/profile-back.svg'),
  avatar: require('../../assets/figma/se121-parity/profile/alex-johnson.jpeg'),
  rewardStar: require('../../assets/figma/se121-parity/profile/reward-star.svg'),
  walletArrow: require('../../assets/figma/se121-parity/profile/wallet-arrow.svg'),
  bookings: require('../../assets/figma/se121-parity/profile/menu-bookings.svg'),
  chevron: require('../../assets/figma/se121-parity/profile/menu-chevron.svg'),
  wishlist: require('../../assets/figma/se121-parity/profile/menu-wishlist.svg'),
  wallet: require('../../assets/figma/se121-parity/profile/menu-wallet.svg'),
  language: require('../../assets/figma/se121-parity/profile/menu-language.svg'),
  languageChevron: require('../../assets/figma/se121-parity/profile/menu-language-chevron.svg'),
  settings: require('../../assets/figma/se121-parity/profile/menu-settings.svg'),
  report: require('../../assets/figma/se121-parity/profile/menu-report.svg'),
  settingsOn: require('../../assets/figma/se121-parity/profile/settings-on.svg'),
  settingsChevron: require('../../assets/figma/se121-parity/profile/settings-chevron.svg'),
  logout: require('../../assets/figma/se121-parity/profile/logout.svg'),
} as const;

function MenuRow({ title, icon: Icon, asset, onPress, value }: { title: string; icon: typeof Heart; asset: number; onPress: () => void; value?: string }) {
  return <Pressable style={styles.menuRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={value ? `${title}, ${value}` : title}><Se121SharedAsset source={asset} width={36} nativeFallback={<View style={styles.menuIcon}><Icon size={22} color={COLORS.primary} /></View>} /><Text style={styles.menuText}>{title}</Text>{value ? <Text style={styles.menuValue}>{value}</Text> : null}<Se121SharedAsset source={value ? PROFILE_ASSETS.languageChevron : PROFILE_ASSETS.chevron} width={7.4} height={12} nativeFallback={<ChevronRight size={20} color={COLORS.inkSubtle} />} /></Pressable>;
}

function ProfileSheet({ visible, onClose, title, children, height, titleGap = 16, category = false }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; height?: number; titleGap?: number; category?: boolean }) {
  const sheetHeight = height ?? 300;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  useLayoutEffect(() => {
    if (!visible) return;
    translateY.setValue(sheetHeight);
    const animation = Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [sheetHeight, translateY, visible]);

  return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}><View style={styles.sheetRoot}><Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close" /><Animated.View style={[styles.sheetCard, category && styles.categorySheetCard, height ? { height } : undefined, { transform: [{ translateY }] }]}><Text style={[styles.sheetTitle, { marginBottom: titleGap }]}>{title}</Text>{children}</Animated.View></View></Modal>;
}

export function ProfileExperience() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('Alex Johnson');
  const [email, setEmail] = useState('alex.johnson@example.com');
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
    if (!draftName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim())) { setError('Enter a valid name and email address.'); return; }
    setName(draftName.trim()); setEmail(draftEmail.trim()); setNotice('Your profile was updated for this demo session.'); setDialog(null);
  };
  const previewPassword = () => {
    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) { setError('Enter your current password and a matching new password of at least 8 characters.'); return; }
    setNotice('Your password is unchanged in this demo.'); closeDialog();
  };
  const submitReport = () => {
    if (!category || !description.trim()) { setError('Choose a category and describe the issue.'); return; }
    setNotice('Your report was recorded for this demo session.'); setDialog(null); setCategory(''); setDescription('');
  };

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.replace('/')} accessibilityLabel="Back to home"><Se121SharedAsset source={PROFILE_ASSETS.back} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.primary} />} /></Pressable><Text style={styles.brand}>StayFinder</Text><View style={styles.back} /></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}><View style={styles.avatarShadow}><Image source={PROFILE_ASSETS.avatar} style={styles.avatar} /></View><View style={styles.profileInfo}><Text style={styles.name} numberOfLines={1}>{name}</Text><Text style={styles.email} numberOfLines={1}>{email}</Text><Pressable style={styles.editButton} onPress={openEdit} accessibilityRole="button" accessibilityLabel="Edit profile"><Text style={styles.editText}>Edit Profile</Text></Pressable></View></View>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Pressable style={styles.rewardCard} onPress={() => router.push('/rewards')} accessibilityLabel="View rewards wallet"><View pointerEvents="none" style={styles.rewardGlow} /><View style={styles.rewardTop}><Text style={styles.rewardLabel}>StayFinder Rewards</Text><Se121SharedAsset source={PROFILE_ASSETS.rewardStar} width={20} nativeFallback={<Star size={20} color={COLORS.primaryLight} />} /></View><View style={styles.pointsLine}><Text style={styles.points}>24,500</Text><Text style={styles.pointsUnit}>pts</Text></View><View style={styles.walletButton}><Text style={styles.walletText}>View Wallet</Text><Se121SharedAsset source={PROFILE_ASSETS.walletArrow} width={9.33333} nativeFallback={<ChevronRight size={9.33333} color={COLORS.primaryActive} />} /></View></Pressable>
      <View style={styles.menuCard}>
        <MenuRow title="My Bookings" icon={CalendarDays} asset={PROFILE_ASSETS.bookings} onPress={() => router.push('/(tabs)/bookings')} />
        <MenuRow title="Wishlist" icon={Heart} asset={PROFILE_ASSETS.wishlist} onPress={() => router.push('/(tabs)/wishlist')} />
        <MenuRow title="Rewards Wallet" icon={Wallet} asset={PROFILE_ASSETS.wallet} onPress={() => router.push('/rewards')} />
        <MenuRow title="Language" icon={Globe2} asset={PROFILE_ASSETS.language} value="English (US)" onPress={() => setDialog('language')} />
        <MenuRow title="Settings" icon={Settings} asset={PROFILE_ASSETS.settings} onPress={() => { setDraftNotifications(notifications); setDialog('settings'); }} />
        <MenuRow title="Report an Issue" icon={CircleHelp} asset={PROFILE_ASSETS.report} onPress={() => { setError(''); setDialog('report'); }} />
      </View>
      <Pressable style={styles.signedOutButton} onPress={() => router.push('/auth/demo?mode=signed-out' as never)} accessibilityLabel="Log out"><Se121SharedAsset source={PROFILE_ASSETS.logout} width={18} nativeFallback={<LogOut size={18} color={COLORS.validation} />} /><Text style={styles.signedOutText}>Log Out</Text></Pressable>
    </ScrollView>

    <ProfileSheet visible={dialog === 'settings'} onClose={closeDialog} title="Settings" height={348}>
      <View style={styles.settingRow}><Text style={styles.notificationLabel}>Booking notifications</Text>{Platform.OS === 'web' && draftNotifications ? <Pressable onPress={() => setDraftNotifications(false)} accessibilityRole="switch" accessibilityLabel="Toggle booking notifications" accessibilityState={{ checked: true }} aria-checked={true} style={styles.notificationToggle}><Se121SharedAsset source={PROFILE_ASSETS.settingsOn} width={50} height={28} nativeFallback={<Switch value={draftNotifications} onValueChange={setDraftNotifications} trackColor={{ false: COLORS.borderSage, true: COLORS.actionTeal }} thumbColor={COLORS.bgWhite} />} /></Pressable> : <Switch value={draftNotifications} onValueChange={setDraftNotifications} accessibilityLabel="Toggle booking notifications" trackColor={{ false: COLORS.borderSage, true: COLORS.actionTeal }} thumbColor={COLORS.bgWhite} />}</View>
      <Pressable style={[styles.settingRow, styles.changePasswordRow]} onPress={openPassword} accessibilityRole="button" accessibilityLabel="Change password"><View><Text style={styles.settingText}>Change Password</Text><Text style={styles.settingHint}>Update your account password</Text></View><Se121SharedAsset source={PROFILE_ASSETS.settingsChevron} width={18} nativeFallback={<ChevronRight size={18} color={COLORS.inkSubtle} />} /></Pressable>
      <Pressable style={styles.sheetPrimaryButton} onPress={() => { setNotifications(draftNotifications); setNotice('Settings were saved for this demo session.'); closeDialog(); }}><Text style={styles.settingsSubmitText}>Save settings</Text></Pressable>
      <Pressable style={styles.settingsCancelButton} onPress={closeDialog}><Text style={styles.settingsCancelText}>Cancel</Text></Pressable>
    </ProfileSheet>
    <ProfileSheet visible={dialog === 'category'} onClose={() => setDialog('report')} title="Choose category" height={388} titleGap={12} category>
      {CATEGORIES.map((item) => <Pressable key={item} style={styles.categoryRow} onPress={() => { setCategory(item); setDialog('report'); }}><Text style={styles.settingText}>{item}</Text></Pressable>)}
    </ProfileSheet>
    <ProfileSheet visible={dialog === 'language'} onClose={closeDialog} title="Language">
      <Text style={styles.languageNote}>English (US) is selected for this demo. Account language is unchanged.</Text><Button title="Got it" size="lg" fullWidth onPress={closeDialog} />
    </ProfileSheet>

    <Modal key={dialog} visible={dialog === 'edit' || dialog === 'password' || dialog === 'report'} transparent animationType="fade" onRequestClose={closeDialog}><KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.modalCenter} keyboardShouldPersistTaps="handled"><View style={[styles.modalCard, dialog === 'edit' && styles.editModalCard]}>
      {dialog === 'edit' && <><Text style={styles.modalTitle}>Edit Profile</Text><Text style={styles.modalHint}>Update your contact details for this demo session.</Text><View style={[styles.formTile, styles.editFormTile]}><Text style={[styles.formLabel, styles.editFormLabel]}>Full name</Text><TextInput accessibilityLabel="Full name" value={draftName} onChangeText={setDraftName} style={[styles.formInput, styles.editFormInput]} /></View><View style={[styles.formTile, styles.editFormTile]}><Text style={[styles.formLabel, styles.editFormLabel]}>Email</Text><TextInput accessibilityLabel="Email" value={draftEmail} onChangeText={setDraftEmail} keyboardType="email-address" autoCapitalize="none" style={[styles.formInput, styles.editFormInput]} /></View>{!!error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.submitButton} onPress={saveProfile}><Text style={[styles.submitText, styles.editSubmitText]}>Save demo changes</Text></Pressable></>}
      {dialog === 'password' && <><Text style={styles.modalTitle}>Change Password</Text><Text style={styles.modalHint}>This demo form does not change your real password.</Text>{([{ label: 'Current password', value: currentPassword, setter: setCurrentPassword }, { label: 'New password', value: newPassword, setter: setNewPassword }, { label: 'Confirm password', value: confirmPassword, setter: setConfirmPassword }] as const).map((field) => <View key={field.label} style={styles.formTile}><Text style={styles.formLabel}>{field.label}</Text><TextInput accessibilityLabel={field.label} value={field.value} onChangeText={field.setter} secureTextEntry style={styles.formInput} /></View>)}{!!error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.submitButton} onPress={previewPassword}><Text style={styles.submitText}>Confirm demo change</Text></Pressable></>}
      {dialog === 'report' && <><Text style={styles.modalTitle}>Report an Issue</Text><Text style={styles.modalHint}>Describe the issue to preview the support form.</Text><Pressable style={styles.formTile} onPress={() => setDialog('category')} accessibilityRole="button" accessibilityLabel="Choose report category"><Text style={styles.formLabel}>Category</Text><View style={styles.categoryValue}><Text style={styles.formValue}>{category || 'Choose category'}</Text><ChevronDown size={20} color={COLORS.inkSoft} /></View></Pressable><View style={styles.formTile}><Text style={styles.formLabel}>Description</Text><TextInput accessibilityLabel="Description" value={description} onChangeText={setDescription} multiline placeholder="Describe the issue..." placeholderTextColor={COLORS.inkSubtle} style={[styles.formInput, styles.descriptionInput]} /></View>{!!error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.submitButton} onPress={submitReport}><Text style={styles.submitText}>Submit demo report</Text></Pressable></>}
      <Pressable style={[styles.cancelButton, dialog === 'edit' && styles.editCancelButton]} onPress={closeDialog}><Text style={[styles.cancelText, dialog === 'edit' && styles.editCancelText]}>Cancel</Text></Pressable>
    </View></ScrollView></KeyboardAvoidingView></Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  brand: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 24, paddingBottom: 100 },
  profileCard: { minHeight: 120, padding: 15, borderRadius: RADII.promo, borderWidth: 1, borderColor: '#E0ECE7', backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', gap: 14, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 6px 9px rgba(5,36,31,0.07)' }, default: SHADOWS.cardSoft }) },
  avatarShadow: { width: 72, height: 72, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, ...Platform.select({ web: { boxShadow: '0px 3px 8px rgba(0,0,0,0.07)' }, default: { shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 } }) },
  avatar: { width: 72, height: 72, borderRadius: RADII.full, borderWidth: 2, borderColor: '#D6E5E0' },
  profileInfo: { flex: 1, minWidth: 0, height: 88, alignItems: 'flex-start', gap: 4 },
  name: { color: '#141F1C', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 24 },
  email: { height: 22, color: '#667873', fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 18 },
  editButton: { height: 34, marginTop: 0, paddingHorizontal: 14, borderRadius: RADII.full, borderWidth: 1, borderColor: '#CCE3DB', backgroundColor: '#EDF7F4', alignItems: 'center', justifyContent: 'center' },
  editText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13, lineHeight: 20 },
  notice: { marginTop: 12, color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18 },
  rewardCard: { height: 144, marginTop: 20, padding: 16, borderRadius: RADII.promo, overflow: 'hidden', backgroundColor: '#066E62', ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 8px 22px rgba(3,41,33,0.13)' }, default: SHADOWS.cardSoft }) },
  rewardGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: RADII.full, backgroundColor: COLORS.primaryHover, opacity: 0.72, ...(Platform.OS === 'web' ? { filter: 'blur(20px)' } as ViewStyle : {}) },
  rewardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardLabel: { color: COLORS.primarySoft, opacity: 0.9, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  pointsLine: { height: 48, flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  points: { color: '#C7FFF5', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  pointsUnit: { color: '#C7FFF5', opacity: 0.8, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  walletButton: { height: 36, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 16, borderRadius: RADII.full, backgroundColor: '#D1FFF5', flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  menuCard: { marginTop: 20, paddingHorizontal: 15, paddingVertical: 7, borderRadius: RADII.promo, borderWidth: 1, borderColor: '#E0ECE7', backgroundColor: COLORS.bgWhite, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 6px 18px rgba(5,36,31,0.07)' }, default: SHADOWS.cardSoft }) },
  menuRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 24 },
  menuValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  signedOutButton: { height: SIZES.button, marginTop: 20, borderRadius: 20, borderWidth: 1, borderColor: '#F2C7BD', backgroundColor: '#FFF5F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signedOutText: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  settingRow: { minHeight: 64, marginBottom: 16, paddingHorizontal: 16, borderRadius: SPACING.md, backgroundColor: COLORS.surfaceSage, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notificationLabel: { flexShrink: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  notificationToggle: { minWidth: 50, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  changePasswordRow: { minHeight: 56, borderWidth: 1, borderColor: '#DBE8E3', borderRadius: 14, backgroundColor: '#F4FAF8' },
  settingText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  settingHint: { color: '#6E807A', fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 14 },
  sheetPrimaryButton: { height: 44, borderRadius: 12, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  settingsSubmitText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  settingsCancelButton: { height: 44, marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  settingsCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  categoryRow: { minHeight: 48, paddingHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#DBE8E3', backgroundColor: COLORS.surfacePale, justifyContent: 'center' },
  languageNote: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, marginBottom: 20 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.16)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(5px)' } : {}) },
  sheetCard: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, borderTopLeftRadius: RADII.promo, borderTopRightRadius: RADII.promo, backgroundColor: COLORS.bgWhite, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px -7px 26px rgba(5,41,33,0.08)' }, default: { shadowColor: '#052921', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 13, elevation: 14 } }) },
  categorySheetCard: { ...Platform.select<ViewStyle>({ web: { boxShadow: '0px -7px 26px rgba(5,31,26,0.10)' }, default: { shadowColor: '#051F1A', shadowOpacity: 0.10 } }) },
  sheetTitle: { marginBottom: 16, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(4px)' } as ViewStyle : {}) },
  modalCenter: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  modalCard: { padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 10px 28px rgba(5,31,26,0.12)' }, default: { shadowColor: '#051F1A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 12 } }) },
  editModalCard: { minHeight: 398 },
  modalTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  modalHint: { marginTop: 14, marginBottom: 14, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  formTile: { minHeight: 64, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, justifyContent: 'center' },
  formLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  formInput: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13, padding: 0, minHeight: 28 },
  editFormTile: { borderColor: '#DBE8E3', backgroundColor: '#F4FAF8', gap: 2 },
  editFormLabel: { fontSize: 12, lineHeight: 16 },
  editFormInput: { fontSize: 14, lineHeight: 22, height: 22, minHeight: 22, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) },
  editSubmitText: { lineHeight: 20 },
  editCancelButton: { marginTop: 14 },
  editCancelText: { lineHeight: 20 },
  formValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  categoryValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  descriptionInput: { minHeight: 90, textAlignVertical: 'top', paddingTop: 8 },
  error: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, marginBottom: 12 },
  submitButton: { height: 48, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  cancelButton: { height: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
});
