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
  CheckCircle2,
  Plus,
  Tag,
  TrendingUp,
} from '../../constants/icons';

const DEMO_PROMOTIONS = [
  {
    id: 'promo-1',
    code: 'SUNSET20',
    title: 'Ưu đãi Đón Hè Rực Rỡ',
    discount: 'Giảm 20%',
    minSpend: 'Đơn từ 4.000.000 VND',
    validUntil: '31/12/2026',
    usedCount: 42,
    status: 'ACTIVE',
    property: 'Sunset Luxury Villa Phu Quoc',
  },
  {
    id: 'promo-2',
    code: 'DALATREST',
    title: 'Kỳ nghỉ Trốn Khói Bụi',
    discount: 'Giảm 15%',
    minSpend: 'Đơn từ 2.000.000 VND',
    validUntil: '15/12/2026',
    usedCount: 28,
    status: 'ACTIVE',
    property: 'Da Lat Pine Hill Retreat',
  },
  {
    id: 'promo-3',
    code: 'EARLYBIRD',
    title: 'Đặt sớm Giảm sâu',
    discount: 'Giảm 500.000 VND',
    minSpend: 'Đặt trước 14 ngày',
    validUntil: '30/11/2026',
    usedCount: 65,
    status: 'ACTIVE',
    property: 'Tất cả cơ sở lưu trú',
  },
];

export default function PartnerPromotionsScreen() {
  const [promotions, setPromotions] = useState(DEMO_PROMOTIONS);
  const [modalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('15%');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleCreate = () => {
    if (!code.trim() || !title.trim()) {
      alert('Vui lòng nhập mã ưu đãi và tên chương trình.');
      return;
    }
    const newPromo = {
      id: `promo-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      discount: discount.includes('%') ? `Giảm ${discount}` : `Giảm ${discount} VND`,
      minSpend: 'Áp dụng cho mọi đơn',
      validUntil: '31/12/2026',
      usedCount: 0,
      status: 'ACTIVE',
      property: 'Sunset Luxury Villa Phu Quoc',
    };
    setPromotions((prev) => [newPromo, ...prev]);
    showToast('Đã tạo chương trình ưu đãi mới thành công!');
    setModalVisible(false);
    setCode('');
    setTitle('');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Khuyến mãi & Voucher (Promotions)</Text>
          <Text style={styles.pageSubtitle}>
            Tạo mã giảm giá và chiến dịch kích cầu du lịch để gia tăng lượt đặt phòng
          </Text>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Tạo mã khuyến mãi mới"
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Tạo Ưu đãi mới</Text>
        </Pressable>
      </View>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {/* Promotions Grid */}
      <View style={styles.grid}>
        {promotions.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.codeBadge}>
                <Tag size={14} color="#00685C" />
                <Text style={styles.codeText}>{p.code}</Text>
              </View>

              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ĐANG ÁP DỤNG</Text>
              </View>
            </View>

            <Text style={styles.promoTitle}>{p.title}</Text>
            <Text style={styles.discountHighlight}>{p.discount}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Áp dụng:</Text>
              <Text style={styles.infoVal}>{p.property}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Điều kiện:</Text>
              <Text style={styles.infoVal}>{p.minSpend}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hạn dùng:</Text>
              <Text style={styles.infoVal}>{p.validUntil}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.usageChip}>
                <TrendingUp size={13} color="#00685C" />
                <Text style={styles.usageText}>Đã dùng {p.usedCount} lượt</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Modal Create Promo */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tạo Mã Khuyến Mãi Mới</Text>
            <Text style={styles.modalSubtitle}>Kích hoạt voucher giảm giá cho khách lưu trú</Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Mã khuyến mãi (Code viết liền không dấu):</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="VD: WINTERSALE20"
                autoCapitalize="characters"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Tên chương trình ưu đãi:</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="VD: Siêu hội Giáng Sinh"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Mức giảm giá (% hoặc số tiền VND):</Text>
              <TextInput
                value={discount}
                onChangeText={setDiscount}
                placeholder="VD: 20% hoặc 500000"
                style={styles.textInput}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={handleCreate}>
                <Text style={styles.submitBtnText}>Kích hoạt mã</Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00685C',
    letterSpacing: 0.5,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  discountHighlight: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00685C',
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
    fontWeight: '500',
    color: '#334155',
  },
  cardFooter: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  usageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00685C',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
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
