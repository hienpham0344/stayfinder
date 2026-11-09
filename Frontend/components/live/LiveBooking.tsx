import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ApiBooking, ApiPayment, ApiRoom, stayApi } from '../../services/api';
import { useLiveState } from '../../state/LiveState';
import { travelNights, validTravelDates } from '../../utils/frontendState';
import { COLORS, TYPOGRAPHY } from '../../constants/tokens';
import { LiveButton, LiveField, LiveMessage, LiveScreen, formatVnd } from './LiveUi';

export function LiveGuestInfoScreen() {
  const { user } = useLiveState();
  return <LiveScreen title="Thông tin khách" back>
    {user ? <><Text style={styles.body}>Booking sẽ được gắn với tài khoản {user.email}. API hiện chưa lưu thông tin riêng của người nhận phòng.</Text>
      <LiveButton title="Tiếp tục thanh toán" onPress={() => router.push('/booking/checkout')} /></> :
      <><LiveMessage text="Đăng nhập để tạo booking." /><LiveButton title="Đăng nhập" onPress={() => router.push('/auth/demo?mode=login&returnTo=%2Fbooking%2Fcheckout' as never)} /></>}
  </LiveScreen>;
}

export function LiveCheckoutScreen() {
  const { bookingId: existingBookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const { token, trip, refreshBookings } = useLiveState();
  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [bookingId, setBookingId] = useState(existingBookingId || '');
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const validTrip = validTravelDates(trip.checkIn, trip.checkOut) && trip.guests > 0 && !!trip.roomId && !!trip.accommodationId;
  const loginRoute = existingBookingId ? '/auth/demo?mode=login' : '/auth/demo?mode=login&returnTo=%2Fbooking%2Fcheckout';

  useEffect(() => {
    setBookingId(existingBookingId || '');
    setPayment(null);
    setError('');
  }, [existingBookingId]);

  useEffect(() => {
    setRoom(null);
    if (!validTrip || existingBookingId) return;
    let active = true;
    void stayApi.rooms(trip.accommodationId, trip.checkIn, trip.checkOut, trip.guests)
      .then((rooms) => { if (active) setRoom(rooms.find((item) => item.id === trip.roomId) ?? null); })
      .catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : 'Không thể kiểm tra phòng.'); });
    return () => { active = false; };
  }, [existingBookingId, trip, validTrip]);

  useEffect(() => {
    if (!existingBookingId || !token) return;
    let active = true;
    void stayApi.payments(existingBookingId, token).then((payments) => {
      if (active) setPayment(payments.find((item) => item.status === 'PENDING') ?? payments[0] ?? null);
    }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : 'Không thể tải thanh toán.'); });
    return () => { active = false; };
  }, [existingBookingId, token]);

  useEffect(() => {
    if (!bookingId || !payment || !token || payment.status !== 'PENDING') return;
    const timer = setInterval(() => {
      void stayApi.booking(bookingId, token).then((booking) => {
        if (booking.status === 'CONFIRMED') {
          void refreshBookings().catch(() => {});
          router.replace(`/booking/confirmation?bookingId=${bookingId}` as never);
        }
      }).catch(() => { /* The refresh button remains available if the network is offline. */ });
    }, 5000);
    return () => clearInterval(timer);
  }, [bookingId, payment, token, refreshBookings]);

  const submit = async () => {
    if (!token || busy) return;
    setBusy(true); setError('');
    try {
      let id = bookingId;
      if (!id) {
        if (!validTrip || !room) throw new Error('Chọn một phòng còn trống trước khi đặt.');
        const booking = await stayApi.createBooking({ accommodationId: trip.accommodationId, roomId: trip.roomId,
          checkIn: trip.checkIn, checkOut: trip.checkOut, quantity: 1, guests: trip.guests }, token);
        id = booking.id; setBookingId(id);
        await refreshBookings();
      }
      setPayment(await stayApi.createPayment(id, token));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể tạo thanh toán.'); }
    finally { setBusy(false); }
  };

  return <LiveScreen title="Thanh toán SePay" back>
    {!token ? <><LiveMessage text="Đăng nhập để đặt phòng." /><LiveButton title="Đăng nhập" onPress={() => router.push(loginRoute as never)} /></> : <>
      {!!error && <LiveMessage text={error} />}
      {!bookingId && !validTrip && <LiveMessage text="Chọn phòng và ngày ở hợp lệ trước khi thanh toán." />}
      {!bookingId && validTrip && <View style={styles.card}>
        <Text style={styles.heading}>{room?.name || 'Đang kiểm tra phòng…'}</Text>
        <Text style={styles.body}>{trip.checkIn} → {trip.checkOut} · {trip.guests} khách · 1 phòng</Text>
        <Text style={styles.price}>Dự kiến: {room ? formatVnd((room.price ?? 0) * travelNights(trip.checkIn, trip.checkOut)) : 'Đang tải'}</Text>
        <Text style={styles.body}>Tổng tiền cuối cùng do backend tính khi tạo booking.</Text>
      </View>}
      {!!bookingId && <Text style={styles.body}>Mã booking: {bookingId}</Text>}
      {payment ? <View style={styles.card}>
        <Text style={styles.heading}>Chuyển khoản {formatVnd(payment.amount)}</Text>
        <Text style={styles.body}>Tài khoản nhận: {payment.receivingAccountNumber || 'Chưa được cấu hình'}</Text>
        <Text selectable style={styles.code}>Nội dung: {payment.paymentCode}</Text>
        <Text style={styles.body}>Trạng thái: {payment.status}. Chỉ sau khi SePay xác nhận, booking mới được xác nhận.</Text>
        <LiveButton secondary title="Kiểm tra trạng thái" onPress={() => {
          void stayApi.booking(bookingId, token).then((booking) => {
            if (booking.status === 'CONFIRMED') router.replace(`/booking/confirmation?bookingId=${bookingId}` as never);
            else setError(`Booking hiện ở trạng thái ${booking.status}.`);
          }).catch((failure) => setError(failure instanceof Error ? failure.message : 'Không thể kiểm tra booking.'));
        }} />
      </View> : <LiveButton title={busy ? 'Đang tạo…' : bookingId ? 'Tiếp tục thanh toán' : 'Tạo booking và mã thanh toán'}
        disabled={busy || (!bookingId && (!validTrip || !room))} onPress={() => void submit()} />}
    </>}
  </LiveScreen>;
}

export function LiveConfirmationScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const { token } = useLiveState();
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [error, setError] = useState('');
  const refresh = () => {
    if (!bookingId || !token) return;
    void stayApi.booking(bookingId, token).then(setBooking)
      .catch((failure) => setError(failure instanceof Error ? failure.message : 'Không thể tải booking.'));
  };
  useEffect(refresh, [bookingId, token]);
  return <LiveScreen title="Trạng thái booking" refresh={refresh}>
    {!token ? <LiveMessage text="Đăng nhập để xem booking." /> : error ? <LiveMessage text={error} /> : !booking ? <LiveMessage text="Đang tải booking…" loading /> : <View style={styles.card}>
      <Text style={styles.heading}>{booking.status === 'CONFIRMED' ? 'Đã xác nhận' : booking.status === 'PENDING' ? 'Đang chờ thanh toán' : booking.status}</Text>
      <Text selectable style={styles.body}>Mã booking: {booking.id}</Text>
      <Text style={styles.body}>Tổng: {formatVnd(booking.totalPrice)}</Text>
      {booking.details.map((detail) => <Text key={detail.id} style={styles.body}>{detail.accommodationName || 'Chỗ ở'} · {detail.roomName || 'Phòng'} · {detail.checkInDate} → {detail.checkOutDate}</Text>)}
      {booking.status === 'PENDING' && <LiveButton title="Xem hướng dẫn thanh toán" onPress={() => router.push(`/booking/checkout?bookingId=${booking.id}` as never)} />}
      <LiveButton secondary title="Booking của tôi" onPress={() => router.replace('/(tabs)/bookings')} />
    </View>}
  </LiveScreen>;
}

export function LiveBookingsScreen() {
  const { token, user, bookings, refreshBookings, refreshPrivate, cancelBooking, privateLoading, privateError } = useLiveState();
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [existingReviewId, setExistingReviewId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const sendReview = async (booking: ApiBooking) => {
    const accommodationId = booking.details[0]?.accommodationId;
    if (!token || !accommodationId) return;
    setBusy(true); setError('');
    try {
      if (existingReviewId) await stayApi.updateReview(existingReviewId, Number(rating), comment.trim(), token);
      else await stayApi.createReview(accommodationId, booking.id, Number(rating), comment.trim(), token);
      setReviewId(''); setExistingReviewId(''); setComment('');
    }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể gửi đánh giá.'); }
    finally { setBusy(false); }
  };
  const openReview = async (booking: ApiBooking) => {
    const accommodationId = booking.details[0]?.accommodationId;
    if (!accommodationId || !user) return;
    setBusy(true); setError('');
    try {
      const reviews = await stayApi.reviews(accommodationId);
      const existing = reviews.find((item) => item.bookingId === booking.id && item.userId === user.id);
      setExistingReviewId(existing?.id ?? '');
      setRating(String(existing?.rating ?? 5));
      setComment(existing?.comment ?? '');
      setReviewId(booking.id);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể tải đánh giá.'); }
    finally { setBusy(false); }
  };
  return <LiveScreen title="Booking của tôi" refresh={() => void refreshPrivate()}>
    {!token ? <><LiveMessage text="Đăng nhập để xem booking." /><LiveButton title="Đăng nhập" onPress={() => router.push('/auth/demo?mode=login' as never)} /></> : <>
      {privateLoading && <LiveMessage text="Đang tải booking…" loading />}
      {!!privateError && <LiveMessage text={privateError} />}
      {!!error && <LiveMessage text={error} />}
      {!privateLoading && !privateError && (bookings.length === 0 ? <LiveMessage text="Chưa có booking." /> : bookings.map((booking) => <View key={booking.id} style={styles.card}>
        <Text style={styles.heading}>{booking.details[0]?.accommodationName || `Booking ${booking.id.slice(0, 8)}`}</Text>
        <Text style={styles.body}>{booking.details[0]?.roomName || 'Phòng'} · {booking.details[0]?.checkInDate} → {booking.details[0]?.checkOutDate}</Text>
        <Text style={styles.body}>{formatVnd(booking.totalPrice)} · {booking.status}</Text>
        {booking.status === 'PENDING' && <>
          <LiveButton title="Tiếp tục thanh toán" onPress={() => router.push(`/booking/checkout?bookingId=${booking.id}` as never)} />
          {confirmCancel === booking.id ? <><Text style={styles.body}>Hủy booking chưa thanh toán này?</Text>
            <LiveButton secondary title="Xác nhận hủy" onPress={() => void cancelBooking(booking.id).then(() => setConfirmCancel('')).catch((failure) => setError(failure instanceof Error ? failure.message : 'Không thể hủy booking.'))} /></>
            : <LiveButton secondary title="Hủy booking" onPress={() => setConfirmCancel(booking.id)} />}
        </>}
        {booking.status === 'COMPLETED' && booking.details[0]?.accommodationId && <>
          {reviewId === booking.id ? <><LiveField label="Điểm (1–5)" value={rating} keyboardType="numeric" onChangeText={setRating} />
            <LiveField label="Nhận xét" value={comment} onChangeText={setComment} />
            <LiveButton title="Gửi đánh giá" disabled={busy || !comment.trim() || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5} onPress={() => void sendReview(booking)} /></>
            : <LiveButton secondary title={busy ? 'Đang tải…' : 'Viết / sửa đánh giá'} disabled={busy} onPress={() => void openReview(booking)} />}
        </>}
      </View>))}
    </>}
  </LiveScreen>;
}

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 16, borderRadius: 18, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderLight, gap: 7 },
  heading: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 19 },
  body: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 15, lineHeight: 23 },
  price: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 17 },
  code: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 19, marginVertical: 10 },
});
