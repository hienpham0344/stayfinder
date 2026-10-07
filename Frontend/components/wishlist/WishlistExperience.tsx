import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Heart, ImageOff, MoreVertical, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetWrapper } from '../ui/BottomSheetWrapper';
import { Button } from '../ui/Button';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { Stay } from '../../types/stay';

type Tab = 'all' | 'upcoming' | 'dream';
const TABS: { key: Tab; title: string }[] = [
  { key: 'all', title: 'Đã lưu' },
  { key: 'upcoming', title: 'Chuyến đi sắp tới' },
  { key: 'dream', title: 'Điểm đến mơ ước' },
];
const INITIAL_IDS = MOCK_STAYS.slice(0, 2).map((stay) => stay.id);

function WishlistCard({ stay, onRemove }: { stay: Stay; onRemove: () => void }) {
  const [imageStatus, setImageStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  return <View style={styles.card}><Pressable style={styles.cardTap} onPress={() => router.push(`/room/${stay.id}` as never)} accessibilityLabel={`Xem ${stay.title}`}>
    <View style={styles.imageWrap}>
      {imageStatus !== 'ready' && <View pointerEvents="none" style={styles.imagePlaceholder} accessibilityLabel={imageStatus === 'error' ? 'Không thể tải ảnh chỗ ở' : 'Đang tải ảnh chỗ ở'}>
        {imageStatus === 'error' ? <ImageOff size={24} color={COLORS.textMuted} /> : <ActivityIndicator color={COLORS.primary} />}
      </View>}
      {imageStatus !== 'error' && <Image source={{ uri: stay.images[0] }} style={styles.image} resizeMode="cover" onLoad={() => setImageStatus('ready')} onError={() => setImageStatus('error')} />}
      <View style={styles.ratingBadge}><Star size={13} color={COLORS.starGold} fill={COLORS.starGold} /><Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text></View>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle} numberOfLines={2}>{stay.title}</Text>
      <Text style={styles.city}>{stay.location.city}, {stay.location.province}</Text>
      <View style={styles.priceBlock}>
        <Text style={styles.price}>{new Intl.NumberFormat('vi-VN').format(stay.pricePerNight)}đ</Text>
        <Text style={styles.night}>/ đêm</Text>
      </View>
    </View>
  </Pressable><Pressable hitSlop={2} style={styles.heartButton} onPress={onRemove} accessibilityLabel={`Bỏ lưu tạm ${stay.title}`}><Heart size={20} fill={COLORS.accentRed} color={COLORS.accentRed} /></Pressable></View>;
}

export function WishlistExperience() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('all');
  const [savedIds, setSavedIds] = useState(INITIAL_IDS);
  const [infoVisible, setInfoVisible] = useState(false);
  const stays = tab === 'all' ? MOCK_STAYS.filter((stay) => savedIds.includes(stay.id)) : [];

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}>
      <Pressable style={styles.iconButton} onPress={() => router.replace('/')} accessibilityLabel="Về trang chủ"><ArrowLeft size={SIZES.icon} color={COLORS.primary} /></Pressable>
      <Text style={styles.headerTitle}>Yêu thích</Text>
      <Pressable style={styles.iconButton} onPress={() => setInfoVisible(true)} accessibilityLabel="Thông tin danh sách"><MoreVertical size={SIZES.icon} color={COLORS.primary} /></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
      {TABS.map((item) => <Pressable key={item.key} onPress={() => setTab(item.key)} style={styles.tabTouchTarget} accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }} aria-selected={tab === item.key}><View style={[styles.tab, item.key === 'all' && styles.firstTab, tab === item.key && styles.activeTab]}><Text style={[styles.tabText, tab === item.key && styles.activeTabText]}>{item.title}</Text></View></Pressable>)}
    </ScrollView>
    <FlatList data={stays} keyExtractor={(item) => item.id} renderItem={({ item }) => <WishlistCard stay={item} onRemove={() => setSavedIds((previous) => previous.filter((id) => id !== item.id))} />} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>{tab === 'all' ? 'Chưa có chỗ ở đã lưu' : tab === 'upcoming' ? 'Chưa có chuyến đi sắp tới' : 'Chưa có điểm đến mơ ước'}</Text><Text style={styles.emptyText}>{tab === 'all' ? 'Khôi phục danh sách mẫu hoặc tìm một chỗ ở bạn thích.' : 'Danh sách mẫu chưa có chỗ ở trong nhóm này.'}</Text>{tab === 'all' && <Button title="Khôi phục danh sách mẫu" onPress={() => setSavedIds(INITIAL_IDS)} size="md" style={styles.restore} />}</View>} />
    <BottomSheetWrapper visible={infoVisible} onClose={() => setInfoVisible(false)} title="Danh sách yêu thích">
      <Text style={styles.infoText}>Các mục yêu thích trong bản demo chỉ thay đổi trong phiên màn hình này và không được lưu vào tài khoản.</Text>
      <Button title="Khôi phục danh sách mẫu" onPress={() => { setSavedIds(INITIAL_IDS); setInfoVisible(false); }} size="lg" fullWidth />
    </BottomSheetWrapper>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: SPACING.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  tabsScroll: { flexGrow: 0, flexShrink: 0, height: 86 },
  tabs: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, gap: SPACING.sm, alignItems: 'center' },
  tabTouchTarget: { height: 46, minHeight: 44, justifyContent: 'flex-start' },
  tab: { height: 40, paddingHorizontal: 17, borderWidth: 1, borderColor: '#BDC9C5', borderRadius: RADII.full, justifyContent: 'center', backgroundColor: '#F5F9F8' },
  firstTab: { height: 38, paddingHorizontal: 16, borderWidth: 0 },
  activeTab: { backgroundColor: '#006056' },
  tabText: { color: '#263330', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  activeTabText: { color: COLORS.bgWhite },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 0, paddingBottom: 96, flexGrow: 1 },
  card: { height: 336, marginBottom: SPACING.lg, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  cardTap: { flex: 1 },
  imageWrap: { height: 192, backgroundColor: COLORS.bgCard },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgCard },
  heartButton: { position: 'absolute', top: SPACING.lg, right: SPACING.lg, width: 40, height: 40, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center' },
  ratingBadge: { position: 'absolute', bottom: SPACING.lg, left: SPACING.lg, height: 24, borderRadius: RADII.md, backgroundColor: COLORS.bgWhite, paddingHorizontal: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  ratingText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: TYPOGRAPHY.sizes.xs, lineHeight: TYPOGRAPHY.lineHeights.xs },
  cardBody: { height: 144, padding: SPACING.lg, gap: SPACING.sm },
  cardTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: TYPOGRAPHY.sizes.lg, lineHeight: TYPOGRAPHY.lineHeights.lg },
  city: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: TYPOGRAPHY.sizes.base, lineHeight: TYPOGRAPHY.lineHeights.base },
  priceBlock: { marginTop: SPACING.sm },
  price: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.bold, fontSize: TYPOGRAPHY.sizes.lg, lineHeight: TYPOGRAPHY.lineHeights.md },
  night: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: TYPOGRAPHY.sizes.xs, lineHeight: TYPOGRAPHY.lineHeights.xs },
  empty: { marginTop: 0, minHeight: 228, padding: SPACING.xxl, gap: SPACING.lg, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  emptyTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: TYPOGRAPHY.sizes.lg, lineHeight: 25 },
  emptyText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: TYPOGRAPHY.sizes.base, lineHeight: 22 },
  restore: { height: 48, marginTop: 0, alignSelf: 'stretch', borderRadius: RADII.promo },
  infoText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, marginBottom: 20 },
});
