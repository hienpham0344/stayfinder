import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/tokens';
import { useLiveState } from '../../state/LiveState';
import { LiveButton, LiveField, LiveMessage, LiveScreen, LiveStayCard } from './LiveUi';
import { ApiAccommodation, ApiRewardAccount, ApiRewardCatalog, stayApi } from '../../services/api';

export function LiveAuthScreen() {
  const { mode, returnTo } = useLocalSearchParams<{ mode?: string; returnTo?: string }>();
  const { login, register } = useLiveState();
  const [create, setCreate] = useState(mode === 'create');
  const [role, setRole] = useState<'CUSTOMER' | 'PARTNER' | 'ADMIN'>('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setCreate(mode === 'create'), [mode]);

  const submit = async () => {
    setError(''); setBusy(true);
    try {
      if (create) {
        await register(name.trim(), email.trim(), password, role);
      } else {
        await login(email.trim(), password);
      }
      setPassword('');

      if (returnTo === '/booking/checkout') {
        router.replace('/booking/checkout');
      } else if (role === 'ADMIN') {
        router.replace('/admin');
      } else if (role === 'PARTNER') {
        router.replace('/partner');
      } else {
        router.replace('/(tabs)/profile');
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể đăng nhập.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <LiveScreen title={create ? 'Tạo tài khoản' : 'Đăng nhập'} back>
      {create && <LiveField label="Họ tên" value={name} onChangeText={setName} />}
      <LiveField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <LiveField label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />

      {create && (
        <View style={{ marginVertical: 10 }}>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '500' }}>
            Vai trò tài khoản:
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['CUSTOMER', 'PARTNER', 'ADMIN'] as const).map((r) => (
              <Pressable
                key={r}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: role === r ? COLORS.primary : COLORS.borderLight,
                  backgroundColor: role === r ? COLORS.primarySoft : COLORS.bgSecondary,
                  alignItems: 'center',
                }}
                onPress={() => setRole(r)}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: role === r ? COLORS.primary : COLORS.textMuted,
                  }}
                >
                  {r === 'CUSTOMER' ? 'Khách hàng' : r === 'PARTNER' ? 'Đối tác' : 'Admin'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {!!error && <LiveMessage text={error} />}

      <LiveButton
        title={busy ? 'Đang xử lý…' : create ? 'Tạo tài khoản' : 'Đăng nhập'}
        onPress={() => void submit()}
        disabled={busy || !email.trim() || password.length < 8 || (create && !name.trim())}
      />
      <LiveButton
        secondary
        title={create ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
        onPress={() => { setCreate(!create); setError(''); }}
      />
    </LiveScreen>
  );
}

export function LiveWishlistScreen() {
  const { token, favoriteIds, toggleFavorite, privateLoading, privateError, refreshPrivate } = useLiveState();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<ApiAccommodation[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const moreBusy = useRef(false);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    if (!token) { setSaved([]); return; }
    let active = true;
    setLoading(true); setError('');
    void stayApi.wishlistPage(token).then((result) => {
      if (active) { setSaved(result.content); setPage(result.number); setHasMore(result.number + 1 < result.totalPages); }
    }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : 'Không thể tải wishlist.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; if (generation.current === currentGeneration) generation.current += 1; };
  }, [token, favoriteIds]);

  const more = async () => {
    if (!token || loading || moreBusy.current) return;
    const currentGeneration = generation.current;
    moreBusy.current = true;
    setLoading(true);
    try {
      const result = await stayApi.wishlistPage(token, page + 1);
      if (generation.current !== currentGeneration) return;
      setSaved((current) => [...current, ...result.content.filter((item) => !current.some((old) => old.id === item.id))]);
      setPage(result.number); setHasMore(result.number + 1 < result.totalPages);
    } catch (failure) {
      if (generation.current === currentGeneration) setError(failure instanceof Error ? failure.message : 'Không thể tải thêm wishlist.');
    } finally { moreBusy.current = false; if (generation.current === currentGeneration) setLoading(false); }
  };

  if (!token) return <LiveScreen title="Wishlist"><LiveMessage text="Đăng nhập để xem các chỗ ở đã lưu." />
    <LiveButton title="Đăng nhập" onPress={() => router.push('/auth/demo?mode=login' as never)} /></LiveScreen>;

  return <LiveScreen title="Wishlist" refresh={() => void refreshPrivate()}>
    {privateLoading && <LiveMessage text="Đang tải wishlist…" loading />}
    {!!privateError && <LiveMessage text={privateError} />}
    {!!error && <LiveMessage text={error} />}
    {!privateLoading && !privateError && (saved.length === 0 ? <LiveMessage text="Chưa có chỗ ở đã lưu." /> : saved.map((item) =>
      <LiveStayCard key={item.id} stay={item} saved onPress={() => router.push(`/room/${item.id}` as never)}
        onSave={() => void toggleFavorite(item.id).catch((failure) => setError(failure instanceof Error ? failure.message : 'Không thể bỏ lưu.'))} />))}
    {loading && <LiveMessage text="Đang tải…" loading />}
    {hasMore && <LiveButton secondary title="Tải thêm wishlist" disabled={loading} onPress={() => void more()} />}
  </LiveScreen>;
}

export function LiveProfileScreen() {
  const { user, logout } = useLiveState();
  const [error, setError] = useState('');

  return <LiveScreen title="Tài khoản">
    {!!error && <LiveMessage text={error} />}
    {!user ? <><LiveMessage text="Đăng nhập để xem tài khoản và các chuyến đi." />
      <LiveButton title="Đăng nhập" onPress={() => router.push('/auth/demo?mode=login' as never)} /></> : <>
      <View style={styles.profile}>
        {!!user.avatarUrl && (
          <Image source={{ uri: user.avatarUrl }} style={{ width: 68, height: 68, borderRadius: 34, marginBottom: 8 }} />
        )}
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.meta}>{user.email}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <View style={{ backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
            <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '700' }}>{user.role}</Text>
          </View>
          <Text style={styles.meta}>Điểm tích lũy: {user.loyaltyPoints ?? 0}</Text>
        </View>
      </View>

      {/* Role Dashboard Jump Buttons */}
      {user.role === 'ADMIN' && (
        <LiveButton title="⚡ Quản trị hệ thống (Admin Dashboard)" onPress={() => router.push('/admin')} />
      )}
      {(user.role === 'PARTNER' || user.role === 'ADMIN') && (
        <LiveButton title="🏨 Quản lý chỗ nghỉ (Partner Dashboard)" secondary onPress={() => router.push('/partner')} />
      )}

      <LiveButton title="Booking của tôi" onPress={() => router.push('/(tabs)/bookings')} />
      <LiveButton title="Wishlist" secondary onPress={() => router.push('/(tabs)/wishlist')} />

      <LiveButton title="Đăng xuất" secondary onPress={() => void logout().then(() => router.replace('/(tabs)/profile')).catch((failure) => setError(failure instanceof Error ? failure.message : 'Không thể đăng xuất.'))} />
    </>}
  </LiveScreen>;
}

export function LiveRewardsScreen() {
  const { token } = useLiveState();
  const [account, setAccount] = useState<ApiRewardAccount | null>(null);
  const [catalog, setCatalog] = useState<ApiRewardCatalog[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const retryKeys = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!token) { setAccount(null); setCatalog([]); return; }
    let active = true;
    void Promise.all([stayApi.rewardAccount(token), stayApi.rewardCatalog(token)]).then(([balance, rewards]) => {
      if (active) { setAccount(balance); setCatalog(rewards.content); }
    }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : 'Không thể tải điểm thưởng.'); });
    return () => { active = false; };
  }, [token]);

  const redeem = async (item: ApiRewardCatalog) => {
    if (!token || busy) return;
    setBusy(true); setError(''); setMessage('');
    // These UUIDs identify retries; they are not authentication secrets.
    const key = retryKeys.current[item.id] ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
      const value = Math.floor(Math.random() * 16);
      return (character === 'x' ? value : (value & 3) | 8).toString(16);
    });
    retryKeys.current[item.id] = key;
    try {
      const voucher = await stayApi.redeemReward(item.id, key, token);
      delete retryKeys.current[item.id];
      setAccount((current) => current ? { ...current, points: current.points - item.pointsCost } : current);
      setMessage(`Đã đổi voucher giảm ${voucher.discountAmount.toLocaleString('vi-VN')} VND, hạn ${new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}.`);
      setAccount(await stayApi.rewardAccount(token));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể đổi thưởng.'); }
    finally { setBusy(false); }
  };

  return <LiveScreen title="Điểm thưởng" back>
    {!token ? <LiveMessage text="Đăng nhập để xem và đổi điểm thưởng." /> : <>
      <Text style={styles.name}>{account?.points ?? 0} điểm</Text>
      <LiveMessage text="Điểm được cộng sau khi hoàn tất lưu trú. Voucher áp dụng cho một booking, theo điều kiện trong danh mục." />
      {!!error && <LiveMessage text={error} />}
      {!!message && <LiveMessage text={message} />}
      {catalog.map((item) => <View key={item.id} style={styles.profile}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.pointsCost} điểm · đơn tối thiểu {item.minSpend.toLocaleString('vi-VN')} VND · {item.validityDays} ngày</Text>
        <LiveButton title="Đổi voucher" disabled={busy || !account || account.points < item.pointsCost} onPress={() => void redeem(item)} />
      </View>)}
    </>}
  </LiveScreen>;
}

const styles = StyleSheet.create({
  profile: { backgroundColor: COLORS.bgSurface, borderRadius: 18, padding: 20, gap: 8, marginBottom: 16 },
  name: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 22 },
  meta: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 15 },
});
