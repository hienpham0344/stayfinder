import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Slot } from 'expo-router';
import { DashboardSidebar, NavItem } from '../../components/dashboard/DashboardSidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { LayoutDashboard, ShieldAlert, Users } from '../../constants/icons';

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan (Overview)', href: '/admin', icon: LayoutDashboard },
  { label: 'Người dùng & Đối tác', href: '/admin/users', icon: Users },
  { label: 'Hàng đợi kiểm duyệt', href: '/admin/moderation', icon: ShieldAlert, badge: 14, badgeColor: '#DC2626' },
];

export default function AdminLayout() {
  return (
    <View style={styles.container}>
      <DashboardSidebar role="admin" brandTitle="StayFinder" items={ADMIN_NAV_ITEMS} />
      <View style={styles.main}>
        <DashboardHeader role="admin" />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
