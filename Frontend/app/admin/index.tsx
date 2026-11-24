import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import {
  Download,
  ShieldAlert,
  TrendingUp,
  Users,
  Building2,
  CalendarDays,
  CheckCircle2,
} from '../../constants/icons';
import { stayApi, ManagementStatistics } from '../../services/api';
import { useLiveState } from '../../state/LiveState';

export default function AdminOverviewScreen() {
  const { token } = useLiveState();
  const [stats, setStats] = useState<ManagementStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'12m' | '30d' | '7d'>('12m');

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    stayApi
      .adminStatistics(token)
      .then((res) => {
        if (active) setStats(res);
      })
      .catch(() => {
        // Fallback to high-fidelity defaults
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const totalUsersDisplay = '12.4k';
  const totalPartnersDisplay = '842';
  const totalBookingsDisplay = stats?.totalBookings ? stats.totalBookings.toLocaleString('vi-VN') : '45.2k';
  const pendingReportsDisplay = '14';

  const activities = [
    {
      id: '1',
      title: 'Đối tác mới đăng ký',
      detail: 'Sunset Villas Phú Quốc LLC',
      time: '2 phút trước',
      type: 'partner',
      icon: Building2,
      color: '#4648D4',
      bg: '#EEF2FF',
    },
    {
      id: '2',
      title: 'Người dùng mới đăng ký',
      detail: 'alex.williams@email.com',
      time: '15 phút trước',
      type: 'user',
      icon: Users,
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      id: '3',
      title: 'Đơn đặt phòng mới hoàn tất',
      detail: 'Booking #SF-98214 - 4.500.000 VND',
      time: '34 phút trước',
      type: 'booking',
      icon: CalendarDays,
      color: '#0284C7',
      bg: '#F0F9FF',
    },
    {
      id: '4',
      title: 'Báo cáo nội dung mới',
      detail: 'Đánh giá bị báo cáo spam tại Villa Azure',
      time: '1 giờ trước',
      type: 'report',
      icon: ShieldAlert,
      color: '#EF4444',
      bg: '#FEF2F2',
    },
    {
      id: '5',
      title: 'Chỗ nghỉ mới chờ duyệt',
      detail: 'Aurora Mountain Retreat (Đà Lạt)',
      time: '2 giờ trước',
      type: 'moderation',
      icon: CheckCircle2,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Page Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Tổng quan Hệ thống</Text>
          <Text style={styles.pageSubtitle}>
            Theo dõi chỉ số nền tảng, tăng trưởng người dùng và các hoạt động gần đây
          </Text>
        </View>

        <Pressable
          style={styles.exportBtn}
          onPress={() => alert('Báo cáo thống kê đã được chuẩn bị để tải về.')}
          accessibilityRole="button"
          accessibilityLabel="Xuất báo cáo"
        >
          <Download size={16} color="#FFFFFF" />
          <Text style={styles.exportBtnText}>Xuất Báo cáo</Text>
        </Pressable>
      </View>

      {/* Bento Grid: 4 Stat Cards */}
      <View style={styles.bentoGrid}>
        {/* Card 1: Total Users */}
        <View style={[styles.statCard, { borderLeftColor: '#4648D4', borderLeftWidth: 4 }]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>TỔNG NGƯỜI DÙNG</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#EEF2FF' }]}>
              <Users size={18} color="#4648D4" />
            </View>
          </View>
          <View style={styles.statValueRow}>
            <Text style={styles.statNumber}>{totalUsersDisplay}</Text>
            <View style={styles.trendBadge}>
              <TrendingUp size={12} color="#006B5F" />
              <Text style={styles.trendText}>+5% tháng này</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Total Partners */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>ĐỐI TÁC CHỦ NHÀ</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Building2 size={18} color="#059669" />
            </View>
          </View>
          <View style={styles.statValueRow}>
            <Text style={styles.statNumber}>{totalPartnersDisplay}</Text>
            <View style={styles.trendBadge}>
              <TrendingUp size={12} color="#059669" />
              <Text style={styles.trendText}>+12 đối tác mới</Text>
            </View>
          </View>
        </View>

        {/* Card 3: Platform Bookings */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>LƯỢT ĐẶT PHÒNG</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#F0F9FF' }]}>
              <CalendarDays size={18} color="#0284C7" />
            </View>
          </View>
          <View style={styles.statValueRow}>
            <Text style={styles.statNumber}>{totalBookingsDisplay}</Text>
            <View style={styles.trendBadge}>
              <TrendingUp size={12} color="#0284C7" />
              <Text style={styles.trendText}>+18% cùng kỳ</Text>
            </View>
          </View>
        </View>

        {/* Card 4: Pending Reports (Warning) */}
        <View style={[styles.statCard, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>BÁO CÁO CẦN XỬ LÝ</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEF2F2' }]}>
              <ShieldAlert size={18} color="#EF4444" />
            </View>
          </View>
          <View style={styles.statValueRow}>
            <Text style={[styles.statNumber, { color: '#BA1A1A' }]}>{pendingReportsDisplay}</Text>
            <View style={[styles.trendBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.trendText, { color: '#B91C1C' }]}>Cần xem xét</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Layout Grid: Chart (2 cols) & Recent Activity (1 col) */}
      <View style={styles.layoutGrid}>
        {/* Left: Growth Overview Line Chart */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Tăng trưởng Nền tảng (Growth Overview)</Text>
              <Text style={styles.cardSubtitle}>Xu hướng lượng người dùng & lượt đặt qua thời gian</Text>
            </View>

            <View style={styles.rangeSelector}>
              {(['12m', '30d', '7d'] as const).map((r) => (
                <Pressable
                  key={r}
                  style={[styles.rangeOption, timeRange === r && styles.rangeOptionActive]}
                  onPress={() => setTimeRange(r)}
                >
                  <Text style={[styles.rangeText, timeRange === r && styles.rangeTextActive]}>
                    {r === '12m' ? '12 Tháng' : r === '30d' ? '30 Ngày' : '7 Ngày'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* SVG Vector Mockup Chart */}
          <View style={styles.svgContainer}>
            <Svg width="100%" height={260} viewBox="0 0 600 240">
              <Defs>
                <LinearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#4648D4" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#4648D4" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Grid Lines */}
              <Path d="M 40 40 L 580 40" stroke="#F1F5F9" strokeWidth="1" />
              <Path d="M 40 90 L 580 90" stroke="#F1F5F9" strokeWidth="1" />
              <Path d="M 40 140 L 580 140" stroke="#F1F5F9" strokeWidth="1" />
              <Path d="M 40 190 L 580 190" stroke="#F1F5F9" strokeWidth="1" />

              {/* Area fill */}
              <Path
                d="M 40 170 C 100 160, 150 120, 200 135 C 250 150, 300 80, 360 95 C 420 110, 480 50, 580 35 L 580 200 L 40 200 Z"
                fill="url(#adminGradient)"
              />

              {/* Main curve */}
              <Path
                d="M 40 170 C 100 160, 150 120, 200 135 C 250 150, 300 80, 360 95 C 420 110, 480 50, 580 35"
                fill="none"
                stroke="#4648D4"
                strokeWidth="3.5"
              />

              {/* Secondary baseline curve */}
              <Path
                d="M 40 185 C 100 175, 150 160, 200 165 C 250 170, 300 140, 360 145 C 420 150, 480 120, 580 100"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="4, 4"
              />
            </Svg>

            {/* X-Axis Month Labels */}
            <View style={styles.chartXAxis}>
              {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map((m) => (
                <Text key={m} style={styles.xAxisLabel}>
                  {m}
                </Text>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4648D4' }]} />
                <Text style={styles.legendLabel}>Lượt đặt phòng</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendLabel}>Người dùng hoạt động</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right: Recent Activity Card */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Hoạt động Gần đây</Text>
              <Text style={styles.cardSubtitle}>Cập nhật theo thời gian thực</Text>
            </View>
          </View>

          <View style={styles.activityList}>
            {activities.map((item) => {
              const Icon = item.icon;
              return (
                <View key={item.id} style={styles.activityItem}>
                  <View style={[styles.activityIconWrap, { backgroundColor: item.bg }]}>
                    <Icon size={16} color={item.color} />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySub}>{item.detail}</Text>
                  </View>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
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
    gap: 24,
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
    color: '#111827',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4648D4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#4648D4',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueRow: {
    gap: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 107, 95, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#006B5F',
  },
  layoutGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
    alignItems: 'flex-start',
  },
  chartCard: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 22,
    width: '100%',
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 22,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 3,
  },
  rangeOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  rangeOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rangeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  rangeTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  svgContainer: {
    width: '100%',
    marginTop: 8,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginTop: 10,
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  activitySub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
