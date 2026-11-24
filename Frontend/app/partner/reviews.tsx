import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  MessageSquare,
  Star,
  User,
  Check,
} from '../../constants/icons';

const DEMO_REVIEWS = [
  {
    id: 'rev-1',
    guestName: 'Nguyễn Thanh Tùng',
    room: 'Deluxe Ocean View Villa',
    property: 'Sunset Luxury Villa Phu Quoc',
    rating: 5,
    date: '20/11/2026',
    comment:
      'Chuyến đi tuyệt vời! Biệt thự view biển siêu đẹp, hồ bơi riêng sạch sẽ và bạn quản gia hỗ trợ nhiệt tình từ lúc check-in đến check-out.',
    partnerReply:
      'Cảm ơn anh Tùng và gia đình đã tin tưởng lựa chọn Sunset Luxury Villa! Rất hân hạnh được đón tiếp anh trong những kỳ nghỉ tiếp theo ạ.',
  },
  {
    id: 'rev-2',
    guestName: 'Jessica Taylor',
    room: 'Superior King Suite',
    property: 'Da Lat Pine Hill Retreat',
    rating: 5,
    date: '18/11/2026',
    comment:
      'Peaceful morning mist over the pine hill, cozy fireplace and great coffee. We will definitely come back!',
    partnerReply: null,
  },
  {
    id: 'rev-3',
    guestName: 'Lê Hoàng Nam',
    room: 'Family Pool Bungalow',
    property: 'Sunset Luxury Villa Phu Quoc',
    rating: 4,
    date: '15/11/2026',
    comment:
      'Phòng ốc rộng rãi cho cả nhà, bữa sáng ngon miệng. Điểm trừ nhỏ là wifi ở khu vực sân vườn ngoài trời đôi lúc hơi chập chờn.',
    partnerReply: null,
  },
];

export default function PartnerReviewsScreen() {
  const [reviews, setReviews] = useState(DEMO_REVIEWS);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleSendReply = (id: string) => {
    const text = (replyTextMap[id] || '').trim();
    if (!text) {
      alert('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, partnerReply: text } : r))
    );
    setReplyingId(null);
    showToast('Đã gửi phản hồi đến khách hàng!');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Đánh giá từ khách (Reviews)</Text>
          <Text style={styles.pageSubtitle}>
            Lắng nghe nhận xét của khách lưu trú và gửi phản hồi để xây dựng uy tín
          </Text>
        </View>

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </View>

      {/* Review List */}
      <View style={styles.reviewList}>
        {reviews.map((item) => (
          <View key={item.id} style={styles.reviewCard}>
            {/* Header info */}
            <View style={styles.cardHeader}>
              <View style={styles.guestInfoRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.guestName.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.guestName}>{item.guestName}</Text>
                  <Text style={styles.stayMeta}>
                    {item.property} · {item.room}
                  </Text>
                </View>
              </View>

              <View style={styles.ratingWrap}>
                <View style={styles.starsRow}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      color={i < item.rating ? '#F59E0B' : '#E2E8F0'}
                    />
                  ))}
                </View>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
            </View>

            {/* Guest Comment */}
            <Text style={styles.commentText}>"{item.comment}"</Text>

            {/* Existing Partner Reply */}
            {item.partnerReply ? (
              <View style={styles.partnerReplyBox}>
                <View style={styles.replyBadge}>
                  <Text style={styles.replyBadgeText}>PHẢN HỒI CỦA CHỦ NHÀ</Text>
                </View>
                <Text style={styles.replyText}>{item.partnerReply}</Text>
              </View>
            ) : replyingId === item.id ? (
              <View style={styles.replyInputBox}>
                <TextInput
                  value={replyTextMap[item.id] || ''}
                  onChangeText={(val) =>
                    setReplyTextMap((prev) => ({ ...prev, [item.id]: val }))
                  }
                  placeholder="Nhập lời cảm ơn hoặc giải đáp thắc mắc của khách..."
                  style={styles.replyTextInput}
                  multiline
                />
                <View style={styles.replyActions}>
                  <Pressable
                    style={styles.cancelReplyBtn}
                    onPress={() => setReplyingId(null)}
                  >
                    <Text style={styles.cancelReplyBtnText}>Hủy</Text>
                  </Pressable>
                  <Pressable
                    style={styles.sendReplyBtn}
                    onPress={() => handleSendReply(item.id)}
                  >
                    <Check size={14} color="#FFFFFF" />
                    <Text style={styles.sendReplyBtnText}>Gửi phản hồi</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.openReplyBtn}
                onPress={() => setReplyingId(item.id)}
              >
                <MessageSquare size={14} color="#00685C" />
                <Text style={styles.openReplyBtnText}>Phản hồi đánh giá này</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
    gap: 20,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  toast: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toastText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  reviewList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  guestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00685C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  guestName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  stayMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ratingWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  commentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  partnerReplyBox: {
    backgroundColor: '#F0FDFA',
    borderLeftWidth: 3,
    borderLeftColor: '#00685C',
    padding: 14,
    borderRadius: 8,
    gap: 6,
  },
  replyBadge: {
    alignSelf: 'flex-start',
  },
  replyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00685C',
    letterSpacing: 0.5,
  },
  replyText: {
    fontSize: 13,
    color: '#134E4A',
    lineHeight: 20,
  },
  openReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  openReplyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00685C',
  },
  replyInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  replyTextInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelReplyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelReplyBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  sendReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00685C',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sendReplyBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
