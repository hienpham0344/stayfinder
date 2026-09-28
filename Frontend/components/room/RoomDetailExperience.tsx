import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronRight, Heart, MapPin, Star, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { ImageCarousel } from './ImageCarousel';
import { AmenityGrid } from './AmenityGrid';
import { PriceFooter } from './PriceFooter';
import { ComparePricesModal } from './ComparePricesModal';

export function RoomDetailExperience() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [compareVisible, setCompareVisible] = useState(false);

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      <View>
        <ImageCarousel images={stay.images} onOpen={() => setGalleryVisible(true)} />
        <View style={[styles.heroActions, { top: insets.top + 8 }]}>
          <Pressable style={styles.roundAction} onPress={() => router.back()} accessibilityLabel="Quay lại"><ArrowLeft size={24} color={COLORS.inkSoft} /></Pressable>
          <Pressable style={styles.roundAction} onPress={() => setLiked(!liked)} accessibilityLabel={liked ? 'Bỏ lưu tạm' : 'Lưu tạm chỗ ở'}><Heart size={24} color={COLORS.inkSoft} fill={liked ? COLORS.actionTeal : 'none'} /></Pressable>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}><Text style={styles.title}>{stay.title}</Text><View style={styles.ratingPill}><Star size={14} color={COLORS.accentOrange} fill={COLORS.accentOrange} /><Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text></View></View>
        <View style={styles.locationLine}><MapPin size={17} color={COLORS.inkSoft} /><Text style={styles.locationText} numberOfLines={2}>{stay.location.city}, {stay.location.province}</Text></View>
        {liked && <Text style={styles.demoNote}>Đã lưu tạm trên màn hình này.</Text>}

        <AmenityGrid amenities={stay.amenities} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Về chỗ ở này</Text>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>{stay.description}</Text>
          <Pressable onPress={() => setExpanded(!expanded)} style={styles.readMore}><Text style={styles.readMoreText}>{expanded ? 'Thu gọn' : 'Đọc thêm'}</Text></Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vị trí</Text>
          <View style={styles.infoCard}><MapPin size={22} color={COLORS.primary} /><Text style={styles.infoText}>{stay.location.address}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá của khách</Text>
          <View style={styles.reviewLine}><Star size={20} color={COLORS.accentOrange} fill={COLORS.accentOrange} /><Text style={styles.reviewRating}>{stay.rating.toFixed(1)}</Text><Text style={styles.reviewCount}>· {stay.reviewCount} đánh giá</Text></View>
          <Text style={styles.helperText}>Nội dung đánh giá chi tiết chưa có trong dữ liệu demo.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chủ chỗ ở</Text>
          <View style={styles.hostRow}><Image source={{ uri: stay.host.avatar }} style={styles.avatar} /><View><Text style={styles.hostName}>{stay.host.name}</Text><Text style={styles.helperText}>Tham gia {stay.host.joinedDate}</Text></View></View>
        </View>

        {!!stay.priceComparisons?.length && <Pressable style={styles.compareCard} onPress={() => setCompareVisible(true)} accessibilityLabel="So sánh giá"><View style={styles.compareCopy}><Text style={styles.compareTitle}>So sánh giá</Text><Text style={styles.compareSubtitle}>Xem giá tham khảo từ các đối tác</Text></View><ChevronRight size={22} color={COLORS.primary} /></Pressable>}
      </View>
    </ScrollView>
    <PriceFooter stayId={stay.id} pricePerNight={stay.pricePerNight} />
    <ComparePricesModal visible={compareVisible} onClose={() => setCompareVisible(false)} stayId={stay.id} stayTitle={stay.title} comparisons={stay.priceComparisons || []} />
    <Modal visible={galleryVisible} animationType="slide" onRequestClose={() => setGalleryVisible(false)}>
      <View style={[styles.gallery, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
        <View style={styles.galleryHeader}><Text style={styles.galleryTitle}>Ảnh chỗ ở</Text><Pressable style={styles.galleryClose} onPress={() => setGalleryVisible(false)} accessibilityLabel="Đóng thư viện ảnh"><X size={24} color={COLORS.bgWhite} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.galleryList}>{stay.images.map((uri, index) => <Image key={index} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />)}</ScrollView>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  scroll: { flexGrow: 1 },
  heroActions: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  roundAction: { width: SIZES.iconButton, height: SIZES.iconButton, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 29, lineHeight: 36, letterSpacing: -0.24 },
  ratingPill: { minHeight: 30, paddingHorizontal: 8, borderRadius: RADII.full, backgroundColor: COLORS.bgSecondary, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
  locationText: { flex: 1, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
  demoNote: { marginTop: 8, color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12 },
  section: { paddingVertical: 20 },
  sectionTitle: { marginBottom: 12, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  description: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 26 },
  readMore: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  readMoreText: { color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  infoCard: { minHeight: 76, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceSage, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { flex: 1, color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 21 },
  reviewLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reviewRating: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  reviewCount: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
  helperText: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: RADII.full },
  hostName: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  compareCard: { minHeight: 80, marginVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.borderTealSoft, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceMint, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compareCopy: { gap: 4 },
  compareTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 16 },
  compareSubtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  gallery: { flex: 1, backgroundColor: COLORS.overlayBlack },
  galleryHeader: { minHeight: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  galleryTitle: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  galleryClose: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  galleryList: { gap: 8, padding: 8 },
  galleryImage: { width: '100%', height: 220, borderRadius: RADII.md },
});
