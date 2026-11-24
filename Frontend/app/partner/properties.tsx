import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  BedDouble,
  Building2,
  CheckCircle2,
  Eye,
  MapPin,
  Plus,
} from '../../constants/icons';
import { ManagementAccommodation, stayApi } from '../../services/api';
import { useLiveState } from '../../state/LiveState';

const DEMO_PROPERTIES = [
  {
    id: 'prop-1',
    name: 'Sunset Luxury Villa Phu Quoc',
    address: 'Bãi Trường, Dương Tơ, TP. Phú Quốc, Kiên Giang',
    description: 'Biệt thự nghỉ dưỡng 5 sao sát biển, hồ bơi riêng, dịch vụ quản gia cao cấp.',
    basePrice: 4200000,
    roomsCount: 6,
    status: 'ACTIVE',
    rating: 4.9,
    reviewsCount: 128,
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
    version: 1,
  },
  {
    id: 'prop-2',
    name: 'Da Lat Pine Hill Retreat',
    address: 'Đường Khởi Nghĩa Bắc Sơn, Phường 10, TP. Đà Lạt',
    description: 'Khu villa nép mình giữa đồi thông thơ mộng với tầm nhìn thung lũng sương mù.',
    basePrice: 1950000,
    roomsCount: 10,
    status: 'ACTIVE',
    rating: 4.8,
    reviewsCount: 94,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    version: 1,
  },
  {
    id: 'prop-3',
    name: 'An Bang Beachfront Bungalows',
    address: 'Biển An Bàng, Cẩm An, Hội An, Quảng Nam',
    description: 'Bungalow gỗ mộc mạc cách bãi biển 50m, không gian yên bình cho gia đình.',
    basePrice: 1450000,
    roomsCount: 4,
    status: 'PENDING',
    rating: 4.7,
    reviewsCount: 36,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
    version: 1,
  },
];

export default function PartnerPropertiesScreen() {
  const { token } = useLiveState();
  const [properties, setProperties] = useState(DEMO_PROPERTIES);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPrice, setNewPrice] = useState('2500000');
  const [newDesc, setNewDesc] = useState('');
  const [newImg, setNewImg] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const fetchProperties = () => {
    if (!token) return;
    setLoading(true);
    stayApi
      .partnerAccommodations(token)
      .then((page) => {
        if (page && page.content && page.content.length > 0) {
          // Merge with UI display fields
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProperties();
  }, [token]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newAddress.trim() || !newPrice.trim()) {
      alert('Vui lòng điền đủ tên, địa chỉ và giá phòng.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: newName.trim(),
        address: newAddress.trim(),
        description: newDesc.trim() || 'Chỗ nghỉ tiện nghi chuẩn StayFinder.',
        basePrice: parseFloat(newPrice) || 2000000,
        typeId: '00000000-0000-0000-0000-000000000001',
        latitude: 10.2899,
        longitude: 103.984,
        imageUrls: [newImg.trim()],
        featureIds: [],
        version: 0,
      };

      if (token) {
        await stayApi.partnerCreateAccommodation(payload, token);
        fetchProperties();
      } else {
        const newEntry = {
          id: `prop-${Date.now()}`,
          name: newName.trim(),
          address: newAddress.trim(),
          description: newDesc.trim(),
          basePrice: parseFloat(newPrice) || 2000000,
          roomsCount: 1,
          status: 'PENDING',
          rating: 5.0,
          reviewsCount: 0,
          image: newImg.trim(),
          version: 1,
        };
        setProperties((prev) => [newEntry, ...prev]);
      }
      showToast('Đã thêm chỗ nghỉ mới! Đang gửi kiểm duyệt.');
      setModalVisible(false);
      setNewName('');
      setNewAddress('');
      setNewDesc('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể tạo chỗ nghỉ.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = properties.filter((p) => {
    if (activeFilter === 'ALL') return true;
    return p.status === activeFilter;
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Chỗ nghỉ của tôi (My Properties)</Text>
          <Text style={styles.pageSubtitle}>
            Quản lý danh sách biệt thự, khách sạn và tình trạng hoạt động trên hệ thống
          </Text>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Thêm chỗ nghỉ mới"
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Thêm Chỗ nghỉ</Text>
        </Pressable>
      </View>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'PENDING'] as const).map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterBtn, activeFilter === filter && styles.filterBtnActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterBtnText, activeFilter === filter && styles.filterBtnTextActive]}>
              {filter === 'ALL' ? 'Tất cả' : filter === 'ACTIVE' ? 'Đang hoạt động' : 'Chờ phê duyệt'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Properties Cards Grid */}
      <View style={styles.grid}>
        {filtered.map((item) => {
          const isPending = item.status === 'PENDING';
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isPending ? '#FEF3C7' : '#DCFCE7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isPending ? '#92400E' : '#15803D' },
                    ]}
                  >
                    {isPending ? 'CHỜ KIỂM DUYỆT' : 'ĐANG HOẠT ĐỘNG'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>

                <View style={styles.addressRow}>
                  <MapPin size={14} color="#64748B" />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <BedDouble size={14} color="#00685C" />
                    <Text style={styles.statChipText}>{item.roomsCount} hạng phòng</Text>
                  </View>
                  <Text style={styles.priceHighlight}>
                    {item.basePrice.toLocaleString('vi-VN')} VND <Text style={styles.pricePer}>/ đêm</Text>
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.manageRoomsBtn}
                    onPress={() => router.push('/partner/rooms')}
                  >
                    <BedDouble size={14} color="#00685C" />
                    <Text style={styles.manageRoomsBtnText}>Bảng giá & Phòng</Text>
                  </Pressable>

                  <Pressable
                    style={styles.detailBtn}
                    onPress={() => router.push('/partner/bookings')}
                  >
                    <Text style={styles.detailBtnText}>Xem đơn đặt</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Modal Add Property */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>Thêm Cơ sở lưu trú mới</Text>
            <Text style={styles.modalHeaderSub}>Điền thông tin ban đầu để gửi kiểm duyệt lên StayFinder</Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Tên chỗ nghỉ (Resort, Villa, Khách sạn):</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="VD: Phú Quốc Sunset Retreat"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Địa chỉ chi tiết:</Text>
              <TextInput
                value={newAddress}
                onChangeText={setNewAddress}
                placeholder="VD: Bãi Sao, An Thới, Phú Quốc"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Giá cơ bản dự kiến (VND / đêm):</Text>
              <TextInput
                value={newPrice}
                onChangeText={setNewPrice}
                placeholder="2500000"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Mô tả chỗ nghỉ:</Text>
              <TextInput
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Mô tả tiện ích, vị trí, cảnh quan..."
                style={[styles.textInput, { height: 60 }]}
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>URL hình ảnh đại diện:</Text>
              <TextInput
                value={newImg}
                onChangeText={setNewImg}
                placeholder="https://..."
                style={styles.textInput}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={styles.submitBtn}
                onPress={() => void handleCreate()}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Đang tạo…' : 'Gửi kiểm duyệt'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00685C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#00685C',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBtnActive: {
    backgroundColor: '#00685C',
    borderColor: '#00685C',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    flex: 1,
    minWidth: 320,
    maxWidth: Platform.OS === 'web' ? 440 : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  imageWrap: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  priceHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00685C',
  },
  pricePer: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  manageRoomsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 8,
    borderRadius: 6,
  },
  manageRoomsBtnText: {
    color: '#00685C',
    fontWeight: '600',
    fontSize: 12,
  },
  detailBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailBtnText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    gap: 14,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalHeaderSub: {
    fontSize: 13,
    color: '#64748B',
  },
  formGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#00685C',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
