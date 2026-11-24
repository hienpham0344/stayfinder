import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Users,
  ArrowLeft,
  BedDouble,
} from '../../constants/icons';
import { useLiveState } from '../../state/LiveState';

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  badge?: number | string;
  badgeColor?: string;
};

interface DashboardSidebarProps {
  role: 'admin' | 'partner';
  brandTitle?: string;
  items: NavItem[];
}

export function DashboardSidebar({ role, brandTitle = 'StayFinder', items }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useLiveState();
  const isAdmin = role === 'admin';

  const theme = {
    bg: isAdmin ? '#0F172A' : '#042F2E',
    border: isAdmin ? '#1E293B' : '#0F766E',
    activeBg: isAdmin ? '#4648D4' : '#00685C',
    activeText: '#FFFFFF',
    text: isAdmin ? '#94A3B8' : '#A7F3D0',
    badgeBg: isAdmin ? '#312E81' : '#115E59',
    badgeText: isAdmin ? '#A5B4FC' : '#6EE7B7',
    tagBg: isAdmin ? '#4648D4' : '#00685C',
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(tabs)/profile');
    } catch {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>{brandTitle}</Text>
          <View style={[styles.roleTag, { backgroundColor: theme.tagBg }]}>
            <Text style={styles.roleTagText}>{role.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={[styles.brandSubtitle, { color: theme.text }]}>
          {isAdmin ? 'Trung tâm Quản trị Hệ thống' : 'Cổng Thông tin Đối tác'}
        </Text>
      </View>

      {/* Nav List */}
      <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.navList}>
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/partner' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Pressable
                key={item.href}
                style={[
                  styles.navItem,
                  isActive && { backgroundColor: theme.activeBg },
                ]}
                onPress={() => router.push(item.href as never)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Icon
                  size={19}
                  color={isActive ? theme.activeText : theme.text}
                />
                <Text
                  style={[
                    styles.navItemText,
                    { color: isActive ? theme.activeText : theme.text },
                    isActive && styles.navItemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {item.badge !== undefined && (
                  <View
                    style={[
                      styles.itemBadge,
                      { backgroundColor: item.badgeColor || theme.badgeBg },
                    ]}
                  >
                    <Text style={[styles.itemBadgeText, { color: '#FFFFFF' }]}>
                      {item.badge}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer / Account & Exit */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.userInfoRow}>
          <View style={[styles.avatarMini, { backgroundColor: theme.activeBg }]}>
            <Text style={styles.avatarMiniText}>
              {(user?.fullName || (isAdmin ? 'Admin' : 'Partner')).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {user?.fullName || (isAdmin ? 'Administrator' : 'Property Partner')}
            </Text>
            <Text style={[styles.userEmailText, { color: theme.text }]} numberOfLines={1}>
              {user?.email || (isAdmin ? 'admin@stayfinder.com' : 'partner@stayfinder.com')}
            </Text>
          </View>
        </View>

        <View style={styles.footerButtons}>
          <Pressable
            style={styles.switchAppBtn}
            onPress={() => router.push('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Về ứng dụng khách hàng"
          >
            <ArrowLeft size={15} color="#94A3B8" />
            <Text style={styles.switchAppText}>Về App Khách</Text>
          </Pressable>

          <Pressable
            style={styles.logoutBtn}
            onPress={() => void handleLogout()}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất"
          >
            <LogOut size={15} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 270,
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brandContainer: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  navContainer: {
    flex: 1,
    paddingHorizontal: 14,
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  navItemTextActive: {
    fontWeight: '600',
  },
  itemBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
    gap: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  userDetails: {
    flex: 1,
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  userEmailText: {
    fontSize: 11,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderRadius: 6,
  },
  switchAppText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },
  logoutBtn: {
    width: 36,
    height: 32,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
});
