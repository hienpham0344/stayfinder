import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/tokens';
import { useLiveState } from '../../state/LiveState';
import { LiveButton, LiveField, LiveMessage, LiveScreen, LiveStayCard } from './LiveUi';

export function LiveAuthScreen() {
  const { mode, returnTo } = useLocalSearchParams<{ mode?: string; returnTo?: string }>();
  const { login, register } = useLiveState();
  const [create, setCreate] = useState(mode === 'create');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setCreate(mode === 'create'), [mode]);
  const submit = async () => {
    setError(''); setBusy(true);
    try {
      if (create) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      setPassword('');
      router.replace(returnTo === '/booking/checkout' ? '/booking/checkout' : '/(tabs)/profile');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể đăng nhập.'); }
    finally { setBusy(false); }
  };
  return <LiveScreen title={create ? 'Tạo tài khoản' : 'Đăng nhập'} back>
    {create && <LiveField label="Họ tên" value={name} onChangeText={setName} />}
    <LiveField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
    <LiveField label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
    {!!error && <LiveMessage text={error} />}
    <LiveButton title={busy ? 'Đang xử lý…' : create ? 'Tạo tài khoản' : 'Đăng nhập'} onPress={() => void submit()} disabled={busy || !email.trim() || password.length < 8 || (create && !name.trim())} />
    <LiveButton secondary title={create ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'} onPress={() => { setCreate(!create); setError(''); }} />
  </LiveScreen>;
}

export function LiveWishlistScreen() {
  const { token, catalog, favoriteIds, toggleFavorite, privateLoading, privateError, refreshPrivate } = useLiveState();
  const [error, setError] = useState('');
  if (!token) return <LiveScreen title="Wishlist"><LiveMessage text="Đăng nhập để xem các chỗ ở đã lưu." />
    <LiveButton title="Đăng nhập" onPress={() => router.push('/auth/demo?mode=login' as never)} /></LiveScreen>;
  const saved = catalog.filter((item) => favoriteIds.includes(item.id));
  return <LiveScreen title="Wishlist" refresh={() => void refreshPrivate()}>
    {privateLoading && <LiveMessage text="Đang tải wishlist…" loading />}
    {!!privateError && <LiveMessage text={privateError} />}
    {!!error && <LiveMessage text={error} />}
    {!privateLoading && !privateError && (saved.length === 0 ? <LiveMessage text="Chưa có chỗ ở đã lưu." /> : saved.map((item) =>
      <LiveStayCard key={item.id} stay={item} saved onPress={() => router.push(`/room/${item.id}` as never)}
        onSave={() => void toggleFavorite(item.id).catch((failure) => setError(failure instanceof Error ? failure.message : 'Không thể bỏ lưu.'))} />))}
  </LiveScreen>;
}

export function LiveProfileScreen() {
  const { user, logout } = useLiveState();
  return <LiveScreen title="Tài khoản">
    {!user ? <><LiveMessage text="Đăng nhập để xem tài khoản và các chuyến đi." />
      <LiveButton title="Đăng nhập" onPress={() => router.push('/auth/demo?mode=login' as never)} /></> : <>
      <View style={styles.profile}><Text style={styles.name}>{user.fullName}</Text><Text style={styles.meta}>{user.email}</Text>
        <Text style={styles.meta}>Vai trò: {user.role}</Text>
        <Text style={styles.meta}>Điểm hiện có: {user.loyaltyPoints ?? 0}</Text></View>
      <LiveButton title="Booking của tôi" onPress={() => router.push('/(tabs)/bookings')} />
      <LiveButton title="Wishlist" secondary onPress={() => router.push('/(tabs)/wishlist')} />
      <LiveButton title="Đăng xuất" secondary onPress={() => { logout(); router.replace('/(tabs)/profile'); }} />
    </>}
  </LiveScreen>;
}

export function LiveRewardsScreen() {
  const { user } = useLiveState();
  return <LiveScreen title="Điểm thưởng" back>
    <Text style={styles.name}>{user?.loyaltyPoints ?? 0} điểm</Text>
    <LiveMessage text="API hiện chỉ hỗ trợ xem điểm. Đổi thưởng chưa được kết nối." />
  </LiveScreen>;
}

const styles = StyleSheet.create({
  profile: { backgroundColor: COLORS.bgSurface, borderRadius: 18, padding: 20, gap: 8, marginBottom: 16 },
  name: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 22 },
  meta: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 15 },
});
