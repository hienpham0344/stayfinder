import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageSourcePropType, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Heart, Home, MapPin, Search, Star, User, Wifi } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { TopAppBar } from '../ui/TopAppBar';
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
  { label: 'Đặt phòng', icon: CalendarDays }, { label: 'Yêu thích', icon: Heart },
  { label: 'Tài khoản', icon: User },
] as const;
const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;

function Selector({ items, selected, onSelect }: { items: { id: string; label: string }[]; selected: string; onSelect: (id: string) => void }) {
  return <ScrollView horizontal style={s.selectorScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={s.selector}>
    {items.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: selected === item.id }} onPress={() => onSelect(item.id)} style={[s.chip, selected === item.id && s.chipActive]}><Text style={[s.chipText, selected === item.id && s.chipTextActive]}>{item.label}</Text></Pressable>)}
  </ScrollView>;
}

function SkeletonRows({ compare = false }: { compare?: boolean }) {
  const opacity = useRef(new Animated.Value(0.62)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.92, duration: 550, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.62, duration: 550, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <View style={compare ? s.compareRows : s.skeletonRows}>{[0, 1, 2].map((index) => <View key={index} style={[s.skeletonCard, compare && s.compareCard]}><Animated.View style={[s.skeletonImage, compare && s.compareImage, { opacity }]} /><View style={s.skeletonCopy}><Animated.View style={[s.skeletonLine, { opacity }]} /><Animated.View style={[s.skeletonLine, s.skeletonShort, { opacity }]} /></View></View>)}</View>;
}

function StatePreview({ id, onNotice }: { id: string; onNotice: (message: string) => void }) {
  if (id === 'search-loading') return <View style={s.stateFrame}><View style={s.searchHeader}><ArrowLeft size={20} color={COLORS.primary} /><View><Text style={s.searchTitle}>Đà Lạt, Việt Nam</Text><Text style={s.searchSubtitle}>2 khách · Chỗ ở mẫu</Text></View><MapPin size={20} color={COLORS.primary} /></View><SkeletonRows /></View>;
  if (id === 'search-empty') return <View style={s.stateFrame}><View style={s.searchHeader}><ArrowLeft size={20} color={COLORS.primary} /><View><Text style={s.searchTitle}>Đà Lạt, Việt Nam</Text><Text style={s.searchSubtitle}>2 khách · Chỗ ở mẫu</Text></View><MapPin size={20} color={COLORS.primary} /></View><View style={s.emptyCard}><Text style={s.cardTitle}>Không tìm thấy chỗ ở</Text><Text style={s.cardBody}>Hãy thử điểm đến khác hoặc điều chỉnh bộ lọc để tìm chỗ ở phù hợp.</Text><Button title="Đổi tìm kiếm" size="lg" fullWidth onPress={() => router.push('/(tabs)/search')} /></View></View>;
  if (id === 'compare-loading') return <View style={s.stateFrame}><View style={s.compareHead}><View style={s.handle} /><Text style={s.cardTitle}>Đang so sánh giá...</Text><Text style={s.cardBody}>Dữ liệu chỗ ở mẫu</Text></View><SkeletonRows compare /><View style={s.previewFooter}><Button title="Xem giá có sẵn" size="lg" fullWidth onPress={() => onNotice('Đây là bản xem trước. Mở chi tiết chỗ ở để xem giá mẫu.')} /></View></View>;
  return <View style={s.stateFrame}><View style={s.failedCard}><Text style={s.cardTitle}>Thanh toán không thành công</Text><Text style={s.cardBody}>Đây chỉ là trạng thái giao diện demo. Không có khoản thanh toán nào được thực hiện.</Text><Button title="Thử lại bản xem" size="lg" fullWidth onPress={() => onNotice('Luồng thanh toán thật không thay đổi.')} /><Pressable style={s.secondaryAction} onPress={() => onNotice('Chọn MoMo, VNPay hoặc thẻ trong checkout hiện có.')}><Text style={s.secondaryText}>Chọn phương thức thanh toán</Text></Pressable></View></View>;
}

function FilterPreview({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  if (id.startsWith('checkbox')) {
    const checked = id.endsWith('on');
    return <Pressable style={s.checkboxRow} onPress={() => onSelect(checked ? 'checkbox-off' : 'checkbox-on')} accessibilityRole="checkbox" accessibilityState={{ checked }}><View style={[s.checkbox, checked && s.checkboxOn]}>{checked && <Check size={17} color={COLORS.bgWhite} />}</View><Text style={s.checkboxLabel}>Khách sạn</Text></Pressable>;
  }
  if (id.startsWith('star')) {
    const checked = id.endsWith('on');
    return <Pressable style={[s.starChip, checked && s.starChipOn]} onPress={() => onSelect(checked ? 'star-off' : 'star-on')} accessibilityRole="checkbox" accessibilityState={{ checked }}><Text style={s.starText}>1</Text><Star size={14} color={COLORS.textMuted} /></Pressable>;
  }
  if (id.startsWith('toggle')) {
    const checked = id.endsWith('on');
    return <Pressable style={[s.toggle, checked && s.toggleOn]} onPress={() => onSelect(checked ? 'toggle-off' : 'toggle-on')} accessibilityRole="switch" accessibilityState={{ checked }}><View style={[s.toggleThumb, checked && s.toggleThumbOn]} /></Pressable>;
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
  if (id.startsWith('button')) return <View style={s.sharedCenter}><Button title="Tiếp tục" size="lg" icon={<ChevronRight size={16} color={COLORS.bgWhite} />} style={id.endsWith('pressed') ? s.buttonPressed : undefined} onPress={() => onNotice('Nút demo đã được nhấn.')} /></View>;
  if (id === 'sticky') return <View style={s.stickyPreview}><View><Text style={s.stickyLabel}>Tổng thanh toán mẫu</Text><Text style={s.stickyPrice}>{money(MOCK_STAYS[0].pricePerNight)}</Text></View><Button title="Tiếp tục" size="lg" onPress={() => onNotice('Thanh hành động chỉ xem thử.')} /></View>;
  if (id === 'appbar') return <TopAppBar title="StayFinder" onBackPress={() => onNotice('Đây là bản xem trước thanh trên.')} />;
  return <View style={[s.navPreview, navIndex === 5 && s.navSubtle]}>{NAV.map(({ label, icon: Icon }, index) => {
    const active = (navIndex === 5 ? 4 : navIndex) === index;
    return <Pressable key={label} style={s.navItem} onPress={() => onNav(index)} accessibilityState={{ selected: active }}><Icon size={21} color={active ? COLORS.primary : COLORS.inkSoft} fill={active && index === 3 ? COLORS.primary : 'none'} /><Text style={[s.navLabel, active && s.navLabelActive]}>{label}</Text></Pressable>;
  })}</View>;
}

export function UserUiGallery() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [group, setGroup] = useState<Group>('states');
  const [selected, setSelected] = useState('search-loading');
  const [propertyIndex, setPropertyIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);
  const [navIndex, setNavIndex] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [notice, setNotice] = useState('');
  const toastProgress = useRef(new Animated.Value(0)).current;
  const dialogProgress = useRef(new Animated.Value(0)).current;
  const activeGroup = GROUPS.find((item) => item.id === group)!;
  const activeVariant = activeGroup.variants.find((item) => item.id === selected)!;
  const nodeId = selected.startsWith('result') ? RESULT_NODES[resultIndex][selected.endsWith('pressed') ? 1 : 0] : selected === 'gallery' ? ['243:978', '243:979', '243:989', '243:999', '243:1009', '243:1030', '243:1040', '243:1050', '243:1060', '243:1070', '243:1080'][propertyIndex] : activeVariant.node;
  useEffect(() => {
    if (overlay !== 'toast') return;
    toastProgress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(toastProgress, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1520),
      Animated.timing(toastProgress, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => { if (finished) setOverlay(null); });
    return () => animation.stop();
  }, [overlay, toastProgress]);
  useEffect(() => {
    if (overlay !== 'dialog') return;
    dialogProgress.setValue(0);
    const animation = Animated.timing(dialogProgress, { toValue: 1, duration: 200, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [overlay, dialogProgress]);
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
      <View style={s.preview}>
        {group === 'states' && <StatePreview id={selected} onNotice={setNotice} />}
        {group === 'overlays' && <View style={s.overlayLaunch}><Text style={s.cardBody}>Nhấn để xem trạng thái {activeVariant.label.toLowerCase()} trên màn hình.</Text><Button title="Mở bản xem" size="lg" onPress={() => setOverlay(selected as Overlay)} /></View>}
        {group === 'filters' && <FilterPreview id={selected} onSelect={selectVariant} />}
        {group === 'property' && <PropertyPreview id={selected} propertyIndex={propertyIndex} onProperty={selected.startsWith('wishlist') ? chooseWishlistTab : setPropertyIndex} resultIndex={resultIndex} onResult={setResultIndex} onVariant={selectVariant} />}
        {group === 'shared' && <SharedPreview id={selected} navIndex={navIndex} onNav={(index) => { setNavIndex(index); setSelected(`nav-${index}`); }} onNotice={setNotice} />}
      </View>
      {!!notice && <Text style={s.notice}>{notice}</Text>}
    </ScrollView>
    <Modal visible={overlay === 'dialog' || overlay === 'choice'} transparent animationType="fade" onRequestClose={() => setOverlay(null)}>
      <Pressable style={[s.scrim, { paddingTop: Math.max(insets.top + SPACING.section, height * 0.26) }]} onPress={() => setOverlay(null)}>
        {overlay === 'dialog' && <Animated.View style={[s.dialogCard, { opacity: dialogProgress, transform: [{ scale: dialogProgress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}><Text style={s.dialogTitle}>Chi tiết đặt phòng</Text><Text style={s.dialogBody}>Kiểm tra thông tin trước khi xác nhận.</Text><Button title="Xác nhận demo" size="md" fullWidth onPress={() => { setOverlay(null); setNotice('Đã xem hộp thoại. Không có đặt phòng nào được tạo.'); }} /><Pressable style={s.secondaryAction} onPress={() => setOverlay(null)}><Text style={s.secondaryText}>Hủy</Text></Pressable></Animated.View>}
        {overlay === 'choice' && <Pressable style={[s.choiceSheet, { paddingBottom: Platform.OS === 'web' ? SPACING.xxl : Math.max(insets.bottom, SPACING.xxl) }]} onPress={() => {}}><Text style={s.choiceTitle}>Chọn một tùy chọn</Text>{['Tùy chọn một', 'Tùy chọn hai', 'Tùy chọn ba'].map((item) => <Pressable key={item} style={s.choiceRow} onPress={() => { setOverlay(null); setNotice(`Đã chọn “${item}” trong bản xem trước.`); }}><Text style={s.choiceText}>{item}</Text></Pressable>)}</Pressable>}
      </Pressable>
    </Modal>
    {overlay === 'toast' && <Animated.View pointerEvents="box-none" style={[s.toastLayer, { bottom: insets.bottom + SIZES.bottomNav + SPACING.xl, opacity: toastProgress, transform: [{ translateY: toastProgress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}><Pressable style={s.toast} onPress={() => setOverlay(null)}><Text style={s.toastText}>Thay đổi đã lưu trong bản xem trước</Text></Pressable></Animated.View>}
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
  compareHead: { padding: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted, gap: SPACING.xs },
  handle: { width: 48, height: 6, marginBottom: SPACING.lg, alignSelf: 'center', borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  compareRows: { padding: SPACING.xl, gap: SPACING.sm },
  compareCard: { height: 95, borderRadius: 0, borderWidth: 1, borderColor: COLORS.borderLight, shadowOpacity: 0, elevation: 0 },
  compareImage: { width: 40, height: 40 },
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
  toggle: { width: 44, height: 32, margin: SPACING.xl, padding: 4, borderRadius: RADII.full, backgroundColor: COLORS.borderSage, justifyContent: 'center' },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleThumb: { width: 24, height: 24, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite },
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
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.96 },
  stickyPreview: { minHeight: SIZES.stickyCta, paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.borderMuted },
  stickyLabel: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  stickyPrice: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 18 },
  navPreview: { height: SIZES.bottomNav, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, flexDirection: 'row', backgroundColor: COLORS.bgWhite },
  navSubtle: { backgroundColor: COLORS.surfaceSage },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  navLabel: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 9 },
  navLabelActive: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold },
  scrim: { flex: 1, backgroundColor: COLORS.overlayBlack + '59', justifyContent: 'flex-start', paddingHorizontal: SPACING.xl },
  dialogCard: { padding: SPACING.xxl, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite, alignItems: 'stretch', gap: SPACING.lg },
  dialogTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, textAlign: 'center' },
  dialogBody: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  choiceSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: SPACING.xxl, paddingHorizontal: SPACING.xl, borderTopLeftRadius: RADII.promo, borderTopRightRadius: RADII.promo, backgroundColor: COLORS.bgWhite, gap: SPACING.md },
  choiceTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  choiceRow: { minHeight: SIZES.button, paddingHorizontal: SPACING.lg, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfacePale, justifyContent: 'center' },
  choiceText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
  toastLayer: { position: 'absolute', left: SPACING.xl, right: SPACING.xl },
  toast: { height: SIZES.button, paddingHorizontal: SPACING.xl, borderRadius: RADII.lg, backgroundColor: COLORS.inkNavy, justifyContent: 'center' },
  toastText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
});
