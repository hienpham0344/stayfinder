import React, { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronRight, Heart, MapPin, Star, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { ImageCarousel } from './ImageCarousel';
import { AmenityGrid } from './AmenityGrid';
import { PriceFooter } from './PriceFooter';
import { ComparePricesModal } from './ComparePricesModal';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

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
        <Svg pointerEvents="none" width="100%" height={56 + insets.top} style={styles.heroGradient}><Defs><LinearGradient id="heroShade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#000" stopOpacity={0.5} /><Stop offset="1" stopColor="#000" stopOpacity={0} /></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#heroShade)" /></Svg>
        <View style={[styles.heroActions, { top: insets.top + 4 }]}>
          <Pressable style={[styles.roundAction, styles.backAction]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Quay lại"><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/property-back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.bgWhite} />} /></Pressable>
          <Pressable style={styles.roundAction} onPress={() => setLiked(!liked)} accessibilityRole="button" accessibilityLabel={liked ? 'Bỏ lưu tạm' : 'Lưu tạm chỗ ở'}>{liked ? <Heart size={20} color={COLORS.inkSoft} fill={COLORS.actionTeal} /> : <Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/property-heart.svg')} width={20} height={18.35} nativeFallback={<Heart size={20} color={COLORS.inkSoft} fill="none" />} />}</Pressable>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}><Text style={styles.title} numberOfLines={1}>{stay.title}</Text><View style={styles.ratingPill}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/property-rating.svg')} width={11.6667} height={11.0833} nativeFallback={<Star size={12} color={COLORS.accentOrange} fill={COLORS.accentOrange} />} /><Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text></View></View>
        <View style={styles.locationLine}><Se121SharedAsset source={require('../../assets/figma/exhaust-review-completion/property-location.svg')} width={12} height={15} nativeFallback={<MapPin size={15} color={COLORS.textSecondary} />} /><Text style={styles.locationText} numberOfLines={2}>{stay.location.city}, {stay.location.province}</Text></View>

        <AmenityGrid amenities={stay.amenities} />

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Về chỗ ở này</Text>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>{stay.description}</Text>
          <Pressable onPress={() => setExpanded(!expanded)} style={styles.readMore}><Text style={styles.readMoreText}>{expanded ? 'Thu gọn' : 'Đọc thêm'}</Text></Pressable>
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Vị trí</Text>
          <View style={styles.mapCard}>
            <Image source={require('./property-location-map.jpeg')} style={styles.mapImage} resizeMode="cover" />
            <View style={styles.mapPinHalo}><View style={styles.mapPin}><MapPin size={16} color={COLORS.bgWhite} /></View></View>
          </View>
          <Text style={styles.mapAddress} numberOfLines={2}>{stay.location.address}</Text>
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
  heroGradient: { position: 'absolute', top: 0, left: 0 },
  roundAction: { width: 48, height: 48, borderRadius: RADII.full, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#D1E0DB', alignItems: 'center', justifyContent: 'center', shadowColor: '#0A2E26', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 2.5, elevation: 4 },
  backAction: { width: 40, height: 40, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0, shadowOpacity: 0, elevation: 0, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(6px)' } as ViewStyle : {}) },
  body: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  ratingPill: { height: 28, paddingHorizontal: 8, borderRadius: RADII.full, backgroundColor: COLORS.bgSecondary, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
  locationText: { flex: 1, color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  aboutSection: { marginTop: SPACING.section, gap: 8 },
  locationSection: { marginTop: SPACING.section, gap: 8 },
  section: { paddingTop: SPACING.section },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  description: { color: '#3E4946', fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 26 },
  readMore: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  readMoreText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  mapCard: { height: 160, borderRadius: RADII.xl, overflow: 'hidden', backgroundColor: COLORS.bgSecondary, ...SHADOWS.cardSoft },
  mapImage: { width: '100%', height: '100%' },
  mapPinHalo: { position: 'absolute', left: '50%', top: '50%', width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: RADII.full, backgroundColor: 'rgba(0, 95, 85, 0.2)', alignItems: 'center', justifyContent: 'center' },
  mapPin: { width: 20, height: 20, borderRadius: RADII.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  mapAddress: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 18 },
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
