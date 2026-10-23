import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { useSession } from '../../state/SessionProvider';
import { ApiError } from '../../services/apiClient';
import { safeAuthReturnRoute, validateAuthInput } from '../../services/authValidation';

type Mode = 'signed-out' | 'login' | 'create';
const routeFor = (mode: Mode, returnTo?: string) => `/auth/demo?mode=${mode}${returnTo ? '&returnTo=' + encodeURIComponent(safeAuthReturnRoute(returnTo)) : ''}` as never;

export function AuthDemoExperience() {
  const { mode: modeParam, returnTo } = useLocalSearchParams<{ mode?: string; returnTo?: string }>();
  const { session, user, loading } = useSession();
  const [mode, setMode] = useState<Mode>('signed-out');
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const signedOutReveal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setMode(modeParam === 'login' || modeParam === 'create' ? modeParam : 'signed-out');
  }, [modeParam]);
  useEffect(() => {
    if (mode !== 'signed-out') return;
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    const applyMotionPreference = (reduceMotion: boolean) => {
      if (cancelled) return;
      animation?.stop(); signedOutReveal.setValue(reduceMotion ? 1 : 0);
      if (reduceMotion) return;
      animation = Animated.loop(Animated.sequence([
        Animated.timing(signedOutReveal, { toValue: 1, duration: 200, easing: Easing.bezier(0, 0, 0.58, 1), useNativeDriver: true }),
        Animated.delay(1800),
      ]));
      animation.start();
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', applyMotionPreference);
    AccessibilityInfo.isReduceMotionEnabled().then(applyMotionPreference).catch(() => applyMotionPreference(true));
    return () => { cancelled = true; subscription.remove(); animation?.stop(); };
  }, [mode, signedOutReveal]);
  const goMode = (next: Mode) => {
    if (inFlight.current) return;
    setError(''); setPassword(''); router.push(routeFor(next, returnTo));
  };
  const submit = async () => {
    if (mode === 'signed-out' || inFlight.current || loading) return;
    const validation = validateAuthInput(mode, name, email, password);
    if (validation) { setError(validation); return; }
    inFlight.current = true; setPending(true); setError('');
    try {
      const credentials = { email: email.trim(), password };
      if (mode === 'create') await session.register({ ...credentials, fullName: name.trim() });
      else await session.login(credentials);
      setPassword(''); router.replace(safeAuthReturnRoute(returnTo) as never);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Unable to sign in. Please try again.');
    } finally { inFlight.current = false; setPending(false); }
  };
  const signOut = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setPending(true); setError('');
    try { await session.logout(); }
    catch { setError('Unable to finish signing out. Please try again.'); }
    finally { inFlight.current = false; setPending(false); }
  };

  if (mode === 'signed-out') return <View style={styles.signedOutScreen}>
    <View style={[styles.centerWrap, { paddingTop: Math.max(insets.top + 80, 160) }]}>
      <Animated.View style={[styles.signedOutCard, { opacity: signedOutReveal, transform: [{ scale: signedOutReveal.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
        <Text style={styles.signedOutTitle}>{user ? 'You’re signed in' : 'You’re signed out'}</Text>
        <Text style={styles.signedOutText}>{user ? `Signed in as ${user.fullName}.` : 'Sign in to manage your bookings, rewards and saved stays.'}</Text>
        {loading && <ActivityIndicator color={COLORS.primary} />}
        <Pressable style={styles.primaryButton} disabled={loading || pending}
          onPress={() => user ? router.replace(safeAuthReturnRoute(returnTo) as never) : goMode('login')}
          accessibilityRole="button" accessibilityState={{ disabled: loading || pending }} accessibilityLabel={user ? 'Continue' : 'Sign in'}>
          <Text style={styles.primaryText}>{user ? 'Continue' : 'Sign in'}</Text>
        </Pressable>
        <Pressable style={styles.ghostButton} disabled={pending} onPress={() => user ? void signOut() : router.replace('/')}
          accessibilityRole="button" accessibilityLabel={user ? 'Sign out' : 'Continue as guest'}>
          <Text style={styles.ghostText}>{pending ? 'Please wait…' : user ? 'Sign out' : 'Continue as guest'}</Text>
        </Pressable>
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      </Animated.View>
    </View>
  </View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 24, 48), paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.brandSlot}><Text style={styles.brand}>StayFinder</Text></View>
      <View style={styles.titleSlot}><Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create an account'}</Text></View>
      <View style={styles.subtitleSlot}><Text style={styles.subtitle}>{mode === 'login' ? 'Sign in to continue planning your next stay.' : 'Save stays and manage every trip in one place.'}</Text></View>
      {mode === 'create' && <View style={[styles.field, styles.firstField]}>
        <View style={styles.labelSlot}><Text style={styles.label}>Full name</Text></View>
        <TextInput accessibilityLabel="Full name" value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={COLORS.inkNavy}
          style={styles.input} autoComplete="name" maxLength={120} editable={!pending} />
      </View>}
      <View style={[styles.field, mode === 'login' && styles.firstField]}>
        <View style={styles.labelSlot}><Text style={styles.label}>Email</Text></View>
        <TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={COLORS.inkNavy}
          style={styles.input} keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={320} editable={!pending} />
      </View>
      <View style={styles.field}>
        <View style={styles.labelSlot}><Text style={styles.label}>Password</Text></View>
        <TextInput accessibilityLabel="Password" value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={COLORS.inkNavy}
          style={styles.input} secureTextEntry editable={!pending} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} />
      </View>
      <View style={styles.feedbackSlot}>{!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}</View>
      <Pressable style={[styles.primaryButton, styles.formSubmitButton, (pending || loading) && { opacity: 0.6 }]} onPress={submit}
        disabled={pending || loading} accessibilityRole="button" accessibilityState={{ disabled: pending || loading, busy: pending }}
        accessibilityLabel={mode === 'login' ? 'Log in' : 'Create account'}>
        {pending ? <ActivityIndicator color={COLORS.bgWhite} /> : <Text style={styles.primaryText}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>}
      </Pressable>
      <Pressable style={styles.switchMode} disabled={pending} onPress={() => goMode(mode === 'login' ? 'create' : 'login')}
        accessibilityRole="button" accessibilityLabel={mode === 'login' ? 'Create account' : 'Log in'}>
        <Text style={styles.switchText}>{mode === 'login' ? 'New to StayFinder? Create account' : 'Already have an account? Log in'}</Text>
      </Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWhite },
  signedOutScreen: { flex: 1, backgroundColor: '#F6F9F8' },
  centerWrap: { flex: 1, justifyContent: 'flex-start', paddingHorizontal: SPACING.xl, paddingTop: 220 },
  signedOutCard: { minHeight: 288, padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  signedOutTitle: { minHeight: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  signedOutText: { minHeight: 50, marginTop: 16, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  primaryButton: { height: 48, marginTop: 16, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  ghostButton: { height: 44, marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  brandSlot: { height: 22, justifyContent: 'center' },
  brand: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  titleSlot: { height: 22, marginTop: 54, justifyContent: 'center' },
  title: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 28, lineHeight: 32, letterSpacing: -0.24 },
  subtitleSlot: { minHeight: 22, marginTop: 9, justifyContent: 'center' },
  subtitle: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 16 },
  field: { height: 64, marginTop: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, gap: 4, borderWidth: 1, borderColor: '#DEE8E5', borderRadius: SPACING.md, backgroundColor: COLORS.surfaceSage },
  firstField: { marginTop: 35 },
  labelSlot: { height: 22, justifyContent: 'center' },
  label: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  input: { height: 22, minHeight: 22, padding: 0, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  feedbackSlot: { minHeight: 22, marginTop: 12, justifyContent: 'center' },
  error: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 16 },
  notice: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
  formSubmitButton: { height: 50, marginTop: 0 },
  separatorSlot: { minHeight: 22, marginTop: 20, justifyContent: 'center' },
  separatorText: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  socialButton: { flex: 1, height: 48, borderWidth: 1, borderColor: '#D4E0DE', borderRadius: SPACING.md, alignItems: 'center', justifyContent: 'center' },
  socialText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  switchMode: { height: 48, marginTop: 14, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  demoDisclosure: { marginTop: 4, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
