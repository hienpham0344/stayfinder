import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CalendarDays,
  CheckCircle2,
  Filter,
  Search,
  User,
  X,
} from '../../constants/icons';
import { ManagementBooking, stayApi } from '../../services/api';
import { useLiveState } from '../../state/LiveState';

type BookingStatusFilter = 'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const DEMO_BOOKINGS = [
  {
    id: 'SF-B01',
    guestName: 'Nguyễn Thanh Tùng',
    phone: '0901234567',
    email: 'tung.nguyen@gmail.com',
    roomName: 'Deluxe Ocean View Villa',
    propertyName: 'Sunset Luxury Villa Phu Quoc',
    checkIn: '24/11/2026',
    checkOut: '27/11/2026',
    guests: 2,
    nights: 3,
    totalPrice: 8750000,
    status: 'CONFIRMED',
    createdAt: 'Hôm nay, 10:15',
  },
  {
    id: 'SF-B02',
    guestName: 'Trần Minh Quang',
    phone: '0912345678',
    email: 'quang.tran@outlook.com',
    roomName: 'Superior King Suite',
    propertyName: 'Da Lat Pine Hill Retreat',
    checkIn: '25/11/2026',
    checkOut: '28/11/2026',
    guests: 2,
    nights: 3,
    totalPrice: 5200000,
    status: 'CONFIRMED',
    createdAt: 'Hôm qua, 18:30',
  },
  {
    id: 'SF-B03',
    guestName: 'Phạm Thuỳ Dương',
    phone: '0988776655',
    email: 'duong.pham@gmail.com',
    roomName: 'Family Pool Bungalow',
    propertyName: 'Sunset Luxury Villa Phu Quoc',
    checkIn: '19/11/2026',
    checkOut: '22/11/2026',
    guests: 4,
    nights: 3,
    totalPrice: 13500000,
    status: 'COMPLETED',
    createdAt: '19/11/2026',
  },
  {
    id: 'SF-B04',
    guestName: 'David Miller',
    phone: '+1 415 555 2671',
    email: 'david.miller@sf.com',
    roomName: 'Presidential Panorama Suite',
    propertyName: 'Sunset Luxury Villa Phu Quoc',
    checkIn: '15/11/2026',
    checkOut: '18/11/2026',
    guests: 3,
    nights: 3,
    totalPrice: 24000000,
    status: 'COMPLETED',
    createdAt: '14/11/2026',
  },
  {
    id: 'SF-B05',
    guestName: 'Lê Bảo Anh',
    phone: '0933221100',
    email: 'baoanh.le@yahoo.com',
    roomName: 'Standard Garden View',
    propertyName: 'An Bang Beachfront Bungalows',
    checkIn: '22/11/2026',
    checkOut: '24/11/2026',
    guests: 2,
    nights: 2,
    totalPrice: 2900000,
    status: 'CANCELLED',
    createdAt: '20/11/2026',
  },
];

export default function PartnerBookingsScreen() {
  const { token } = useLiveState();
  const [bookings, setBookings] = useState(DEMO_BOOKINGS);
  const [activeFilter, setActiveFilter] = useState<BookingStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<(typeof DEMO_BOOKINGS)[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = bookings.filter((b) => {
    const matchesFilter = activeFilter === 'ALL' || b.status === activeFilter;
    const matchesSearch =
      b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.roomName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Quản lý Đơn đặt phòng (Bookings)</Text>
          <Text style={styles.pageSubtitle}>
            Theo dõi danh sách khách lưu trú, thời gian nhận phòng và trạng thái đơn
          </Text>
        </View>
      </View>

      {/* Filter and Search Bar */}
      <View style={styles.filterBar}>
        <View style={styles.tabsRow}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'CONFIRMED', label: 'Đã xác nhận' },
            { key: 'COMPLETED', label: 'Hoàn thành' },
            { key: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tabBtn, activeFilter === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveFilter(tab.key as BookingStatusFilter)}
            >
              <Text style={[styles.tabBtnText, activeFilter === tab.key && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchWrapper}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo mã đơn, khách, phòng..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Bookings Table */}
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: 140 }]}>MÃ ĐƠN</Text>
              <Text style={[styles.th, { width: 220 }]}>KHÁCH HÀNG</Text>
              <Text style={[styles.th, { width: 230 }]}>HẠNG PHÒNG</Text>
              <Text style={[styles.th, { width: 140 }]}>CHECK-IN</Text>
              <Text style={[styles.th, { width: 140 }]}>CHECK-OUT</Text>
              <Text style={[styles.th, { width: 150 }]}>TỔNG TIỀN</Text>
              <Text style={[styles.th, { width: 140 }]}>TRẠNG THÁI</Text>
              <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>CHI TIẾT</Text>
            </View>

            {filtered.map((b) => {
              const statusStyle =
                b.status === 'CONFIRMED'
                  ? { bg: '#DCFCE7', text: '#15803D', label: 'ĐÃ XÁC NHẬN' }
                  : b.status === 'COMPLETED'
                  ? { bg: '#EFF6FF', text: '#1D4ED8', label: 'HOÀN THÀNH' }
                  : { bg: '#FEE2E2', text: '#B91C1C', label: 'ĐÃ HỦY' };

              return (
                <View key={b.id} style={styles.tableRow}>
                  <View style={[styles.td, { width: 140 }]}>
                    <Text style={styles.bookingIdText}>{b.id}</Text>
                    <Text style={styles.timeText}>{b.createdAt}</Text>
                  </View>

                  <View style={[styles.td, { width: 220 }]}>
                    <Text style={styles.guestNameText}>{b.guestName}</Text>
                    <Text style={styles.contactText}>{b.phone}</Text>
                  </View>

                  <View style={[styles.td, { width: 230 }]}>
                    <Text style={styles.roomText}>{b.roomName}</Text>
                    <Text style={styles.propText}>{b.propertyName}</Text>
                  </View>

                  <View style={[styles.td, { width: 140 }]}>
                    <Text style={styles.dateText}>{b.checkIn}</Text>
                  </View>

                  <View style={[styles.td, { width: 140 }]}>
                    <Text style={styles.dateText}>{b.checkOut}</Text>
                  </View>

                  <View style={[styles.td, { width: 150 }]}>
                    <Text style={styles.amountText}>{b.totalPrice.toLocaleString('vi-VN')} VND</Text>
                    <Text style={styles.nightsText}>{b.nights} đêm · {b.guests} khách</Text>
                  </View>

                  <View style={[styles.td, { width: 140 }]}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.td, { width: 110, alignItems: 'flex-end' }]}>
                    <Pressable
                      style={styles.viewBtn}
                      onPress={() => {
                        setSelectedBooking(b);
                        setModalVisible(true);
                      }}
                    >
                      <Text style={styles.viewBtnText}>Xem</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Modal Booking Detail */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết Đơn đặt phòng #{selectedBooking?.id}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            {selectedBooking && (
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Khách hàng:</Text>
                  <Text style={styles.infoVal}>{selectedBooking.guestName} ({selectedBooking.phone})</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email liên hệ:</Text>
                  <Text style={styles.infoVal}>{selectedBooking.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Chỗ nghỉ:</Text>
                  <Text style={styles.infoVal}>{selectedBooking.propertyName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Hạng phòng:</Text>
                  <Text style={styles.infoVal}>{selectedBooking.roomName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Thời gian:</Text>
                  <Text style={styles.infoVal}>
                    {selectedBooking.checkIn} ➔ {selectedBooking.checkOut} ({selectedBooking.nights} đêm)
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số lượng khách:</Text>
                  <Text style={styles.infoVal}>{selectedBooking.guests} người</Text>
                </View>
                <View style={[styles.infoRow, { paddingTop: 12, borderTopWidth: 1, borderColor: '#F1F5F9' }]}>
                  <Text style={[styles.infoLabel, { fontSize: 15, fontWeight: '700' }]}>Tổng tiền:</Text>
                  <Text style={[styles.infoVal, { fontSize: 16, fontWeight: '800', color: '#00685C' }]}>
                    {selectedBooking.totalPrice.toLocaleString('vi-VN')} VND
                  </Text>
                </View>
              </View>
            )}

            <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Đóng</Text>
            </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 3,
    borderRadius: 8,
    gap: 4,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    minWidth: 260,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  table: {
    minWidth: 1260,
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
  bookingIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  guestNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  contactText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  roomText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  propText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  dateText: {
    fontSize: 13,
    color: '#475569',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00685C',
  },
  nightsText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    gap: 10,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  closeBtn: {
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});
