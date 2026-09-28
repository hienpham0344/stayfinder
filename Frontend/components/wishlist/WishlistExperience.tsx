import React, { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Heart, MoreVertical, Star } from 'lucide-react-native';
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
  return <Pressable style={styles.card} onPress={() => router.push(`/room/${stay.id}` as never)} accessibilityLabel={`Xem ${stay.title}`}>
    <View style={styles.imageWrap}>
      <Image source={{ uri: stay.images[0] }} style={styles.image} resizeMode="cover" />
      <Pressable style={styles.heartButton} onPress={(event) => { event.stopPropagation(); onRemove(); }} accessibilityLabel={`Bỏ lưu tạm ${stay.title}`}><Heart size={23} fill={COLORS.accentRed} color={COLORS.accentRed} /></Pressable>
      <View style={styles.ratingBadge}><Star size={15} color={COLORS.starGold} fill={COLORS.starGold} /><Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text></View>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle} numberOfLines={2}>{stay.title}</Text>
      <Text style={styles.city}>{stay.location.city}, {stay.location.province}</Text>
      <Text style={styles.price}>{new Intl.NumberFormat('vi-VN').format(stay.pricePerNight)}đ</Text>
      <Text style={styles.night}>/ đêm</Text>
    </View>
  </Pressable>;
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
      {TABS.map((item) => <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.tab, tab === item.key && styles.activeTab]} accessibilityState={{ selected: tab === item.key }}><Text style={[styles.tabText, tab === item.key && styles.activeTabText]}>{item.title}</Text></Pressable>)}
    </ScrollView>
    <FlatList data={stays} keyExtractor={(item) => item.id} renderItem={({ item }) => <WishlistCard stay={item} onRemove={() => setSavedIds((previous) => previous.filter((id) => id !== item.id))} />} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.empty}><Heart size={40} color={COLORS.primary} /><Text style={styles.emptyTitle}>{tab === 'all' ? 'Chưa có chỗ ở đã lưu' : tab === 'upcoming' ? 'Chưa có chuyến đi sắp tới' : 'Chưa có điểm đến mơ ước'}</Text><Text style={styles.emptyText}>{tab === 'all' ? 'Khôi phục danh sách mẫu hoặc tìm một chỗ ở bạn thích.' : 'Danh sách mẫu chưa có chỗ ở trong nhóm này.'}</Text>{tab === 'all' && <Button title="Khôi phục danh sách mẫu" onPress={() => setSavedIds(INITIAL_IDS)} size="lg" style={styles.restore} />}</View>} />
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
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 23, letterSpacing: -0.24 },
  tabsScroll: { flexGrow: 0, maxHeight: 68 },
  tabs: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, gap: 8, alignItems: 'center' },
  tab: { minHeight: 40, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.borderSage, borderRadius: RADII.full, justifyContent: 'center', backgroundColor: COLORS.bgMain },
  activeTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  activeTabText: { color: COLORS.bgWhite },
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 96, flexGrow: 1 },
  card: { marginBottom: 16, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSubtle },
  imageWrap: { height: 192 },
  image: { width: '100%', height: '100%' },
  heartButton: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center' },
  ratingBadge: { position: 'absolute', bottom: 14, left: 14, height: 28, borderRadius: RADII.sm, backgroundColor: COLORS.bgWhite, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 12 },
  cardBody: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 },
  cardTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 19, lineHeight: 26 },
  city: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, marginTop: 8 },
  price: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, marginTop: 16 },
  night: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  empty: { marginTop: 80, padding: 24, alignItems: 'center', gap: 12, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  emptyTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18, textAlign: 'center' },
  emptyText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, textAlign: 'center' },
  restore: { marginTop: 8, alignSelf: 'stretch' },
  infoText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, marginBottom: 20 },
});
