import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CalendarCheck, Check, ChevronRight, Heart, Home, MapPin, Search, Star, User, Wifi } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { TopAppBar } from '../ui/TopAppBar';
import { Se121SharedAsset, componentNavigationAsset } from '../ui/Se121SharedAssets';
import { ComparePricesModal } from '../room/ComparePricesModal';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';

type Group = 'states' | 'overlays' | 'filters' | 'property' | 'shared';
type Overlay = 'dialog' | 'toast' | 'choice' | null;
type Variant = { id: string; label: string; node: string };

const GROUPS: { id: Group; label: string; variants: Variant[] }[] = [
  { id: 'states', label: 'Trạng thái', variants: [
    { id: 'search-loading', label: 'Đang tìm chỗ ở', node: '229:892' },
    { id: 'search-empty', label: 'Không có kết quả', node: '229:1087' },
    { id: 'compare-loading', label: 'Đang so sánh', node: '173:420' },
    { id: 'payment-failed', label: 'Thanh toán lỗi', node: '218:832' },
  ] },
  { id: 'overlays', label: 'Overlay', variants: [
    { id: 'dialog', label: 'Hộp thoại', node: '209:780' },
    { id: 'toast', label: 'Thông báo', node: '210:789' },
    { id: 'choice', label: 'Bảng chọn', node: '221:883' },
  ] },
  { id: 'filters', label: 'Bộ lọc', variants: [
    { id: 'checkbox-off', label: 'Ô chọn · Tắt', node: '220:837' },
    { id: 'checkbox-on', label: 'Ô chọn · Bật', node: '220:838' },
    { id: 'star-off', label: 'Sao · Tắt', node: '220:948' },
    { id: 'star-on', label: 'Sao · Bật', node: '220:949' },
    { id: 'range-full', label: 'Khoảng giá · Đầy đủ', node: '223:887' },
    { id: 'range-budget', label: 'Khoảng giá · Tiết kiệm', node: '223:888' },
    { id: 'toggle-off', label: 'Nút gạt · Tắt', node: '243:963' },
    { id: 'toggle-on', label: 'Nút gạt · Bật', node: '243:960' },
  ] },
  { id: 'property', label: 'Chỗ ở', variants: [
    { id: 'gallery', label: 'Thư viện ảnh', node: '243:1019' },
    { id: 'thumbnail', label: 'Ảnh thu nhỏ', node: '250:977' },
    { id: 'result-default', label: 'Thẻ kết quả · Mặc định', node: '282:1111' },
    { id: 'result-pressed', label: 'Thẻ kết quả · Nhấn', node: '282:1139' },
    { id: 'wishlist-all', label: 'Đã lưu · Tất cả', node: '250:931' },
    { id: 'wishlist-upcoming', label: 'Đã lưu · Sắp tới', node: '250:932' },
    { id: 'wishlist-dream', label: 'Đã lưu · Mơ ước', node: '250:940' },
  ] },
  { id: 'shared', label: 'Thành phần chung', variants: [
    { id: 'button-default', label: 'Nút chính', node: '129:6' },
    { id: 'button-pressed', label: 'Nút chính · Nhấn', node: '270:1065' },
    { id: 'sticky', label: 'Thanh hành động', node: '133:16' },
    { id: 'appbar', label: 'Thanh trên', node: '135:9' },
    ...(['Trang chủ', 'Tìm kiếm', 'Đặt phòng', 'Yêu thích', 'Tài khoản', 'Tài khoản · Nền nhẹ'] as const).map((label, index) => ({
      id: `nav-${index}`, label: `Điều hướng · ${label}`, node: ['138:29', '138:56', '138:89', '138:116', '138:143', '140:28'][index],
    })),
  ] },
];

const PROPERTIES: { name: string; image: ImageSourcePropType; source: 'mock' | 'figma' }[] = [
  { name: 'Villa Azure Retreat', image: require('../../assets/figma/gallery/villa_azure_1.jpg'), source: 'figma' },
  { name: 'The Alpine Lodge', image: { uri: MOCK_STAYS[0].images[0] }, source: 'mock' },
  { name: 'Desert Oasis Resort', image: { uri: MOCK_STAYS[1].images[0] }, source: 'mock' },
  { name: 'Urban Loft Downtown', image: { uri: MOCK_STAYS[2].images[0] }, source: 'mock' },
  { name: 'Ivy Boutique Hotel', image: { uri: MOCK_STAYS[3].images[0] }, source: 'mock' },
  { name: 'Colline Hotel', image: require('../../assets/figma/gallery/colline.jpg'), source: 'figma' },
  { name: 'Terracotta Hotel & Resort', image: require('../../assets/figma/gallery/terracotta.jpg'), source: 'figma' },
  { name: 'Villa Amala Sanctuary', image: require('../../assets/figma/gallery/villa_amala.jpg'), source: 'figma' },
  { name: 'Aurora Glass Cabin', image: require('../../assets/figma/gallery/aurora.jpg'), source: 'figma' },
  { name: 'Le Marais Loft', image: require('../../assets/figma/gallery/le_marais.jpg'), source: 'figma' },
  { name: 'Alpine Peak Lodge', image: require('../../assets/figma/gallery/alpine_peak.jpg'), source: 'figma' },
];
const RESULT_NAMES = ['Villa Azure Retreat', 'Colline Hotel', 'Terracotta Hotel & Resort'] as const;
const RESULT_NODES = [['282:1111', '282:1139'], ['282:1167', '282:1191'], ['282:1215', '282:1241']] as const;
const NAV = [
  { label: 'Trang chủ', icon: Home }, { label: 'Tìm kiếm', icon: Search },
  { label: 'Đặt phòng', icon: CalendarCheck }, { label: 'Yêu thích', icon: Heart },
  { label: 'Tài khoản', icon: User },
] as const;
const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;

function Selector({ items, selected, onSelect }: { items: { id: string; label: string }[]; selected: string; onSelect: (id: string) => void }) {
  return <ScrollView horizontal style={s.selectorScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={s.selector}>
    {items.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selected === item.id }} aria-checked={selected === item.id} onPress={() => onSelect(item.id)} style={[s.chip, selected === item.id && s.chipActive]}><Text style={[s.chipText, selected === item.id && s.chipTextActive]}>{item.label}</Text></Pressable>)}
  </ScrollView>;
}

function SkeletonRows({ compare = false }: { compare?: boolean }) {
  const opacity = useRef(new Animated.Value(0.62)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.92, duration: 550, ...(compare ? { easing: Easing.bezier(0, 0, 0.58, 1) } : {}), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.62, duration: 550, ...(compare ? { easing: Easing.bezier(0, 0, 0.58, 1) } : {}), useNativeDriver: true }),
      ...(compare ? [Animated.delay(900)] : []),
    ]));
    loop.start();
    return () => loop.stop();
  }, [compare, opacity]);
  if (compare) return <ScrollView style={s.compareRows} contentContainerStyle={s.compareRowsContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>{[0, 1, 2, 3, 4].map((index) => <View key={index} style={[s.compareCard, index === 4 && s.compareLastCard]}><Animated.View style={[s.compareImage, { opacity }]} /><Animated.View style={[s.compareName, { opacity }]} /><Animated.View style={[s.comparePrice, { opacity }]} /></View>)}</ScrollView>;
  return <View style={s.skeletonRows}>{[0, 1, 2].map((index) => <View key={index} style={s.skeletonCard}><Animated.View style={[s.skeletonImage, { opacity }]} /><View style={s.skeletonCopy}><Animated.View style={[s.skeletonLine, { opacity }]} /><Animated.View style={[s.skeletonLine, s.skeletonShort, { opacity }]} /></View></View>)}</View>;
}

function CompareLoadingPreview() {
  const [visible, setVisible] = useState(true);
  const [pricesVisible, setPricesVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const stay = MOCK_STAYS[0];
  return <>
    <View style={s.overlayLaunch}><Text style={s.cardBody}>Xem trạng thái so sánh giá mẫu trên màn hình.</Text><Button title="Mở bản xem" size="lg" onPress={() => setVisible(true)} /></View>
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => setVisible(false)}>
      <View style={s.compareModalRoot}>
        <Pressable style={s.compareBackdrop} onPress={() => setVisible(false)} accessibilityLabel="Đóng bản xem so sánh" />
        <View style={s.compareSheet}>
          <View style={s.compareHandleArea}><View style={[s.handle, { marginBottom: 0 }]} /></View>
          <View style={s.compareHead}><Text style={s.compareTitle}>Đang so sánh giá...</Text><Text style={s.compareBody}>Dữ liệu chỗ ở mẫu</Text></View>
          <SkeletonRows compare />
        </View>
        <View style={[s.compareFallback, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <Pressable style={s.compareFallbackButton} onPress={() => { setVisible(false); setPricesVisible(true); }} accessibilityRole="button"><Text style={s.compareFallbackText}>Xem giá có sẵn</Text></Pressable>
        </View>
      </View>
    </Modal>
    <ComparePricesModal visible={pricesVisible} onClose={() => setPricesVisible(false)} stayId={stay.id} stayTitle={stay.title} comparisons={stay.priceComparisons || []} />
  </>;
}

function StatePreview({ id, onNotice }: { id: string; onNotice: (message: string) => void }) {
  if (id === 'search-loading') return <View style={s.stateFrame}><View style={s.searchHeader}><ArrowLeft size={20} color={COLORS.primary} /><View><Text style={s.searchTitle}>Đà Lạt, Việt Nam</Text><Text style={s.searchSubtitle}>2 khách · Chỗ ở mẫu</Text></View><MapPin size={20} color={COLORS.primary} /></View><SkeletonRows /></View>;
  if (id === 'search-empty') return <View style={s.stateFrame}><View style={s.searchHeader}><ArrowLeft size={20} color={COLORS.primary} /><View><Text style={s.searchTitle}>Đà Lạt, Việt Nam</Text><Text style={s.searchSubtitle}>2 khách · Chỗ ở mẫu</Text></View><MapPin size={20} color={COLORS.primary} /></View><View style={s.emptyCard}><Text style={s.cardTitle}>Không tìm thấy chỗ ở</Text><Text style={s.cardBody}>Hãy thử điểm đến khác hoặc điều chỉnh bộ lọc để tìm chỗ ở phù hợp.</Text><Button title="Đổi tìm kiếm" size="lg" fullWidth onPress={() => router.push('/(tabs)/search')} /></View></View>;
  if (id === 'compare-loading') return <CompareLoadingPreview />;
  return <View style={s.stateFrame}><View style={s.failedCard}><Text style={s.cardTitle}>Thanh toán không thành công</Text><Text style={s.cardBody}>Đây chỉ là trạng thái giao diện demo. Không có khoản thanh toán nào được thực hiện.</Text><Button title="Thử lại bản xem" size="lg" fullWidth onPress={() => onNotice('Luồng thanh toán thật không thay đổi.')} /><Pressable style={s.secondaryAction} onPress={() => onNotice('Chọn MoMo, VNPay hoặc thẻ trong checkout hiện có.')}><Text style={s.secondaryText}>Chọn phương thức thanh toán</Text></Pressable></View></View>;
}

function FilterPreview({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  if (id.startsWith('checkbox')) {
    const checked = id.endsWith('on');
    return <Pressable style={s.checkboxRow} onPress={() => onSelect(checked ? 'checkbox-off' : 'checkbox-on')} accessibilityRole="checkbox" accessibilityState={{ checked }} aria-checked={checked}><View style={[s.checkbox, checked && s.checkboxOn]}>{checked && <Check size={17} color={COLORS.bgWhite} />}</View><Text style={s.checkboxLabel}>Khách sạn</Text></Pressable>;
  }
  if (id.startsWith('star')) {
    const checked = id.endsWith('on');
    return <Pressable style={[s.starChip, checked && s.starChipOn]} onPress={() => onSelect(checked ? 'star-off' : 'star-on')} accessibilityRole="checkbox" accessibilityState={{ checked }} aria-checked={checked}><Text style={s.starText}>1</Text><Star size={14} color={COLORS.textMuted} /></Pressable>;
  }
  if (id.startsWith('toggle')) {
    const checked = id.endsWith('on');
    return <Pressable style={s.toggle} onPress={() => onSelect(checked ? 'toggle-off' : 'toggle-on')} accessibilityRole="switch" accessibilityLabel="Nút gạt" accessibilityState={{ checked }} aria-checked={checked}><Se121SharedAsset source={checked ? require('../../assets/figma/shared/243-966-imgStateOn.svg') : require('../../assets/figma/shared/243-966-imgStateOff.svg')} width={44} height={32} nativeFallback={<View style={[s.toggleTrack, checked && s.toggleOn]}><View style={[s.toggleThumb, checked && s.toggleThumbOn]} /></View>} /></Pressable>;
  }
  const budget = id.endsWith('budget');
  const min = Math.min(...MOCK_STAYS.map((stay) => stay.pricePerNight));
  const max = Math.max(...MOCK_STAYS.map((stay) => stay.pricePerNight));
  return <Pressable style={s.range} onPress={() => onSelect(budget ? 'range-full' : 'range-budget')} accessibilityRole="button"><Text style={s.rangeTitle}>Khoảng giá</Text><View style={s.rangeRail}><View style={[s.rangeActive, budget ? s.rangeBudget : s.rangeFull]} /><View style={[s.rangeHandle, { left: budget ? '25%' : '15%' }]} /><View style={[s.rangeHandle, { left: budget ? '62%' : '75%' }]} /></View><View style={s.rangeLabels}><Text style={s.rangeLabel}>{money(budget ? 800000 : min)}</Text><Text style={s.rangeLabel}>{money(budget ? 1000000 : max)}</Text></View></Pressable>;
}

function PropertyPreview({ id, propertyIndex, onProperty, resultIndex, onResult, onVariant }: { id: string; propertyIndex: number; onProperty: (index: number) => void; resultIndex: number; onResult: (index: number) => void; onVariant: (id: string) => void }) {
  const [galleryWidth, setGalleryWidth] = useState(350);
  const [photoIndex, setPhotoIndex] = useState(0);
  if (id.startsWith('wishlist')) {
    const tabs = [{ id: 'wishlist-all', label: 'Tất cả' }, { id: 'wishlist-upcoming', label: 'Chuyến đi sắp tới' }, { id: 'wishlist-dream', label: 'Điểm đến mơ ước' }];
    return <Selector items={tabs} selected={id} onSelect={(next) => onProperty(next === 'wishlist-all' ? -1 : next === 'wishlist-upcoming' ? -2 : -3)} />;
  }
  const property = PROPERTIES[propertyIndex];
  if (id.startsWith('result')) {
    const result = PROPERTIES.find((item) => item.name === RESULT_NAMES[resultIndex])!;
    return <View><Selector items={RESULT_NAMES.map((name, index) => ({ id: String(index), label: name }))} selected={String(resultIndex)} onSelect={(next) => onResult(Number(next))} /><Pressable style={[s.resultCard, id.endsWith('pressed') && s.resultPressed]} accessibilityRole="button" onPress={() => onVariant(id.endsWith('pressed') ? 'result-default' : 'result-pressed')}><Image source={result.image} style={s.resultImage} resizeMode="cover" /><View style={s.resultCopy}><Text style={s.resultTitle} numberOfLines={2}>{result.name}</Text><Text style={s.resultPlace}>Mẫu giao diện Figma</Text><View style={s.resultAmenities}><Wifi size={17} color={COLORS.inkSubtle} /><Star size={15} color={COLORS.actionTeal} /></View><Text style={s.resultHint}>Chưa có giá trong dữ liệu mẫu</Text></View></Pressable><Text style={s.assetNote}>Thẻ này chỉ minh họa bố cục. Không tạo chỗ ở hoặc giá mới.</Text></View>;
  }
  const mockStay = MOCK_STAYS.find((stay) => stay.title === property.name);
  const photos = propertyIndex === 0 && id === 'gallery' ? [
    require('../../assets/figma/gallery/villa_azure_1.jpg'),
    require('../../assets/figma/gallery/villa_azure_2.jpg'),
    require('../../assets/figma/gallery/villa_azure_3.jpg'),
  ] : mockStay && id === 'gallery' ? mockStay.images.map((uri) => ({ uri })) : [property.image];
  return <View><Selector items={PROPERTIES.map((item, index) => ({ id: String(index), label: item.name }))} selected={String(propertyIndex)} onSelect={(next) => { onProperty(Number(next)); setPhotoIndex(0); }} /><View style={s.propertyFrame} onLayout={(event) => setGalleryWidth(event.nativeEvent.layout.width)}>{id === 'gallery' ? <><ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(event) => setPhotoIndex(Math.round(event.nativeEvent.contentOffset.x / galleryWidth))}>{photos.map((photo, index) => <Image key={index} source={photo} resizeMode="cover" style={[s.galleryImage, { width: galleryWidth }]} />)}</ScrollView>{photos.length > 1 && <View style={s.galleryDots}>{photos.map((_, index) => <View key={index} style={[s.galleryDot, index === photoIndex && s.galleryDotActive]} />)}</View>}</> : <Image source={property.image} resizeMode="cover" style={s.thumbnail} />}</View><Text style={s.assetNote}>{property.name} · Ảnh {property.source === 'mock' ? 'từ dữ liệu mẫu' : 'tĩnh từ Figma'}</Text></View>;
}

function SharedPreview({ id, navIndex, onNav, onNotice }: { id: string; navIndex: number; onNav: (index: number) => void; onNotice: (message: string) => void }) {
  if (id.startsWith('button')) return <View style={s.sharedCenter}><Button title="Tiếp tục" size="lg" icon={<Se121SharedAsset source={require('../../assets/figma/shared/270-1069-imgTrailingIcon.svg')} width={12.4999} nativeFallback={<ChevronRight size={16} color={COLORS.bgWhite} />} />} style={id.endsWith('pressed') ? s.buttonPressed : undefined} onPress={() => onNotice('Nút demo đã được nhấn.')} /></View>;
  if (id === 'sticky') return <View style={s.stickyPreview}><View style={s.stickyPriceBlock}><Text numberOfLines={1} style={s.stickyLabel}>Tổng thanh toán mẫu</Text><Text style={s.stickyPrice}>{money(MOCK_STAYS[0].pricePerNight)}</Text></View><Button title="Tiếp tục" size="lg" style={s.stickyButton} onPress={() => onNotice('Thanh hành động chỉ xem thử.')} /></View>;
  if (id === 'appbar') return <TopAppBar title="StayFinder" onBackPress={() => onNotice('Đây là bản xem trước thanh trên.')} />;
  return <View style={[s.navPreview, navIndex === 5 && s.navSubtle]}>{NAV.map(({ label, icon: Icon }, index) => {
    const active = (navIndex === 5 ? 4 : navIndex) === index;
    return <Pressable key={label} style={s.navItem} onPress={() => onNav(index)} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active }} aria-selected={active}><Se121SharedAsset source={componentNavigationAsset(index, navIndex === 5 ? 4 : navIndex)} width={24} nativeFallback={<Icon size={24} color={active ? COLORS.primary : COLORS.textSecondary} fill={active && [0,3,4].includes(index) ? COLORS.primary : 'none'} />} /><Text style={[s.navLabel, active && s.navLabelActive, active && index === 4 && navIndex !== 5 && s.navLabelProfile]} numberOfLines={1} minimumFontScale={0.85}>{label}</Text></Pressable>;
  })}</View>;
}

export function UserUiGallery() {
  const insets = useSafeAreaInsets();
  const { height, width } = useUserWindowDimensions();
  const [group, setGroup] = useState<Group>('states');
  const [selected, setSelected] = useState('search-loading');
  const [propertyIndex, setPropertyIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);
  const [navIndex, setNavIndex] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [notice, setNotice] = useState('');
  const toastProgress = useRef(new Animated.Value(0)).current;
  const toastOffset = useRef(new Animated.Value(8)).current;
  const dialogProgress = useRef(new Animated.Value(0)).current;
  const choiceProgress = useRef(new Animated.Value(0)).current;
  const activeGroup = GROUPS.find((item) => item.id === group)!;
  const activeVariant = activeGroup.variants.find((item) => item.id === selected)!;
  const nodeId = selected.startsWith('result') ? RESULT_NODES[resultIndex][selected.endsWith('pressed') ? 1 : 0] : selected === 'gallery' ? ['243:978', '243:979', '243:989', '243:999', '243:1009', '243:1030', '243:1040', '243:1050', '243:1060', '243:1070', '243:1080'][propertyIndex] : activeVariant.node;
  useEffect(() => {
    if (overlay !== 'toast') return;
    toastProgress.setValue(0);
    toastOffset.setValue(8);
    const easing = Easing.bezier(0, 0, 0.58, 1);
    const animation = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(toastProgress, { toValue: 1, duration: 180, easing, useNativeDriver: true }),
        Animated.timing(toastOffset, { toValue: 0, duration: 180, easing, useNativeDriver: true }),
      ]),
      Animated.delay(1520),
      Animated.parallel([
        Animated.timing(toastProgress, { toValue: 0, duration: 200, easing, useNativeDriver: true }),
        Animated.timing(toastOffset, { toValue: 4, duration: 200, easing, useNativeDriver: true }),
      ]),
      Animated.delay(100),
    ]));
    animation.start();
    return () => animation.stop();
  }, [overlay, toastProgress, toastOffset]);
  useEffect(() => {
    if (overlay !== 'dialog') return;
    dialogProgress.setValue(0);
    const animation = Animated.timing(dialogProgress, { toValue: 1, duration: 200, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [overlay, dialogProgress]);
  useLayoutEffect(() => {
    if (overlay !== 'choice') return;
    choiceProgress.setValue(0);
    const animation = Animated.timing(choiceProgress, { toValue: 1, duration: 220, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [choiceProgress, overlay]);
  const selectGroup = (next: Group) => { setGroup(next); setSelected(GROUPS.find((item) => item.id === next)!.variants[0].id); setNotice(''); };
  const selectVariant = (next: string) => { setSelected(next); setNotice(''); if (next.startsWith('nav-')) setNavIndex(Number(next.slice(4))); };
  const chooseWishlistTab = (index: number) => setSelected(index === -1 ? 'wishlist-all' : index === -2 ? 'wishlist-upcoming' : 'wishlist-dream');
  return <View style={[s.screen, { paddingTop: insets.top }]}>
    <View style={s.header}><Pressable style={s.back} onPress={() => router.back()} accessibilityLabel="Quay lại tài khoản"><ArrowLeft size={SIZES.icon} color={COLORS.primary} /></Pressable><Text style={s.headerTitle}>Thư viện giao diện</Text><View style={s.back} /></View>
    <ScrollView style={s.body} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + SPACING.section }]} showsVerticalScrollIndicator={false}>
      <Text style={s.intro}>Các trạng thái và biến thể USER theo SE121. Tương tác trong thư viện chỉ là bản xem thử, không lưu dữ liệu hay thực hiện thanh toán.</Text>
      <Text style={s.sectionLabel}>Nhóm</Text><Selector items={GROUPS} selected={group} onSelect={(next) => selectGroup(next as Group)} />
      <Text style={s.sectionLabel}>Biến thể</Text><Selector items={activeGroup.variants} selected={selected} onSelect={selectVariant} />
      <View style={s.previewHeading}><Text style={s.previewTitle}>{activeVariant.label}</Text><Text style={s.nodeLabel}>Figma {nodeId}</Text></View>
      <View style={[s.preview, group === 'shared' && { width, marginHorizontal: -SPACING.xl, borderRadius: 0, overflow: 'visible', boxShadow: 'none', shadowOpacity: 0 }]}>
        {group === 'states' && <StatePreview id={selected} onNotice={setNotice} />}
        {group === 'overlays' && <View style={s.overlayLaunch}><Text style={s.cardBody}>Nhấn để xem trạng thái {activeVariant.label.toLowerCase()} trên màn hình.</Text><Button title="Mở bản xem" size="lg" onPress={() => setOverlay(selected as Overlay)} /></View>}
        {group === 'filters' && <FilterPreview id={selected} onSelect={selectVariant} />}
        {group === 'property' && <PropertyPreview id={selected} propertyIndex={propertyIndex} onProperty={selected.startsWith('wishlist') ? chooseWishlistTab : setPropertyIndex} resultIndex={resultIndex} onResult={setResultIndex} onVariant={selectVariant} />}
        {group === 'shared' && <SharedPreview id={selected} navIndex={navIndex} onNav={(index) => { setNavIndex(index); setSelected(`nav-${index}`); }} onNotice={setNotice} />}
      </View>
      {!!notice && <Text style={s.notice}>{notice}</Text>}
    </ScrollView>
    <Modal visible={overlay === 'dialog' || overlay === 'choice'} transparent animationType={overlay === 'dialog' ? 'fade' : 'none'} onRequestClose={() => setOverlay(null)}>
      <Pressable style={[s.scrim, overlay === 'choice' && s.choiceScrim, { paddingTop: Math.max(insets.top + SPACING.section, height * 0.26) }]} onPress={() => setOverlay(null)}>
        {overlay === 'dialog' && <Animated.View style={[s.dialogCard, { opacity: dialogProgress, transform: [{ scale: dialogProgress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}><Text style={s.dialogTitle}>Chi tiết đặt phòng</Text><Text style={s.dialogBody}>Kiểm tra thông tin trước khi xác nhận.</Text><Button title="Xác nhận demo" size="md" fullWidth onPress={() => { setOverlay(null); setNotice('Đã xem hộp thoại. Không có đặt phòng nào được tạo.'); }} /><Pressable style={s.secondaryAction} onPress={() => setOverlay(null)}><Text style={s.secondaryText}>Hủy</Text></Pressable></Animated.View>}
        {overlay === 'choice' && <Animated.View style={[s.choiceSheet, { transform: [{ translateY: choiceProgress.interpolate({ inputRange: [0, 1], outputRange: [244 + (Platform.OS === 'web' ? SPACING.xxl : Math.max(insets.bottom, SPACING.xxl)), 0] }) }] }]}><Pressable style={[s.choiceSheetContent, { paddingBottom: Platform.OS === 'web' ? SPACING.xxl : Math.max(insets.bottom, SPACING.xxl) }]} onPress={() => {}}><Text style={s.choiceTitle}>Chọn một tùy chọn</Text>{['Tùy chọn một', 'Tùy chọn hai', 'Tùy chọn ba'].map((item) => <Pressable key={item} style={s.choiceRow} onPress={() => { setOverlay(null); setNotice(`Đã chọn “${item}” trong bản xem trước.`); }}><Text style={s.choiceText}>{item}</Text></Pressable>)}</Pressable></Animated.View>}
      </Pressable>
    </Modal>
    {overlay === 'toast' && <Animated.View pointerEvents="box-none" style={[s.toastLayer, { bottom: Math.max(insets.bottom, SPACING.xl) + SIZES.bottomNav, opacity: toastProgress, transform: [{ translateY: toastOffset }] }]}><Pressable style={s.toast} accessibilityRole="button" accessibilityLabel="Đóng thông báo" onPress={() => setOverlay(null)}><Text numberOfLines={1} style={s.toastText}>Thay đổi đã lưu trong bản xem trước</Text></Pressable></Animated.View>}
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  body: { flex: 1, width: '100%' },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, backgroundColor: COLORS.bgMain },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  content: { width: '100%', minWidth: 0, paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  intro: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20 },
  sectionLabel: { marginTop: SPACING.xxl, marginBottom: SPACING.sm, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  selectorScroll: { width: '100%', flexGrow: 0 },
  selector: { alignItems: 'center', gap: SPACING.sm, paddingRight: SPACING.xl, paddingVertical: SPACING.xs },
  chip: { minHeight: 44, paddingHorizontal: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderSage, borderRadius: RADII.full, backgroundColor: COLORS.surfaceSage, alignItems: 'center', justifyContent: 'center' },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  chipText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  chipTextActive: { color: COLORS.bgWhite },
  previewHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: SPACING.sm, marginTop: SPACING.xxl, marginBottom: SPACING.md },
  previewTitle: { flex: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  nodeLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  preview: { width: '100%', minWidth: 0, minHeight: 190, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite, overflow: 'hidden', ...SHADOWS.cardSoft },
  notice: { marginTop: SPACING.md, color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18 },
  stateFrame: { minHeight: 430, backgroundColor: COLORS.bgMain },
  searchHeader: { height: SIZES.appBar, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 17, textAlign: 'center' },
  searchSubtitle: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11, textAlign: 'center' },
  skeletonRows: { width: '100%', paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, gap: SPACING.xxl },
  skeletonCard: { height: 144, borderRadius: RADII.xl, backgroundColor: COLORS.bgWhite, flexDirection: 'row', padding: SPACING.md, gap: SPACING.md, ...SHADOWS.cardSoft },
  skeletonImage: { width: 110, borderRadius: RADII.sm, backgroundColor: COLORS.borderLight },
  skeletonCopy: { flex: 1, minWidth: 0, paddingTop: SPACING.md, gap: SPACING.md },
  skeletonLine: { height: 12, borderRadius: RADII.sm, backgroundColor: COLORS.borderLight },
  skeletonShort: { width: '75%' },
  emptyCard: { margin: SPACING.xl, padding: SPACING.xxl, minHeight: 270, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite, justifyContent: 'space-between' },
  cardTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  cardBody: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  compareStateFrame: { minHeight: 618, paddingTop: SPACING.xxl, backgroundColor: COLORS.overlayBlack + '59', justifyContent: 'flex-end' },
  compareModalRoot: { flex: 1 },
  compareBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(1px)' } as ViewStyle : {}) },
  compareSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '89%', borderTopLeftRadius: SPACING.xl, borderTopRightRadius: SPACING.xl, backgroundColor: COLORS.bgMain, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0px -8px 12px rgba(0,0,0,0.12)' }, default: { shadowColor: '#000000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 11 } }) },
  compareHandleArea: { height: 38, alignItems: 'center', justifyContent: 'center' },
  compareHead: { paddingHorizontal: SPACING.xl, paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted, gap: SPACING.xs },
  handle: { width: 48, height: 6, marginBottom: SPACING.lg, alignSelf: 'center', borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  compareTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  compareBody: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  compareRows: { flex: 1 },
  compareRowsContent: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 96, gap: SPACING.sm },
  compareCard: { height: 134, borderWidth: 1, borderColor: '#E0E8E8', backgroundColor: COLORS.bgWhite, position: 'relative', ...SHADOWS.cardSoft },
  compareLastCard: { height: 100 },
  compareImage: { position: 'absolute', top: 21, left: 15, width: 38, height: 38, borderRadius: RADII.md, backgroundColor: '#E3EDED' },
  compareName: { position: 'absolute', top: 23, left: 67, width: 118, height: 12, borderRadius: RADII.md, backgroundColor: '#E3EDED' },
  comparePrice: { position: 'absolute', top: 23, right: 15, width: 54, height: 16, borderRadius: RADII.md, backgroundColor: '#E3EDED' },
  compareFallback: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 80, paddingTop: 15, paddingHorizontal: 19, borderWidth: 1, borderColor: '#E5EDF0', backgroundColor: COLORS.bgWhite },
  compareFallbackButton: { height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  compareFallbackText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  previewFooter: { padding: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.bgWhite },
  failedCard: { margin: SPACING.xl, marginTop: 95, padding: SPACING.xxl, gap: SPACING.xxl, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite },
  secondaryAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, textAlign: 'center' },
  overlayLaunch: { minHeight: 190, padding: SPACING.xxl, justifyContent: 'space-between' },
  checkboxRow: { height: 44, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: COLORS.borderSage, borderRadius: RADII.lg, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  checkboxLabel: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16 },
  starChip: { alignSelf: 'flex-start', height: 44, margin: SPACING.xl, paddingHorizontal: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: RADII.full, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  starChipOn: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceMint },
  starText: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  toggle: { width: 44, height: 32, margin: SPACING.xl },
  toggleTrack: { width: 40, height: 20, marginLeft: 2, marginTop: 6, padding: 2, borderRadius: RADII.full, backgroundColor: '#CBD5E1' },
  toggleOn: { backgroundColor: COLORS.primaryActive },
  toggleThumb: { width: 16, height: 16, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite },
  toggleThumbOn: { alignSelf: 'flex-end' },
  range: { padding: SPACING.xl, paddingBottom: SPACING.section, minHeight: 140 },
  rangeTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  rangeRail: { height: 4, marginHorizontal: SPACING.sm, marginTop: SPACING.section, borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  rangeActive: { position: 'absolute', top: 0, height: 4, borderRadius: RADII.full, backgroundColor: COLORS.primary },
  rangeBudget: { left: '28%', width: '36%' }, rangeFull: { left: '18%', width: '59%' },
  rangeHandle: { position: 'absolute', top: -10, width: 24, height: 24, borderWidth: 2, borderColor: COLORS.primary, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSubtle },
  rangeLabels: { marginTop: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between' },
  rangeLabel: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
  propertyFrame: { alignItems: 'center', paddingTop: SPACING.md },
  galleryImage: { width: '100%', height: 256 },
  galleryDots: { position: 'absolute', bottom: SPACING.md, alignSelf: 'center', flexDirection: 'row', gap: SPACING.xs },
  galleryDot: { width: 7, height: 7, borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  galleryDotActive: { backgroundColor: COLORS.bgWhite },
  thumbnail: { width: 96, height: 96 },
  assetNote: { marginTop: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  resultCard: { minHeight: 144, margin: SPACING.md, borderRadius: RADII.xl, flexDirection: 'row', backgroundColor: COLORS.bgWhite, overflow: 'hidden', ...SHADOWS.cardSoft },
  resultPressed: { transform: [{ scale: 0.98 }], opacity: 0.96 },
  resultImage: { width: 116, minHeight: 144 },
  resultCopy: { flex: 1, minWidth: 0, padding: SPACING.md, justifyContent: 'space-between' },
  resultTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  resultPlace: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  resultAmenities: { flexDirection: 'row', gap: SPACING.sm },
  resultHint: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.medium, fontSize: 10 },
  sharedCenter: { minHeight: 190, justifyContent: 'center', alignItems: 'center' },
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  stickyPreview: { height: SIZES.stickyCta, paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.borderMuted, backgroundColor: COLORS.bgWhite, ...Platform.select({ web: { boxShadow: '0px -4px 6px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4 } }) },
  stickyPriceBlock: { flex: 1, minWidth: 104 },
  stickyButton: { width: 200, minWidth: 100, flexShrink: 1 },
  stickyLabel: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  stickyPrice: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  navPreview: { height: SIZES.bottomNav, paddingVertical: SPACING.sm, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, flexDirection: 'row', backgroundColor: COLORS.bgWhite, ...Platform.select({ web: { boxShadow: '0px -4px 6px rgba(0,0,0,0.04)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 4 } }) },
  navSubtle: { backgroundColor: COLORS.bgWhite },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  navLabel: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  navLabelActive: { color: COLORS.primary },
  navLabelProfile: { fontFamily: TYPOGRAPHY.families.bold },
  navLabelSubtle: { fontFamily: TYPOGRAPHY.families.medium },
  scrim: { flex: 1, backgroundColor: COLORS.overlayBlack + '59', justifyContent: 'flex-start', paddingHorizontal: SPACING.xl },
  choiceScrim: { backgroundColor: 'rgba(0,0,0,0.16)', justifyContent: 'flex-end', paddingTop: 0, paddingHorizontal: 0, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(5px)' } as ViewStyle : {}) },
  dialogCard: { padding: SPACING.xxl, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite, alignItems: 'stretch', gap: SPACING.lg },
  dialogTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, textAlign: 'center' },
  dialogBody: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  choiceSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: RADII.promo, borderTopRightRadius: RADII.promo, backgroundColor: COLORS.bgWhite, ...Platform.select({ web: { boxShadow: '0px -7px 26px rgba(5,41,33,0.08)' }, default: { shadowColor: '#052921', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 26, elevation: 8 } }) },
  choiceSheetContent: { gap: SPACING.md, paddingTop: SPACING.xxl, paddingHorizontal: SPACING.xl },
  choiceTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  choiceRow: { height: SIZES.button, paddingHorizontal: SPACING.lg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfacePale, justifyContent: 'center' },
  choiceText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  toastLayer: { position: 'absolute', left: SPACING.xl, right: SPACING.xl },
  toast: { height: SIZES.button, paddingHorizontal: SPACING.xl, paddingVertical: 14, borderRadius: RADII.lg, backgroundColor: COLORS.inkNavy, justifyContent: 'flex-start' },
  toastText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
});
