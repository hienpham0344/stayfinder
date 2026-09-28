import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';

type Mode = 'signed-out' | 'login' | 'create';
const routeFor = (mode: Mode) => `/auth/demo?mode=${mode}` as never;

export function AuthDemoExperience() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode = modeParam === 'login' || modeParam === 'create' ? modeParam : 'signed-out';
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const goMode = (next: Mode) => { setNotice(''); setError(''); setPassword(''); router.push(routeFor(next)); };
  const submit = () => {
    if (mode === 'create' && !name.trim()) { setError('Vui lòng nhập họ và tên.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 8) { setError('Nhập email hợp lệ và mật khẩu ít nhất 8 ký tự.'); return; }
    setError(''); setPassword(''); setNotice(mode === 'login' ? 'Đây là màn đăng nhập demo. Trạng thái tài khoản không thay đổi.' : 'Đây là màn tạo tài khoản demo. Không có tài khoản nào được tạo.');
  };

  if (mode === 'signed-out') return <View style={[styles.signedOutScreen, { paddingTop: insets.top }]}><Pressable style={styles.back} onPress={() => router.replace('/(tabs)/profile')} accessibilityLabel="Về tài khoản"><ArrowLeft size={SIZES.icon} color={COLORS.primary} /></Pressable><View style={styles.centerWrap}><View style={styles.signedOutCard}><Text style={styles.signedOutTitle}>Bạn đang xem chế độ đã đăng xuất</Text><Text style={styles.signedOutText}>Đăng nhập để xem thử giao diện quản lý đặt phòng, điểm thưởng và chỗ ở đã lưu.</Text><Text style={styles.demoNote}>Tài khoản thật của bạn chưa được đăng xuất.</Text><Pressable style={styles.primaryButton} onPress={() => goMode('login')}><Text style={styles.primaryText}>Xem đăng nhập</Text></Pressable><Pressable style={styles.ghostButton} onPress={() => router.replace('/(tabs)/profile')}><Text style={styles.ghostText}>Tiếp tục xem app</Text></Pressable></View></View></View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
    <View style={styles.brandRow}><Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Quay lại"><ArrowLeft size={SIZES.icon} color={COLORS.primary} /></Pressable><Text style={styles.brand}>StayFinder</Text></View>
    <Text style={styles.title}>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</Text>
    <Text style={styles.subtitle}>{mode === 'login' ? 'Xem thử giao diện đăng nhập cho chuyến đi tiếp theo.' : 'Xem thử giao diện lưu chỗ ở và quản lý chuyến đi.'}</Text>
    <Text style={styles.demoWarning}>Chỉ nhập dữ liệu giả. Biểu mẫu này không xác thực hoặc lưu tài khoản.</Text>
    {mode === 'create' && <View style={styles.field}><Text style={styles.label}>Họ và tên</Text><TextInput value={name} onChangeText={setName} placeholder="Họ và tên" placeholderTextColor={COLORS.inkSubtle} style={styles.input} autoComplete="name" /></View>}
    <View style={styles.field}><Text style={styles.label}>Email</Text><TextInput value={email} onChangeText={setEmail} placeholder="Địa chỉ email" placeholderTextColor={COLORS.inkSubtle} style={styles.input} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View>
    <View style={styles.field}><Text style={styles.label}>Mật khẩu</Text><TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu" placeholderTextColor={COLORS.inkSubtle} style={styles.input} secureTextEntry /></View>
    {!!error && <Text style={styles.error}>{error}</Text>}{!!notice && <Text style={styles.notice}>{notice}</Text>}
    <Pressable style={styles.primaryButton} onPress={submit}><Text style={styles.primaryText}>{mode === 'login' ? 'Đăng nhập demo' : 'Tạo tài khoản demo'}</Text></Pressable>
    <Text style={styles.separatorText}>hoặc tiếp tục với</Text>
    <View style={styles.socialRow}><Pressable style={styles.socialButton} onPress={() => setNotice('Google chỉ là nút xem thử; không mở đăng nhập thật.')}><Text style={styles.socialText}>G  Google</Text></Pressable><Pressable style={styles.socialButton} onPress={() => setNotice('Facebook chỉ là nút xem thử; không mở đăng nhập thật.')}><Text style={styles.socialText}>f  Facebook</Text></Pressable></View>
    <Pressable style={styles.switchMode} onPress={() => goMode(mode === 'login' ? 'create' : 'login')}><Text style={styles.switchText}>{mode === 'login' ? 'Chưa có tài khoản? Xem tạo tài khoản' : 'Đã có tài khoản? Xem đăng nhập'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWhite },
  signedOutScreen: { flex: 1, backgroundColor: COLORS.bgMain },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  centerWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  signedOutCard: { padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  signedOutTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  signedOutText: { marginTop: 28, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  demoNote: { marginTop: 12, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  primaryButton: { minHeight: SIZES.button, marginTop: 24, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  ghostButton: { minHeight: SIZES.button, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -16 },
  brand: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 23 },
  title: { marginTop: 32, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.bold, fontSize: 28 },
  subtitle: { marginTop: 4, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 21 },
  demoWarning: { marginTop: 16, marginBottom: 16, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 17 },
  field: { minHeight: 64, marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.borderTealSoft, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceMint, justifyContent: 'center' },
  label: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  input: { minHeight: 30, padding: 0, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
  error: { marginTop: 12, color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  notice: { marginTop: 12, color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
  separatorText: { marginTop: 28, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, textAlign: 'center' },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  socialButton: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: COLORS.borderTealSoft, borderRadius: RADII.lg, alignItems: 'center', justifyContent: 'center' },
  socialText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  switchMode: { minHeight: 52, marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13, textAlign: 'center' },
});
