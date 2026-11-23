import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Building2,
  Check,
  CheckCircle2,
  Eye,
  MessageSquare,
  ShieldAlert,
  Star,
  Users,
  X,
} from '../../constants/icons';
import {
  ManagementAccommodation,
  ManagementApplication,
  stayApi,
} from '../../services/api';
import { useLiveState } from '../../state/LiveState';

type ModerationTab = 'PROPERTIES' | 'APPLICATIONS' | 'REVIEWS';

const DEMO_PROPERTIES = [
  {
    id: 'prop-1',
    name: 'Sapa Cloud View Eco Lodge',
    address: 'Thung lũng Mường Hoa, Sa Pa, Lào Cai',
    description: 'Khu nghỉ dưỡng sinh thái nhìn ra thung lũng mây, 12 phòng khép kín cao cấp.',
    basePrice: 1850000,
    partnerName: 'Công ty Du lịch Tây Bắc Xanh',
    createdAt: 'Hôm nay, 08:30',
    version: 1,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prop-2',
    name: 'Phu Quoc Sunset Coral Villa',
    address: 'Bãi Trường, Dương Tơ, TP. Phú Quốc',
    description: 'Biệt thự sát biển có hồ bơi riêng, tiêu chuẩn 5 sao view hoàng hôn tuyệt đẹp.',
    basePrice: 4200000,
    partnerName: 'Lê Hoàng Nam (Sunset Villas)',
    createdAt: 'Hôm qua, 15:45',
    version: 1,
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
  },
];

const DEMO_APPLICATIONS = [
  {
    id: 'app-1',
    businessName: 'An Nhiên Retreat & Homestay',
    userName: 'Hoàng Minh Đức',
    email: 'duc.hoang@annhien.vn',
    description: 'Chuỗi 5 homestay phong cách Mộc tại Tam Đảo và Ba Vì, hoạt động trên 3 năm.',
    createdAt: '22/11/2026',
    version: 1,
  },
  {
    id: 'app-2',
    businessName: 'Mekong Riverside Oasis',
    userName: 'Trần Cẩm Nhung',
    email: 'nhung.tran@mekongoasis.com',
    description: 'Khu lưu trú ven sông Cần Thơ phục vụ khách du lịch sinh thái và trải nghiệm miệt vườn.',
    createdAt: '21/11/2026',
    version: 1,
  },
];

const DEMO_REVIEWS = [
  {
    id: 'rev-1',
    userName: 'Ẩn danh',
    accommodationName: 'Villa Azure Nha Trang',
    rating: 1,
    comment: 'Chỗ này lừa đảo không có thật, gọi điện vào số hotline toàn link quảng cáo web cá cược!!!',
    reportReason: 'Nội dung bôi nhọ, nghi vấn spam liên kết xấu',
    createdAt: '20 phút trước',
    version: 1,
  },
  {
    id: 'rev-2',
    userName: 'User9981',
    accommodationName: 'Le Marais Loft',
    rating: 1,
    comment: 'Khách sạn rất tệ, nhân viên thô lỗ xúc phạm tôi.',
    reportReason: 'Chủ cơ sở khiếu nại khách chưa từng đặt phòng thực tế tại đây',
    createdAt: '3 giờ trước',
    version: 1,
  },
];

export default function ModerationQueueScreen() {
  const { token } = useLiveState();
  const [activeTab, setActiveTab] = useState<ModerationTab>('PROPERTIES');
  const [properties, setProperties] = useState(DEMO_PROPERTIES);
  const [applications, setApplications] = useState(DEMO_APPLICATIONS);
  const [reviews, setReviews] = useState(DEMO_REVIEWS);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleDecideProperty = async (id: string, approved: boolean, version: number) => {
    if (token) {
      try {
        await stayApi.adminModerateAccommodation(
          id,
          {
            status: approved ? 'ACTIVE' : 'REJECTED',
            reason: approved ? 'Đạt tiêu chuẩn chất lượng StayFinder' : 'Chưa đáp ứng tiêu chuẩn hình ảnh/thông tin',
            version,
          },
          token
        );
      } catch {
        // Fallback demo
      }
    }
    setProperties((prev) => prev.filter((p) => p.id !== id));
    showToast(approved ? 'Đã duyệt cơ sở lưu trú thành công!' : 'Đã từ chối chỗ nghỉ.');
  };

  const handleDecideApplication = async (id: string, approved: boolean, version: number) => {
    if (token) {
      try {
        await stayApi.adminDecideApplication(
          id,
          {
            approved,
            reason: approved ? 'Hồ sơ hợp lệ, đủ điều kiện làm Đối tác' : 'Hồ sơ chưa đạt yêu cầu pháp lý',
            version,
          },
          token
        );
      } catch {
        // Fallback demo
      }
    }
    setApplications((prev) => prev.filter((a) => a.id !== id));
    showToast(approved ? 'Đã phê duyệt tài khoản thành Đối tác (Partner)!' : 'Đã từ chối đơn đăng ký.');
  };

  const handleModerateReview = async (id: string, hide: boolean, version: number) => {
    if (token) {
      try {
        await stayApi.adminModerateReview(
          id,
          {
            hidden: hide,
            reason: hide ? 'Vi phạm tiêu chuẩn cộng đồng' : 'Nội dung hợp lệ được giữ lại',
            version,
          },
          token
        );
      } catch {
        // Fallback demo
      }
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showToast(hide ? 'Đã ẩn đánh giá bị báo cáo!' : 'Đã giữ lại đánh giá.');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Hàng đợi Kiểm duyệt (Moderation Queue)</Text>
          <Text style={styles.pageSubtitle}>
            Phê duyệt chỗ nghỉ mới, xét duyệt đơn đăng ký đối tác và giải quyết khiếu nại đánh giá
          </Text>
        </View>

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'PROPERTIES' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PROPERTIES')}
        >
          <Building2 size={16} color={activeTab === 'PROPERTIES' ? '#4648D4' : '#6B7280'} />
          <Text style={[styles.tabBtnText, activeTab === 'PROPERTIES' && styles.tabBtnTextActive]}>
            Chỗ nghỉ chờ duyệt ({properties.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'APPLICATIONS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('APPLICATIONS')}
        >
          <Users size={16} color={activeTab === 'APPLICATIONS' ? '#4648D4' : '#6B7280'} />
          <Text style={[styles.tabBtnText, activeTab === 'APPLICATIONS' && styles.tabBtnTextActive]}>
            Đơn đăng ký Đối tác ({applications.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'REVIEWS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('REVIEWS')}
        >
          <MessageSquare size={16} color={activeTab === 'REVIEWS' ? '#4648D4' : '#6B7280'} />
          <Text style={[styles.tabBtnText, activeTab === 'REVIEWS' && styles.tabBtnTextActive]}>
            Báo cáo Đánh giá ({reviews.length})
          </Text>
        </Pressable>
      </View>

      {/* Tab 1: Properties Queue */}
      {activeTab === 'PROPERTIES' && (
        <View style={styles.cardsContainer}>
          {properties.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle2 size={40} color="#10B981" />
              <Text style={styles.emptyTitle}>Hàng đợi sạch sẽ!</Text>
              <Text style={styles.emptyDesc}>Hiện không có cơ sở lưu trú nào đang chờ kiểm duyệt.</Text>
            </View>
          ) : (
            properties.map((item) => (
              <View key={item.id} style={styles.modCard}>
                <Image source={{ uri: item.image }} style={styles.propertyImg} />
                <View style={styles.modCardBody}>
                  <View style={styles.badgeRow}>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>CHỜ PHÊ DUYỆT</Text>
                    </View>
                    <Text style={styles.timeText}>{item.createdAt}</Text>
                  </View>

                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemAddress}>{item.address}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.partnerText}>Chủ cơ sở: <Text style={{ fontWeight: '600', color: '#111827' }}>{item.partnerName}</Text></Text>
                    <Text style={styles.priceText}>{item.basePrice.toLocaleString('vi-VN')} VND / đêm</Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.approveBtn}
                      onPress={() => void handleDecideProperty(item.id, true, item.version)}
                    >
                      <Check size={16} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Phê duyệt</Text>
                    </Pressable>

                    <Pressable
                      style={styles.rejectBtn}
                      onPress={() => void handleDecideProperty(item.id, false, item.version)}
                    >
                      <X size={16} color="#EF4444" />
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Tab 2: Partner Applications Queue */}
      {activeTab === 'APPLICATIONS' && (
        <View style={styles.cardsContainer}>
          {applications.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle2 size={40} color="#10B981" />
              <Text style={styles.emptyTitle}>Không có đơn mới!</Text>
              <Text style={styles.emptyDesc}>Tất cả hồ sơ đăng ký đối tác đã được giải quyết.</Text>
            </View>
          ) : (
            applications.map((item) => (
              <View key={item.id} style={styles.appCard}>
                <View style={styles.appCardHeader}>
                  <View>
                    <Text style={styles.itemTitle}>{item.businessName}</Text>
                    <Text style={styles.itemAddress}>Người đại diện: {item.userName} ({item.email})</Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>HỒ SƠ MỚI</Text>
                  </View>
                </View>

                <View style={styles.descBox}>
                  <Text style={styles.descBoxLabel}>Mô tả năng lực & quy mô:</Text>
                  <Text style={styles.descBoxText}>{item.description}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.approveBtn}
                    onPress={() => void handleDecideApplication(item.id, true, item.version)}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.approveBtnText}>Duyệt làm Đối tác</Text>
                  </Pressable>

                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => void handleDecideApplication(item.id, false, item.version)}
                  >
                    <X size={16} color="#EF4444" />
                    <Text style={styles.rejectBtnText}>Từ chối hồ sơ</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Tab 3: Reviews Reports Queue */}
      {activeTab === 'REVIEWS' && (
        <View style={styles.cardsContainer}>
          {reviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle2 size={40} color="#10B981" />
              <Text style={styles.emptyTitle}>Sạch báo cáo!</Text>
              <Text style={styles.emptyDesc}>Không còn đánh giá nào đang trong diện nghi vấn vi phạm.</Text>
            </View>
          ) : (
            reviews.map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.badgeRow}>
                  <View style={[styles.pendingBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.pendingBadgeText, { color: '#B91C1C' }]}>BÁO CÁO VI PHẠM</Text>
                  </View>
                  <Text style={styles.timeText}>{item.createdAt}</Text>
                </View>

                <View style={styles.reviewInfoRow}>
                  <Text style={styles.reviewAccomName}>{item.accommodationName}</Text>
                  <View style={styles.starRow}>
                    <Star size={14} color="#F59E0B" />
                    <Text style={styles.starText}>{item.rating} sao</Text>
                  </View>
                </View>

                <View style={styles.commentBox}>
                  <Text style={styles.commentAuthor}>Người đánh giá: {item.userName}</Text>
                  <Text style={styles.commentContent}>"{item.comment}"</Text>
                </View>

                <View style={styles.reasonReportBox}>
                  <ShieldAlert size={15} color="#DC2626" />
                  <Text style={styles.reasonReportText}>Lý do báo cáo: {item.reportReason}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.rejectBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                    onPress={() => void handleModerateReview(item.id, true, item.version)}
                  >
                    <X size={16} color="#DC2626" />
                    <Text style={[styles.rejectBtnText, { color: '#DC2626' }]}>Ẩn đánh giá này</Text>
                  </Pressable>

                  <Pressable
                    style={styles.approveBtn}
                    onPress={() => void handleModerateReview(item.id, false, item.version)}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.approveBtnText}>Bỏ qua (Giữ lại)</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBtnActive: {
    borderColor: '#4648D4',
    backgroundColor: '#EEF2FF',
  },
  tabBtnText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#4648D4',
  },
  cardsContainer: {
    gap: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  modCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  propertyImg: {
    width: 260,
    minHeight: 180,
    backgroundColor: '#E5E7EB',
  },
  modCardBody: {
    flex: 1,
    minWidth: 320,
    padding: 20,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  itemAddress: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemDesc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  partnerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4648D4',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rejectBtnText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    gap: 12,
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  descBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  descBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  descBoxText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    gap: 12,
  },
  reviewInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewAccomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  starText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  commentBox: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 8,
    gap: 6,
  },
  commentAuthor: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  commentContent: {
    fontSize: 14,
    color: '#1F2937',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  reasonReportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 6,
  },
  reasonReportText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
});
