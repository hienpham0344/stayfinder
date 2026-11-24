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
  BedDouble,
  CheckCircle2,
  Lock,
  Plus,
  Unlock,
  Users,
} from '../../constants/icons';

const DEMO_ROOMS = [
  {
    id: 'r-1',
    name: 'Deluxe Ocean View Villa',
    property: 'Sunset Luxury Villa Phu Quoc',
    price: 4200000,
    capacity: 2,
    status: 'AVAILABLE',
    totalRooms: 4,
    availableRooms: 2,
  },
  {
    id: 'r-2',
    name: 'Family Pool Bungalow',
    property: 'Sunset Luxury Villa Phu Quoc',
    price: 6500000,
    capacity: 4,
    status: 'AVAILABLE',
    totalRooms: 2,
    availableRooms: 1,
  },
  {
    id: 'r-3',
    name: 'Superior King Suite',
    property: 'Da Lat Pine Hill Retreat',
    price: 1950000,
    capacity: 2,
    status: 'AVAILABLE',
    totalRooms: 6,
    availableRooms: 5,
  },
  {
    id: 'r-4',
    name: 'Presidential Panorama Suite',
    property: 'Sunset Luxury Villa Phu Quoc',
    price: 9800000,
    capacity: 4,
    status: 'MAINTENANCE',
    totalRooms: 1,
    availableRooms: 0,
  },
];

export default function PartnerRoomsScreen() {
  const [rooms, setRooms] = useState(DEMO_ROOMS);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('2200000');
  const [capacity, setCapacity] = useState('2');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleToggleStatus = (id: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: r.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE',
            }
          : r
      )
    );
    showToast('Đã cập nhật trạng thái phòng!');
  };

  const handleCreateRoom = () => {
    if (!name.trim() || !price.trim()) {
      alert('Vui lòng điền tên phòng và giá phòng.');
      return;
    }
    const newRoom = {
      id: `r-${Date.now()}`,
      name: name.trim(),
      property: 'Sunset Luxury Villa Phu Quoc',
      price: parseFloat(price) || 2000000,
      capacity: parseInt(capacity, 10) || 2,
      status: 'AVAILABLE',
      totalRooms: 3,
      availableRooms: 3,
    };
    setRooms((prev) => [newRoom, ...prev]);
    showToast('Đã thêm loại phòng mới thành công!');
    setModalVisible(false);
    setName('');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Phòng & Bảng giá (Rooms & Pricing)</Text>
          <Text style={styles.pageSubtitle}>
            Thiết lập giá theo đêm, sức chứa và quản lý tình trạng phòng trống
          </Text>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Thêm hạng phòng mới"
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Thêm Hạng phòng</Text>
        </Pressable>
      </View>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {/* Table Card */}
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: 260 }]}>HẠNG PHÒNG</Text>
              <Text style={[styles.th, { width: 220 }]}>THUỘC CƠ SỞ</Text>
              <Text style={[styles.th, { width: 140 }]}>SỨC CHỨA</Text>
              <Text style={[styles.th, { width: 160 }]}>GIÁ THEO ĐÊM</Text>
              <Text style={[styles.th, { width: 150 }]}>TÌNH TRẠNG</Text>
              <Text style={[styles.th, { width: 140, textAlign: 'right' }]}>THAO TÁC</Text>
            </View>

            {rooms.map((room) => {
              const isAvailable = room.status === 'AVAILABLE';
              return (
                <View key={room.id} style={styles.tableRow}>
                  <View style={[styles.td, { width: 260, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                    <View style={styles.roomIcon}>
                      <BedDouble size={18} color="#00685C" />
                    </View>
                    <View>
                      <Text style={styles.roomNameText}>{room.name}</Text>
                      <Text style={styles.roomSubText}>Tổng: {room.totalRooms} phòng</Text>
                    </View>
                  </View>

                  <View style={[styles.td, { width: 220 }]}>
                    <Text style={styles.propertyText}>{room.property}</Text>
                  </View>

                  <View style={[styles.td, { width: 140, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Users size={14} color="#64748B" />
                    <Text style={styles.capacityText}>{room.capacity} Khách</Text>
                  </View>

                  <View style={[styles.td, { width: 160 }]}>
                    <Text style={styles.priceText}>{room.price.toLocaleString('vi-VN')} VND</Text>
                  </View>

                  <View style={[styles.td, { width: 150 }]}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isAvailable ? '#DCFCE7' : '#F1F5F9' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isAvailable ? '#15803D' : '#64748B' },
                        ]}
                      >
                        {isAvailable ? 'SẴN SÀNG ĐÓN KHÁCH' : 'ĐANG BẢO TRÌ'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.td, { width: 140, alignItems: 'flex-end' }]}>
                    <Pressable
                      style={[
                        styles.toggleBtn,
                        isAvailable ? styles.toggleBtnActive : styles.toggleBtnInactive,
                      ]}
                      onPress={() => handleToggleStatus(room.id)}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          { color: isAvailable ? '#00685C' : '#64748B' },
                        ]}
                      >
                        {isAvailable ? 'Đóng phòng' : 'Mở phòng'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Modal Add Room */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>Thêm Hạng phòng mới</Text>
            <Text style={styles.modalHeaderSub}>Cấu hình giá và sức chứa cho phòng lưu trú</Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Tên hạng phòng:</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="VD: Deluxe King Ocean View"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Giá một đêm (VND):</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="2500000"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Sức chứa tối đa (số khách):</Text>
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                placeholder="2"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={handleCreateRoom}>
                <Text style={styles.submitBtnText}>Lưu hạng phòng</Text>
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
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  table: {
    minWidth: 1070,
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  td: {
    justifyContent: 'center',
  },
  roomIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  roomSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  propertyText: {
    fontSize: 13,
    color: '#475569',
  },
  capacityText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00685C',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleBtnActive: {
    borderColor: '#CCFBF1',
    backgroundColor: '#F0FDFA',
  },
  toggleBtnInactive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
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
    maxWidth: 440,
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
