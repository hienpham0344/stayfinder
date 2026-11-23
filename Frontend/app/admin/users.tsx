import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CheckCircle2,
  Filter,
  Lock,
  Search,
  ShieldCheck,
  Unlock,
  User,
  Users,
} from '../../constants/icons';
import { ManagementAccount, stayApi } from '../../services/api';
import { useLiveState } from '../../state/LiveState';

type TabType = 'ALL' | 'CUSTOMER' | 'PARTNER' | 'ADMIN';

const DEMO_USERS: ManagementAccount[] = [
  {
    id: 'u-1',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@gmail.com',
    phone: '0901234567',
    role: 'CUSTOMER',
    enabled: true,
    version: 1,
  },
  {
    id: 'u-2',
    fullName: 'Lê Hoàng Nam (Sunset Villas)',
    email: 'nam.le@sunsetvillas.vn',
    phone: '0912345678',
    role: 'PARTNER',
    enabled: true,
    version: 1,
  },
  {
    id: 'u-3',
    fullName: 'Trần Thị Thu Thảo',
    email: 'thao.tran@stayfinder.admin',
    phone: '0987654321',
    role: 'ADMIN',
    enabled: true,
    version: 1,
  },
  {
    id: 'u-4',
    fullName: 'Phạm Minh Tuấn (Da Lat Cloud)',
    email: 'tuan.pm@cloudretreat.com',
    phone: '0933445566',
    role: 'PARTNER',
    enabled: true,
    version: 2,
  },
  {
    id: 'u-5',
    fullName: 'Đỗ Hải Đăng',
    email: 'dang.dohai@spammer.org',
    phone: '0944556677',
    role: 'CUSTOMER',
    enabled: false,
    version: 3,
  },
];

export default function UsersManagementScreen() {
  const { token } = useLiveState();
  const [users, setUsers] = useState<ManagementAccount[]>(DEMO_USERS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagementAccount | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetRole, setTargetRole] = useState<'CUSTOMER' | 'PARTNER' | 'ADMIN'>('CUSTOMER');
  const [reason, setReason] = useState('Cập nhật quyền quản trị theo yêu cầu');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchUsers = () => {
    if (!token) return;
    setLoading(true);
    stayApi
      .adminUsers(token, 0, activeTab === 'ALL' ? undefined : activeTab)
      .then((page) => {
        if (page && page.content) {
          setUsers(page.content);
        }
      })
      .catch(() => {
        // Fallback to demo users
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [token, activeTab]);

  const filteredUsers = users.filter((u) => {
    const matchesTab = activeTab === 'ALL' || u.role === activeTab;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleToggleLock = async (user: ManagementAccount) => {
    const newStatus = !user.enabled;
    const actionName = newStatus ? 'mở khóa' : 'khóa';

    if (token) {
      try {
        await stayApi.adminUpdateUser(
          user.id,
          {
            role: user.role,
            enabled: newStatus,
            reason: `${actionName} tài khoản qua trang quản trị`,
            version: user.version,
          },
          token
        );
        setStatusMessage(`Đã ${actionName} tài khoản ${user.fullName}`);
        fetchUsers();
      } catch (err) {
        setStatusMessage(err instanceof Error ? err.message : `Không thể ${actionName} tài khoản.`);
      }
    } else {
      // Offline / Demo state update
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, enabled: newStatus } : item))
      );
      setStatusMessage(`[Demo] Đã ${actionName} tài khoản ${user.fullName}`);
    }
  };

  const handleOpenRoleModal = (user: ManagementAccount) => {
    setSelectedUser(user);
    setTargetRole(user.role);
    setReason('Điều chỉnh vai trò tài khoản theo phân công');
    setModalVisible(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      if (token) {
        await stayApi.adminUpdateUser(
          selectedUser.id,
          {
            role: targetRole,
            enabled: selectedUser.enabled,
            reason: reason.trim() || 'Thay đổi vai trò người dùng',
            version: selectedUser.version,
          },
          token
        );
        fetchUsers();
      } else {
        setUsers((prev) =>
          prev.map((item) => (item.id === selectedUser.id ? { ...item, role: targetRole } : item))
        );
      }
      setStatusMessage(`Đã đổi vai trò của ${selectedUser.fullName} thành ${targetRole}`);
      setModalVisible(false);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Lỗi khi cập nhật vai trò');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Quản lý Người dùng & Đối tác</Text>
          <Text style={styles.pageSubtitle}>
            Xem danh sách tài khoản, phân quyền vai trò và quản lý trạng thái hoạt động
          </Text>
        </View>

        {statusMessage ? (
          <View style={styles.statusToast}>
            <Text style={styles.statusToastText}>{statusMessage}</Text>
          </View>
        ) : null}
      </View>

      {/* Filter Tabs & Search Bar */}
      <View style={styles.filterBar}>
        <View style={styles.tabsRow}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'CUSTOMER', label: 'Khách hàng' },
            { key: 'PARTNER', label: 'Đối tác' },
            { key: 'ADMIN', label: 'Quản trị viên' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchWrapper}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo tên hoặc email..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Users Table Card */}
      <View style={styles.tableCard}>
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color="#4648D4" />
            <Text style={styles.loadingText}>Đang tải danh sách tài khoản...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 260 }]}>NGƯỜI DÙNG</Text>
                <Text style={[styles.th, { width: 140 }]}>VAI TRÒ</Text>
                <Text style={[styles.th, { width: 140 }]}>TRẠNG THÁI</Text>
                <Text style={[styles.th, { width: 150 }]}>SỐ ĐIỆN THOẠI</Text>
                <Text style={[styles.th, { width: 220, textAlign: 'right' }]}>THAO TÁC</Text>
              </View>

              {/* Table Body */}
              {filteredUsers.length === 0 ? (
                <View style={styles.emptyWrapper}>
                  <Text style={styles.emptyText}>Không tìm thấy tài khoản phù hợp.</Text>
                </View>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadgeColor =
                    u.role === 'ADMIN'
                      ? { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' }
                      : u.role === 'PARTNER'
                      ? { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' }
                      : { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };

                  return (
                    <View key={u.id} style={styles.tableRow}>
                      {/* User Info */}
                      <View style={[styles.td, { width: 260, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                        <View style={[styles.tableAvatar, { backgroundColor: roleBadgeColor.text }]}>
                          <Text style={styles.tableAvatarText}>
                            {u.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.userNameText}>{u.fullName}</Text>
                          <Text style={styles.userEmailText}>{u.email}</Text>
                        </View>
                      </View>

                      {/* Role */}
                      <View style={[styles.td, { width: 140 }]}>
                        <View
                          style={[
                            styles.roleBadge,
                            {
                              backgroundColor: roleBadgeColor.bg,
                              borderColor: roleBadgeColor.border,
                            },
                          ]}
                        >
                          <Text style={[styles.roleBadgeText, { color: roleBadgeColor.text }]}>
                            {u.role}
                          </Text>
                        </View>
                      </View>

                      {/* Status */}
                      <View style={[styles.td, { width: 140 }]}>
                        <View
                          style={[
                            styles.statusBadge,
                            u.enabled ? styles.statusActive : styles.statusLocked,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              u.enabled ? styles.statusActiveText : styles.statusLockedText,
                            ]}
                          >
                            {u.enabled ? 'HOẠT ĐỘNG' : 'BỊ KHÓA'}
                          </Text>
                        </View>
                      </View>

                      {/* Phone */}
                      <View style={[styles.td, { width: 150 }]}>
                        <Text style={styles.userPhoneText}>{u.phone || 'Chưa cập nhật'}</Text>
                      </View>

                      {/* Actions */}
                      <View style={[styles.td, { width: 220, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }]}>
                        <Pressable
                          style={styles.actionBtn}
                          onPress={() => handleOpenRoleModal(u)}
                        >
                          <ShieldCheck size={14} color="#4648D4" />
                          <Text style={styles.actionBtnText}>Đổi vai trò</Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.actionBtn,
                            u.enabled ? styles.lockBtn : styles.unlockBtn,
                          ]}
                          onPress={() => void handleToggleLock(u)}
                        >
                          {u.enabled ? (
                            <Lock size={14} color="#EF4444" />
                          ) : (
                            <Unlock size={14} color="#10B981" />
                          )}
                          <Text
                            style={[
                              styles.actionBtnText,
                              { color: u.enabled ? '#EF4444' : '#10B981' },
                            ]}
                          >
                            {u.enabled ? 'Khóa' : 'Mở'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Modal: Change Role */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Phân quyền vai trò người dùng</Text>
            <Text style={styles.modalSubtitle}>
              Tài khoản: {selectedUser?.fullName} ({selectedUser?.email})
            </Text>

            <View style={styles.roleSelectRow}>
              {(['CUSTOMER', 'PARTNER', 'ADMIN'] as const).map((r) => (
                <Pressable
                  key={r}
                  style={[styles.roleSelectOption, targetRole === r && styles.roleSelectOptionActive]}
                  onPress={() => setTargetRole(r)}
                >
                  <Text style={[styles.roleSelectText, targetRole === r && styles.roleSelectTextActive]}>
                    {r === 'CUSTOMER' ? 'Khách hàng' : r === 'PARTNER' ? 'Đối tác' : 'Admin'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Lý do điều chỉnh vai trò:</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Nhập lý do thay đổi vai trò..."
              style={styles.reasonInput}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelModalBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelModalBtnText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={styles.confirmModalBtn}
                onPress={() => void handleSaveRole()}
                disabled={submitting}
              >
                <Text style={styles.confirmModalBtnText}>
                  {submitting ? 'Đang lưu…' : 'Xác nhận thay đổi'}
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
  statusToast: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusToastText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
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
    backgroundColor: '#E5E7EB',
    padding: 3,
    borderRadius: 8,
    gap: 4,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    minWidth: 260,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  table: {
    minWidth: 910,
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  td: {
    justifyContent: 'center',
  },
  tableAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  userEmailText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusLocked: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusActiveText: {
    color: '#15803D',
  },
  statusLockedText: {
    color: '#B91C1C',
  },
  userPhoneText: {
    fontSize: 13,
    color: '#374151',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  lockBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  unlockBtn: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  loadingWrapper: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  emptyWrapper: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
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
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  roleSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  roleSelectOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  roleSelectOptionActive: {
    borderColor: '#4648D4',
    backgroundColor: '#EEF2FF',
  },
  roleSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  roleSelectTextActive: {
    color: '#4648D4',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#111827',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#4648D4',
  },
  confirmModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
