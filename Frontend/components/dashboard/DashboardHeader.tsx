import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bell, Search, User } from '../../constants/icons';

interface DashboardHeaderProps {
  role: 'admin' | 'partner';
  title?: string;
  userName?: string;
  userRoleLabel?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function DashboardHeader({
  role,
  title,
  userName = role === 'admin' ? 'Administrator' : 'Property Manager',
  userRoleLabel = role === 'admin' ? 'Hệ thống Admin' : 'Chủ cơ sở lưu trú',
  onSearch,
  searchPlaceholder = role === 'admin' ? 'Tìm kiếm người dùng, đơn đặt, báo cáo...' : 'Tìm kiếm phòng, đơn đặt phòng, đánh giá...',
}: DashboardHeaderProps) {
  const [query, setQuery] = React.useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  const isPartner = role === 'partner';

  return (
    <View style={styles.header}>
      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchIcon}>
          <Search size={18} color="#6B7280" />
        </View>
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder={searchPlaceholder}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      {/* Right Actions */}
      <View style={styles.actionsWrapper}>
        {/* Notifications */}
        <Pressable
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Thông báo"
        >
          <Bell size={20} color="#4B5563" />
          <View style={[styles.badge, { backgroundColor: isPartner ? '#EF4444' : '#DC2626' }]} />
        </Pressable>

        <View style={styles.divider} />

        {/* User Card */}
        <View style={styles.userProfile}>
          <View style={[styles.avatar, { backgroundColor: isPartner ? '#00685C' : '#4648D4' }]}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.userRole} numberOfLines={1}>{userRoleLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
    width: '100%',
  },
  searchWrapper: {
    flex: 1,
    maxWidth: 460,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 14,
    color: '#111827',
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginLeft: 'auto',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  userInfo: {
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  userRole: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});
