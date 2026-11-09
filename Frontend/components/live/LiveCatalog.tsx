import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ApiAccommodationDetail, ApiReview, ApiRoom, stayApi } from '../../services/api';
import { useLiveState } from '../../state/LiveState';
import { validTravelDates } from '../../utils/frontendState';
import { COLORS, TYPOGRAPHY } from '../../constants/tokens';
import { LiveButton, LiveField, LiveMessage, LiveScreen, LiveStayCard, formatVnd } from './LiveUi';

function CatalogList({ query = '' }: { query?: string }) {
  const { catalog, catalogError, catalogLoading, favoriteIds, token, toggleFavorite, refreshCatalog } = useLiveState();
  const [error, setError] = useState('');
  const matches = useMemo(() => catalog.filter((stay) =>
    `${stay.name} ${stay.address ?? ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [catalog, query]);
  if (catalogLoading) return <LiveMessage text="Đang tải chỗ ở…" loading />;
  if (catalogError) return <View><LiveMessage text={catalogError} /><LiveButton title="Thử lại" onPress={() => void refreshCatalog()} /></View>;
  return <View>
    {!!error && <LiveMessage text={error} />}
    {matches.length === 0 ? <LiveMessage text="Không tìm thấy chỗ ở phù hợp." /> : matches.map((stay) =>
      <LiveStayCard key={stay.id} stay={stay} saved={favoriteIds.includes(stay.id)}
        onPress={() => router.push(`/room/${stay.id}` as never)}
        onSave={() => {
          if (!token) { router.push('/auth/demo?mode=login' as never); return; }
          void toggleFavorite(stay.id).catch((failure) => setError(failure instanceof Error ? failure.message : 'Không thể cập nhật wishlist.'));
        }} />)}
  </View>;
}

export function LiveHomeScreen() {
  const { refreshCatalog } = useLiveState();
  return <LiveScreen title="StayFinder" refresh={() => void refreshCatalog()}>
    <Text style={styles.subheading}>Tìm nơi lưu trú từ dữ liệu thật</Text>
    <LiveButton title="Tìm kiếm và chọn ngày" onPress={() => router.push('/(tabs)/search')} />
    <View style={styles.section}><CatalogList /></View>
  </LiveScreen>;
}

export function LiveSearchScreen() {
  const { trip, setTrip } = useLiveState();
  const [query, setQuery] = useState('');
  return <LiveScreen title="Tìm chỗ ở">
    <LiveField label="Tên hoặc địa chỉ" value={query} onChangeText={setQuery} placeholder="Bạn muốn đi đâu?" />
    <View style={styles.row}>
      <View style={styles.flex}><LiveField label="Nhận phòng (YYYY-MM-DD)" value={trip.checkIn} onChangeText={(checkIn) => setTrip((current) => ({ ...current, checkIn }))} /></View>
      <View style={styles.flex}><LiveField label="Trả phòng (YYYY-MM-DD)" value={trip.checkOut} onChangeText={(checkOut) => setTrip((current) => ({ ...current, checkOut }))} /></View>
    </View>
    <LiveField label="Số khách" value={String(trip.guests)} keyboardType="numeric"
      onChangeText={(value) => setTrip((current) => ({ ...current, guests: Number(value) || 0 }))} />
    {!validTravelDates(trip.checkIn, trip.checkOut) || trip.guests < 1 ?
      <LiveMessage text="Chọn ngày hợp lệ và ít nhất một khách trước khi chọn phòng." /> :
      <Text style={styles.hint}>Phòng trống được kiểm tra theo ngày ở bước chọn phòng.</Text>}
    <View style={styles.section}><CatalogList query={query} /></View>
  </LiveScreen>;
}

export function LiveStayDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { favoriteIds, token, toggleFavorite, setTrip } = useLiveState();
  const [detail, setDetail] = useState<ApiAccommodationDetail | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true); setError('');
    void stayApi.accommodation(id).then((nextDetail) => {
      if (active) { setDetail(nextDetail); setLoading(false); }
      void stayApi.reviews(id).then((nextReviews) => { if (active) setReviews(nextReviews); })
        .catch(() => { if (active) setReviews([]); });
    }).catch((failure) => { if (active) { setError(failure instanceof Error ? failure.message : 'Không thể tải chỗ ở.'); setLoading(false); } });
    return () => { active = false; };
  }, [id]);
  return <LiveScreen title={detail?.accommodation.name || 'Chi tiết chỗ ở'} back>
    {loading ? <LiveMessage text="Đang tải chi tiết…" loading /> : error ? <LiveMessage text={error} /> : detail && <>
      {!!actionError && <LiveMessage text={actionError} />}
      {detail.images[0]?.url ? <Image source={{ uri: detail.images[0].url }} style={styles.hero} resizeMode="cover" /> : <View style={[styles.hero, styles.noImage]}><Text style={styles.hint}>Chưa có ảnh</Text></View>}
      <Text style={styles.address}>{detail.accommodation.address || 'Địa chỉ chưa cập nhật'}</Text>
      <Text style={styles.description}>{detail.accommodation.description || 'Chưa có mô tả.'}</Text>
      <Text style={styles.price}>Giá tham khảo từ {formatVnd(detail.accommodation.basePrice)} / đêm</Text>
      {detail.features.length > 0 && <Text style={styles.description}>Tiện ích: {detail.features.map((item) => item.name).join(' · ')}</Text>}
      <LiveButton title="Xem phòng trống" onPress={() => {
        setTrip((current) => ({ ...current, accommodationId: detail.accommodation.id, roomId: '' }));
        router.push(`/room/select?id=${detail.accommodation.id}` as never);
      }} />
      <LiveButton secondary title={favoriteIds.includes(detail.accommodation.id) ? 'Bỏ khỏi wishlist' : 'Lưu vào wishlist'} onPress={() => {
        if (!token) { router.push('/auth/demo?mode=login' as never); return; }
        void toggleFavorite(detail.accommodation.id).catch((failure) => setActionError(failure instanceof Error ? failure.message : 'Không thể cập nhật wishlist.'));
      }} />
      <Text style={styles.sectionTitle}>Đánh giá ({reviews.length})</Text>
      {reviews.length === 0 ? <Text style={styles.hint}>Chưa có đánh giá.</Text> : reviews.map((review) =>
        <View key={review.id} style={styles.review}><Text style={styles.reviewRating}>{'★'.repeat(review.rating)}</Text><Text style={styles.description}>{review.comment}</Text></View>)}
    </>}
  </LiveScreen>;
}

export function LiveRoomSelectionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { trip, setTrip } = useLiveState();
  const accommodationId = id || trip.accommodationId;
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const valid = validTravelDates(trip.checkIn, trip.checkOut) && trip.guests >= 1;
  useEffect(() => {
    if (!accommodationId || !valid) { setRooms([]); return; }
    let active = true;
    setLoading(true); setError('');
    void stayApi.rooms(accommodationId, trip.checkIn, trip.checkOut, trip.guests)
      .then((items) => { if (active) setRooms(items); })
      .catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : 'Không thể tải phòng.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accommodationId, trip.checkIn, trip.checkOut, trip.guests, valid]);
  return <LiveScreen title="Chọn phòng" back>
    <View style={styles.row}>
      <View style={styles.flex}><LiveField label="Nhận phòng" value={trip.checkIn} onChangeText={(checkIn) => setTrip((current) => ({ ...current, checkIn }))} /></View>
      <View style={styles.flex}><LiveField label="Trả phòng" value={trip.checkOut} onChangeText={(checkOut) => setTrip((current) => ({ ...current, checkOut }))} /></View>
    </View>
    <LiveField label="Số khách" value={String(trip.guests)} keyboardType="numeric" onChangeText={(value) => setTrip((current) => ({ ...current, guests: Number(value) || 0 }))} />
    {!valid ? <LiveMessage text="Ngày nhận phòng/trả phòng hoặc số khách không hợp lệ." /> :
      loading ? <LiveMessage text="Đang kiểm tra phòng…" loading /> : error ? <LiveMessage text={error} /> :
        rooms.length === 0 ? <LiveMessage text="Không có phòng trống cho ngày đã chọn." /> : rooms.map((room) =>
          <View key={room.id} style={styles.room}>
            <Text style={styles.roomTitle}>{room.name}</Text>
            {!!room.description && <Text style={styles.description}>{room.description}</Text>}
            <Text style={styles.price}>{formatVnd(room.price)} / đêm</Text>
            <LiveButton title="Chọn phòng này" disabled={room.price == null || room.price <= 0} onPress={() => {
              setTrip((current) => ({ ...current, accommodationId, roomId: room.id }));
              router.push('/booking/checkout');
            }} />
          </View>)}
  </LiveScreen>;
}

const styles = StyleSheet.create({
  subheading: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, marginBottom: 12 },
  section: { marginTop: 22 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  hint: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  address: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 15, marginBottom: 14 },
  description: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 15, lineHeight: 23, marginBottom: 12 },
  price: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 17, marginBottom: 12 },
  hero: { width: '100%', height: 220, borderRadius: 18, marginBottom: 16 },
  noImage: { backgroundColor: COLORS.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, marginTop: 24, marginBottom: 12 },
  review: { padding: 14, backgroundColor: COLORS.bgSurface, borderRadius: 14, marginBottom: 10 },
  reviewRating: { color: COLORS.primary, fontSize: 17, marginBottom: 5 },
  room: { backgroundColor: COLORS.bgSurface, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.borderLight },
  roomTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 19, marginBottom: 8 },
});
