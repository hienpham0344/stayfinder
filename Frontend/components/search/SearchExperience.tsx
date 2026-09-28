import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Map, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetWrapper } from '../ui/BottomSheetWrapper';
import { Button } from '../ui/Button';
import { SearchResultCard } from './SearchResultCard';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { Stay } from '../../types/stay';

type Sheet = 'criteria' | 'destination' | 'dates' | 'guests' | 'filters' | null;
type PriceBand = 'all' | 'budget' | 'mid' | 'premium';
type StayType = Stay['type'];
type SortBy = 'recommended' | 'price' | 'rating';
const TYPES: { value: StayType; label: string }[] = [
  { value: 'Hotel', label: 'Khách sạn' }, { value: 'Homestay', label: 'Homestay' },
  { value: 'Resort', label: 'Khu nghỉ dưỡng' }, { value: 'Villas', label: 'Biệt thự' },
];
const PRICES: { value: PriceBand; label: string; min: number; max: number }[] = [
  { value: 'all', label: 'Tất cả', min: 0, max: Infinity },
  { value: 'budget', label: 'Dưới 800.000đ', min: 0, max: 800000 },
  { value: 'mid', label: '800.000đ–1.000.000đ', min: 800000, max: 1000000 },
  { value: 'premium', label: 'Trên 1.000.000đ', min: 1000000, max: Infinity },
];
const DESTINATIONS = Array.from(new Set(MOCK_STAYS.map((stay) => stay.location.city)));
const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric' });
const MONTH_FORMAT = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const dateLabel = (start: Date | null, end: Date | null) => !start ? 'Chọn ngày lưu trú' : end ? `${DATE_FORMAT.format(start)} – ${DATE_FORMAT.format(end)}` : `${DATE_FORMAT.format(start)} – chọn ngày trả phòng`;

export function SearchExperience() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [rating, setRating] = useState(0);
  const [types, setTypes] = useState<StayType[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('recommended');
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (loading) { const timer = setTimeout(() => setLoading(false), 350); return () => clearTimeout(timer); } }, [loading]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('vi-VN');
    const band = PRICES.find((item) => item.value === priceBand)!;
    const filtered = MOCK_STAYS.filter((stay) =>
      (!destination || stay.location.city === destination) &&
      (!needle || [stay.title, stay.location.city, stay.location.province].some((value) => value.toLocaleLowerCase('vi-VN').includes(needle))) &&
      stay.pricePerNight >= band.min && stay.pricePerNight < band.max && stay.rating >= rating &&
      (!types.length || types.includes(stay.type)) && stay.maxGuests >= adults + children,
    );
    return sortBy === 'price' ? filtered.sort((a, b) => a.pricePerNight - b.pricePerNight) : sortBy === 'rating' ? filtered.sort((a, b) => b.rating - a.rating) : filtered;
  }, [query, destination, priceBand, rating, types, adults, children, sortBy]);
  const month = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const emptyDays = (month.getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: emptyDays + dayCount }, (_, index) => index - emptyDays + 1);
  const apply = () => { setSheet(null); setLoading(true); };
  const chooseDate = (day: number) => {
    const selected = new Date(month.getFullYear(), month.getMonth(), day);
    if (!start || end || selected <= start) { setStart(selected); setEnd(null); } else setEnd(selected);
  };
  const toggleType = (type: StayType) => setTypes((previous) => previous.includes(type) ? previous.filter((item) => item !== type) : [...previous, type]);

  return <View style={[s.screen, { paddingTop: insets.top }]}>
    <View style={s.header}>
      <Pressable style={s.iconButton} accessibilityLabel="Về trang chủ" onPress={() => router.replace('/')}><ArrowLeft size={SIZES.icon} color={COLORS.primary} /></Pressable>
      <Pressable style={s.headerCenter} accessibilityLabel="Sửa tiêu chí tìm kiếm" onPress={() => setSheet('criteria')}><Text numberOfLines={1} style={s.headerTitle}>{destination || 'Tất cả điểm đến'}</Text><Text numberOfLines={1} style={s.headerSubtitle}>{dateLabel(start, end)} · {adults + children} khách</Text></Pressable>
      <View style={s.iconButton}><Map size={SIZES.icon} color={COLORS.primary} /></View>
    </View>
    {loading ? <View style={s.list}>{[0, 1, 2].map((item) => <View key={item} style={s.skeleton}><View style={s.skeletonImage} /><View style={s.skeletonBody}><View style={s.skeletonLine} /><View style={s.skeletonShort} /><View style={s.skeletonLine} /></View></View>)}</View> :
      <FlatList data={results} keyExtractor={(item) => item.id} renderItem={({ item }) => <SearchResultCard stay={item} />} contentContainerStyle={s.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={s.empty}><Search size={40} color={COLORS.primary} /><Text style={s.emptyTitle}>Không tìm thấy chỗ ở</Text><Text style={s.emptyDescription}>Hãy đổi điểm đến hoặc điều chỉnh bộ lọc.</Text><Button title="Đổi tìm kiếm" size="lg" onPress={() => setSheet('criteria')} style={s.emptyButton} /></View>} />}
    <Pressable style={s.filterFab} accessibilityLabel="Mở bộ lọc" onPress={() => setSheet('filters')}><SlidersHorizontal size={20} color={COLORS.bgWhite} /><Text style={s.filterFabText}>Bộ lọc</Text></Pressable>

    <BottomSheetWrapper visible={sheet !== null} onClose={() => setSheet(null)} title={sheet === 'criteria' ? 'Tìm chỗ ở' : sheet === 'destination' ? 'Chọn điểm đến' : sheet === 'dates' ? 'Chọn ngày lưu trú' : sheet === 'guests' ? 'Khách và phòng' : 'Bộ lọc'}>
      {sheet === 'criteria' && <View style={s.sheetBody}>
        <Pressable style={s.tile} onPress={() => setSheet('destination')}><Text style={s.tileLabel}>Điểm đến</Text><Text style={s.tileText}>{destination || 'Tất cả điểm đến'}</Text></Pressable>
        <Pressable style={s.tile} onPress={() => setSheet('dates')}><Text style={s.tileLabel}>Ngày lưu trú</Text><Text style={s.tileText}>{dateLabel(start, end)}</Text></Pressable>
        <Pressable style={s.tile} onPress={() => setSheet('guests')}><Text style={s.tileLabel}>Khách và phòng</Text><Text style={s.tileText}>{adults} người lớn · {children} trẻ em · {rooms} phòng</Text></Pressable>
        <Text style={s.smallLabel}>Ngày và số phòng chưa dùng để kiểm tra phòng trống trong bản demo.</Text>
        <Button title="Tìm chỗ ở" size="lg" fullWidth onPress={apply} /><Pressable style={s.cancel} onPress={() => setSheet(null)}><Text style={s.cancelText}>Hủy</Text></Pressable>
      </View>}
      {sheet === 'destination' && <View style={s.sheetBody}>
        <View style={s.searchField}><Search size={20} color={COLORS.inkSubtle} /><TextInput value={query} onChangeText={setQuery} placeholder="Tên chỗ ở hoặc thành phố" placeholderTextColor={COLORS.inkSubtle} style={s.searchInput} />{query.length > 0 && <Pressable onPress={() => setQuery('')}><X size={20} color={COLORS.inkSubtle} /></Pressable>}</View>
        <Text style={s.smallLabel}>Điểm đến có sẵn</Text><ScrollView style={s.destinationScroll} keyboardShouldPersistTaps="handled">
          {['', ...DESTINATIONS].map((city) => <Pressable key={city} style={s.destinationRow} onPress={() => { setDestination(city); setSheet('criteria'); }}><MapPin size={20} color={COLORS.primary} /><Text style={s.tileText}>{city || 'Tất cả điểm đến'}</Text></Pressable>)}
        </ScrollView>
      </View>}
      {sheet === 'dates' && <View style={s.sheetBody}>
        <View style={s.monthBar}><Pressable style={s.monthButton} onPress={() => setMonthOffset(Math.max(0, monthOffset - 1))}><ChevronLeft size={18} color={COLORS.primary} /></Pressable><Text style={s.monthText}>{MONTH_FORMAT.format(month)}</Text><Pressable style={s.monthButton} onPress={() => setMonthOffset(monthOffset + 1)}><ChevronRight size={18} color={COLORS.primary} /></Pressable></View>
        <View style={s.calendar}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <Text key={day} style={s.weekday}>{day}</Text>)}{days.map((day, index) => { const date = new Date(month.getFullYear(), month.getMonth(), day); const active = day > 0 && (start?.getTime() === date.getTime() || end?.getTime() === date.getTime()); const between = day > 0 && start && end && date > start && date < end; const past = date < new Date(new Date().setHours(0, 0, 0, 0)); return <Pressable key={index} disabled={day < 1 || past} onPress={() => chooseDate(day)} style={[s.day, active && s.dayActive, between && s.dayBetween]}><Text style={[s.dayText, active && s.dayTextActive, past && s.dayTextPast]}>{day > 0 ? day : ''}</Text></Pressable>; })}</View>
        <View style={s.dateSummary}><Text style={s.tileText}>{dateLabel(start, end)}</Text></View><Button title="Áp dụng" size="lg" fullWidth disabled={!start || !end} onPress={() => setSheet('criteria')} /><Pressable style={s.cancel} onPress={() => setSheet('criteria')}><Text style={s.cancelText}>Hủy</Text></Pressable>
      </View>}
      {sheet === 'guests' && <View style={s.sheetBody}>
        {([{ label: 'Người lớn', hint: 'Từ 18 tuổi', value: adults, minimum: 1, setter: setAdults }, { label: 'Trẻ em', hint: 'Dưới 18 tuổi', value: children, minimum: 0, setter: setChildren }, { label: 'Phòng', hint: 'Số phòng cần', value: rooms, minimum: 1, setter: setRooms }] as const).map(({ label, hint, value, minimum, setter }) => <View key={label} style={s.counterRow}><View><Text style={s.tileText}>{label}</Text><Text style={s.smallLabel}>{hint}</Text></View><View style={s.counterControls}><Pressable style={s.counterButton} onPress={() => setter(Math.max(minimum, value - 1))}><Text style={s.counterSymbol}>−</Text></Pressable><Text style={s.counterValue}>{value}</Text><Pressable style={s.counterButton} onPress={() => setter(Math.min(12, value + 1))}><Text style={s.counterSymbol}>+</Text></Pressable></View></View>)}
        <Button title="Áp dụng" size="lg" fullWidth onPress={() => setSheet('criteria')} /><Pressable style={s.cancel} onPress={() => setSheet('criteria')}><Text style={s.cancelText}>Hủy</Text></Pressable>
      </View>}
      {sheet === 'filters' && <View style={s.filterBody}>
        <ScrollView style={{ maxHeight: height * 0.48 }} contentContainerStyle={s.filterScroll} showsVerticalScrollIndicator={false}>
          <View style={s.filterHeading}><Text style={s.sectionTitle}>Khoảng giá / đêm</Text><Pressable onPress={() => { setPriceBand('all'); setRating(0); setTypes([]); setSortBy('recommended'); }}><Text style={s.resetText}>Đặt lại</Text></Pressable></View>
          <View style={s.priceTrackWrap}><View style={s.priceTrack}><View style={[s.priceTrackActive, { left: priceBand === 'mid' ? '33%' : priceBand === 'premium' ? '66%' : '0%', right: priceBand === 'budget' ? '66%' : priceBand === 'mid' ? '33%' : '0%' }]} /><View style={[s.priceThumb, { left: priceBand === 'mid' ? '33%' : priceBand === 'premium' ? '66%' : '0%' }]} /><View style={[s.priceThumb, { right: priceBand === 'budget' ? '66%' : priceBand === 'mid' ? '33%' : '0%' }]} /></View><View style={s.priceEnds}><Text style={s.smallLabel}>0đ</Text><Text style={s.smallLabel}>1.200.000đ+</Text></View></View>
          <View style={s.optionWrap}>{PRICES.map((price) => <Pressable key={price.value} onPress={() => setPriceBand(price.value)} style={[s.option, priceBand === price.value && s.optionActive]}><Text style={[s.optionText, priceBand === price.value && s.optionTextActive]}>{price.label}</Text></Pressable>)}</View>
          <Text style={s.sectionTitle}>Điểm đánh giá tối thiểu</Text><View style={s.optionWrap}>{[0, 3, 4, 4.5, 4.8].map((value) => <Pressable key={value} onPress={() => setRating(value)} style={[s.option, s.ratingOption, rating === value && s.optionActive]}><Star size={13} color={rating === value ? COLORS.bgWhite : COLORS.inkSubtle} /><Text style={[s.optionText, rating === value && s.optionTextActive]}>{value ? `${value}+` : 'Tất cả'}</Text></Pressable>)}</View>
          <Text style={s.sectionTitle}>Loại chỗ ở</Text>{TYPES.map(({ value, label }) => <Pressable key={value} style={s.typeRow} onPress={() => toggleType(value)}><View style={[s.checkbox, types.includes(value) && s.optionActive]}>{types.includes(value) && <Text style={s.check}>✓</Text>}</View><Text style={s.tileText}>{label}</Text></Pressable>)}
          <Text style={s.sectionTitle}>Sắp xếp</Text><View style={s.optionWrap}>{([{ value: 'recommended', label: 'Đề xuất' }, { value: 'price', label: 'Giá thấp nhất' }, { value: 'rating', label: 'Đánh giá cao' }] as const).map((sort) => <Pressable key={sort.value} onPress={() => setSortBy(sort.value)} style={[s.option, sortBy === sort.value && s.optionActive]}><Text style={[s.optionText, sortBy === sort.value && s.optionTextActive]}>{sort.label}</Text></Pressable>)}</View>
        </ScrollView><Button title={`Áp dụng bộ lọc · ${results.length} chỗ ở`} size="lg" fullWidth onPress={apply} />
      </View>}
    </BottomSheetWrapper>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar + 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm },
  iconButton: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  headerTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 26 },
  headerSubtitle: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: 96, flexGrow: 1 },
  filterFab: { position: 'absolute', bottom: 18, alignSelf: 'center', minHeight: 48, paddingHorizontal: 24, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, flexDirection: 'row', alignItems: 'center', gap: 8, ...SHADOWS.elevated_layer2 },
  filterFabText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  skeleton: { height: 144, marginBottom: 16, borderRadius: RADII.promo, overflow: 'hidden', backgroundColor: COLORS.bgWhite, flexDirection: 'row' },
  skeletonImage: { width: 116, backgroundColor: COLORS.borderTealSoft },
  skeletonBody: { flex: 1, padding: 16, justifyContent: 'space-around' },
  skeletonLine: { height: 13, borderRadius: RADII.full, backgroundColor: COLORS.borderTealSoft },
  skeletonShort: { height: 13, width: '60%', borderRadius: RADII.full, backgroundColor: COLORS.borderTealSoft },
  empty: { marginTop: 80, padding: 24, borderRadius: RADII.promo, alignItems: 'center', gap: 12, backgroundColor: COLORS.bgWhite },
  emptyTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20 },
  emptyDescription: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, textAlign: 'center' },
  emptyButton: { alignSelf: 'stretch', marginTop: 8 },
  sheetBody: { gap: 12, paddingBottom: 4 },
  tile: { minHeight: 82, padding: 14, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, justifyContent: 'center', gap: 5 },
  tileLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  tileText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  searchField: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.borderTealSoft, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceMint, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
  smallLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12 },
  destinationScroll: { maxHeight: 330 },
  destinationRow: { minHeight: 52, paddingHorizontal: 14, marginBottom: 10, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceSage, flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthButton: { width: 40, height: 40, borderRadius: RADII.full, backgroundColor: COLORS.surfaceSage, alignItems: 'center', justifyContent: 'center' },
  monthText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 16 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.285%', textAlign: 'center', marginVertical: 8, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12 },
  day: { width: '14.285%', height: 43, borderRadius: RADII.full, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: COLORS.actionTeal },
  dayBetween: { backgroundColor: COLORS.borderTealSoft },
  dayText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  dayTextActive: { color: COLORS.bgWhite },
  dayTextPast: { color: COLORS.borderSage },
  dateSummary: { minHeight: 62, paddingHorizontal: 14, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, justifyContent: 'center' },
  counterRow: { minHeight: 72, paddingHorizontal: 14, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceSage, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterButton: { width: 38, height: 38, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderSage, backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center' },
  counterSymbol: { color: COLORS.primary, fontSize: 19 },
  counterValue: { minWidth: 18, textAlign: 'center', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 16 },
  filterBody: { gap: 16 },
  filterScroll: { paddingBottom: 12, gap: 16 },
  filterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceTrackWrap: { paddingHorizontal: 8, gap: 8 },
  priceTrack: { height: 28, justifyContent: 'center' },
  priceTrackActive: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal },
  priceThumb: { position: 'absolute', width: 24, height: 24, borderRadius: RADII.full, borderWidth: 2, borderColor: COLORS.actionTeal, backgroundColor: COLORS.bgWhite },
  priceEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  resetText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 40, paddingHorizontal: 12, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderSage, justifyContent: 'center' },
  optionActive: { borderColor: COLORS.actionTeal, backgroundColor: COLORS.actionTeal },
  optionText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12 },
  optionTextActive: { color: COLORS.bgWhite },
  ratingOption: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  typeRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: COLORS.borderSage, borderRadius: RADII.full, alignItems: 'center', justifyContent: 'center' },
  check: { color: COLORS.bgWhite, fontSize: 14 },
});
