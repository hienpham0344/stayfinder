import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, ImageOff, Mail, Phone, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepIndicator } from '../ui/StepIndicator';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { validateGuest } from '../../utils/guestValidation';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

function GuestField({ label, error, helper, icon, emailField = false, ...props }: TextInputProps & { label: string; error?: string; helper?: string; icon: React.ReactNode; emailField?: boolean }) {
  return <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldBox, emailField && styles.emailFieldBox, !!error && styles.fieldError]}>
      <View style={styles.fieldIcon}>{icon}</View>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor="rgba(62,73,70,0.5)" style={styles.fieldInput} />
    </View>
    <Text style={[styles.fieldHelper, !!error && styles.fieldErrorText]}>{error || helper || '\u200b'}</Text>
  </View>;
}

export function GuestInformationExperience() {
  const { id, tierId } = useLocalSearchParams<{ id: string; tierId?: string }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const tier = stay.roomTiers?.find((item) => item.id === tierId);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [request, setRequest] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [imageStatus, setImageStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const errors = validateGuest(name, email, phone);
  const valid = !errors.name && !errors.email && !errors.phone;
  const continueToPayment = () => {
    if (!valid) { setAttempted(true); return; }
    router.push(`/booking/checkout?id=${stay.id}&tierId=${tierId || ''}` as never);
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Quay lại"><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/guest-back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.primary} />} /></Pressable><Text style={styles.headerTitle}>StayFinder</Text><View style={styles.back} /></View>
    </View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.stepper}><StepIndicator currentStep={2} /></View>
      <Text style={styles.stepLabel}>BƯỚC 2 / 4 · THÔNG TIN KHÁCH</Text>
      <View style={styles.summary}><View style={styles.summaryImageWrap}>{imageStatus !== 'error' && <Image source={{ uri: stay.images[0] }} style={styles.summaryImage} onLoad={() => setImageStatus('ready')} onError={() => setImageStatus('error')} />}{imageStatus !== 'ready' && <View style={styles.summaryImagePlaceholder}>{imageStatus === 'error' ? <ImageOff size={20} color={COLORS.textMuted} /> : <ActivityIndicator color={COLORS.primary} />}</View>}</View><View style={styles.summaryContent}><Text style={styles.stayTitle} numberOfLines={1}>{stay.title}</Text><View style={styles.summaryDate}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/guest-bed.svg')} width={12.6666} height={8.33326} nativeFallback={<BedDouble size={13} color={COLORS.inkSoft} />} /><Text style={styles.summaryLine} numberOfLines={1}>{tier?.name || 'Chỗ ở đã chọn'}</Text></View><View style={styles.summaryDate}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/guest-calendar.svg')} width={11.3333} height={12.7435} nativeFallback={<CalendarDays size={13} color={COLORS.inkSoft} />} /><Text style={styles.summaryLine}>15–18/10/2026 · 3 đêm</Text></View></View></View>
      <Text style={styles.heading}>Ai sẽ nhận phòng?</Text>
      <GuestField label="Họ và tên" value={name} onChangeText={setName} placeholder="Họ và tên" autoComplete="name" icon={<Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/guest-name.svg')} width={12.4999} height={12.1794} nativeFallback={<User size={13} color={COLORS.borderSage} />} />} error={attempted ? errors.name : undefined} />
      <GuestField label="Địa chỉ email" emailField value={email} onChangeText={setEmail} placeholder="Địa chỉ email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" icon={<Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/guest-mail.svg')} width={15.8333} height={12.4999} nativeFallback={<Mail size={16} color={COLORS.borderSage} />} />} error={attempted ? errors.email : undefined} helper="Email xác nhận chỉ được mô phỏng trong bản demo." />
      <GuestField label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="Số điện thoại" keyboardType="phone-pad" autoComplete="tel" icon={<Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/guest-phone.svg')} width={14.1666} height={14.1666} nativeFallback={<Phone size={14} color={COLORS.borderSage} />} />} error={attempted ? errors.phone : undefined} />
      <View style={styles.requestHeader}><Text style={styles.fieldLabel}>Yêu cầu đặc biệt</Text><Text style={styles.optional}>Không bắt buộc</Text></View>
      <TextInput value={request} onChangeText={setRequest} multiline placeholder="Bạn có yêu cầu nào cho chỗ ở?" placeholderTextColor={COLORS.inkSubtle} style={styles.requestInput} />
      <Text style={styles.demoNote}>Thông tin khách và yêu cầu đặc biệt không được lưu trong bản demo.</Text>
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: Math.max(12, insets.bottom) }]}><Pressable onPress={continueToPayment} disabled={attempted && !valid} style={[styles.continueButton, attempted && !valid && styles.disabledButton]} accessibilityState={{ disabled: attempted && !valid }} aria-disabled={attempted && !valid}><Text style={[styles.continueText, attempted && !valid && styles.disabledText]}>Tiếp tục đến thanh toán</Text><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/guest-continue.svg')} width={12.4999} nativeFallback={<ArrowRight size={12.4999} color={attempted && !valid ? COLORS.inkSubtle : COLORS.bgWhite} />} /></Pressable></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 6 },
  stepper: { marginHorizontal: -SPACING.xl, marginBottom: 22 },
  stepLabel: { color: '#3E4946', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  summary: { minHeight: 112, marginTop: 32, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.bgWhite, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.04)' }, default: SHADOWS.cardSubtle }) },
  summaryImageWrap: { width: 80, height: 80, borderRadius: RADII.xl, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  summaryImage: { width: '100%', height: '100%' },
  summaryImagePlaceholder: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  summaryContent: { flex: 1, gap: 5 },
  stayTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  summaryLine: { flexShrink: 1, color: '#3E4946', fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  summaryDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heading: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24, marginTop: 32, marginBottom: 24 },
  field: { marginBottom: 16, gap: 4 },
  fieldBox: { height: 49, borderWidth: 1, borderColor: COLORS.borderSage, backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', paddingLeft: 11, paddingRight: 16 },
  emailFieldBox: { borderColor: '#E0E8F0' },
  fieldIcon: { width: 29, alignItems: 'flex-start', justifyContent: 'center' },
  fieldInput: { flex: 1, minWidth: 0, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 20, padding: 0 },
  fieldHelper: { minHeight: 20, paddingTop: 4, color: '#3E4946', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  fieldError: { borderColor: COLORS.validation },
  fieldErrorText: { color: COLORS.validation },
  requestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 4 },
  fieldLabel: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  optional: { color: '#3E4946', fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 16 },
  requestInput: { minHeight: 106, paddingHorizontal: 17, paddingTop: 17, paddingBottom: 17, borderWidth: 1, borderColor: COLORS.borderSage, backgroundColor: COLORS.bgWhite, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  demoNote: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 17, marginTop: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 93, paddingHorizontal: SPACING.xl, paddingTop: 21, backgroundColor: COLORS.bgWhite, borderTopWidth: 1, borderTopColor: COLORS.borderMuted, ...SHADOWS.stickyFooter },
  continueButton: { height: SIZES.button, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabledButton: { backgroundColor: COLORS.borderLight },
  continueText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  disabledText: { color: COLORS.inkSubtle },
});
