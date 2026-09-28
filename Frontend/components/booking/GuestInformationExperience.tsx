import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Mail, Phone, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../ui/Input';
import { StepIndicator } from '../ui/StepIndicator';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { validateGuest } from '../../utils/guestValidation';

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
  const errors = validateGuest(name, email, phone);
  const valid = !errors.name && !errors.email && !errors.phone;
  const continueToPayment = () => {
    if (!valid) { setAttempted(true); return; }
    router.push(`/booking/checkout?id=${stay.id}&tierId=${tierId || ''}` as never);
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Quay lại"><ArrowLeft size={SIZES.icon} color={COLORS.primary} /></Pressable><Text style={styles.headerTitle}>StayFinder</Text><View style={styles.back} /></View>
      <StepIndicator currentStep={2} />
    </View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepLabel}>BƯỚC 2 / 4 · THÔNG TIN KHÁCH</Text>
      <View style={styles.summary}><Image source={{ uri: stay.images[0] }} style={styles.summaryImage} /><View style={styles.summaryContent}><Text style={styles.stayTitle} numberOfLines={2}>{stay.title}</Text><Text style={styles.summaryLine} numberOfLines={1}>{tier?.name || 'Chỗ ở đã chọn'}</Text><Text style={styles.summaryLine}>15–18/10/2026 · 3 đêm</Text></View></View>
      <Text style={styles.heading}>Ai sẽ nhận phòng?</Text>
      <Input label="Họ và tên" value={name} onChangeText={setName} placeholder="Họ và tên" autoComplete="name" leftIcon={<User size={18} color={COLORS.borderSage} />} error={attempted ? errors.name : undefined} containerStyle={styles.field} />
      <Input label="Địa chỉ email" value={email} onChangeText={setEmail} placeholder="Địa chỉ email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" leftIcon={<Mail size={18} color={COLORS.borderSage} />} error={attempted ? errors.email : undefined} containerStyle={styles.emailField} />
      <Text style={styles.emailHint}>Email xác nhận chỉ được mô phỏng trong bản demo.</Text>
      <Input label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="Số điện thoại" keyboardType="phone-pad" autoComplete="tel" leftIcon={<Phone size={18} color={COLORS.borderSage} />} error={attempted ? errors.phone : undefined} containerStyle={styles.field} />
      <View style={styles.requestHeader}><Text style={styles.fieldLabel}>Yêu cầu đặc biệt</Text><Text style={styles.optional}>Không bắt buộc</Text></View>
      <TextInput value={request} onChangeText={setRequest} multiline placeholder="Bạn có yêu cầu nào cho chỗ ở?" placeholderTextColor={COLORS.inkSubtle} style={styles.requestInput} />
      <Text style={styles.demoNote}>Thông tin khách và yêu cầu đặc biệt không được lưu trong bản demo.</Text>
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: Math.max(12, insets.bottom) }]}><Pressable onPress={continueToPayment} disabled={attempted && !valid} style={[styles.continueButton, attempted && !valid && styles.disabledButton]} accessibilityState={{ disabled: attempted && !valid }}><Text style={[styles.continueText, attempted && !valid && styles.disabledText]}>Tiếp tục đến thanh toán</Text><ArrowRight size={18} color={attempted && !valid ? COLORS.inkSubtle : COLORS.bgWhite} /></Pressable></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: SPACING.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 23, letterSpacing: -0.24 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 20 },
  stepLabel: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, letterSpacing: 0.3 },
  summary: { minHeight: 112, marginTop: 30, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSubtle },
  summaryImage: { width: 80, height: 80, borderRadius: RADII.full },
  summaryContent: { flex: 1, gap: 5 },
  stayTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18, lineHeight: 23 },
  summaryLine: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  heading: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 23, marginTop: 32, marginBottom: 24 },
  field: { marginBottom: 28 },
  emailField: { marginBottom: 4 },
  emailHint: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, marginBottom: 24 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 6 },
  fieldLabel: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  optional: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  requestInput: { minHeight: 100, padding: 14, borderWidth: 1, borderColor: COLORS.borderSage, borderRadius: RADII.xs, backgroundColor: COLORS.bgWhite, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, textAlignVertical: 'top' },
  demoNote: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 17, marginTop: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SPACING.xl, paddingTop: 16, backgroundColor: COLORS.bgWhite, borderTopWidth: 1, borderTopColor: COLORS.borderLight, ...SHADOWS.stickyFooter },
  continueButton: { height: SIZES.button, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabledButton: { backgroundColor: COLORS.borderLight },
  continueText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  disabledText: { color: COLORS.inkSubtle },
});
