import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { DashboardSidebar, NavItem } from '../../components/dashboard/DashboardSidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { BedDouble, Building2, CalendarDays, LayoutDashboard, MessageSquare, Tag } from '../../constants/icons';

const PARTNER_NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan (Overview)', href: '/partner', icon: LayoutDashboard },
  { label: 'Chỗ nghỉ của tôi', href: '/partner/properties', icon: Building2 },
  { label: 'Phòng & Bảng giá', href: '/partner/rooms', icon: BedDouble },
  { label: 'Đơn đặt phòng', href: '/partner/bookings', icon: CalendarDays },
  { label: 'Đánh giá từ khách', href: '/partner/reviews', icon: MessageSquare },
  { label: 'Khuyến mãi & Voucher', href: '/partner/promotions', icon: Tag },
];

export default function PartnerLayout() {
  return (
    <View style={styles.container}>
      <DashboardSidebar role="partner" brandTitle="StayFinder" items={PARTNER_NAV_ITEMS} />
      <View style={styles.main}>
        <DashboardHeader role="partner" />
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
    backgroundColor: '#F8FAFC',
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
