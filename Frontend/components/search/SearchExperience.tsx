import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Map, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetWrapper } from '../ui/BottomSheetWrapper';
import { Button } from '../ui/Button';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
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
const PRICE_RANGE_MARKS: Record<PriceBand, { start: number; end: number }> = {
  all: { start: 0, end: 100 },
  budget: { start: 0, end: 66.67 },
  mid: { start: 66.67, end: 83.33 },
  premium: { start: 83.33, end: 100 },
};
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'recommended', label: 'Đề xuất' },
  { value: 'price', label: 'Giá thấp nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
];
const DESTINATIONS = Array.from(new Set(MOCK_STAYS.map((stay) => stay.location.city)));
const DESTINATION_PROVINCES = new globalThis.Map<string, string>(MOCK_STAYS.map((stay) => [stay.location.city, stay.location.province] as const));
const normalHeaderBackAsset = require('../../assets/figma/search-completion/13-1213-header-back.svg');
const normalHeaderMapAsset = require('../../assets/figma/search-completion/13-1213-header-map.svg');
const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric' });
const MONTH_FORMAT = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const dateLabel = (start: Date | null, end: Date | null) => !start ? 'Chọn ngày lưu trú' : end ? `${DATE_FORMAT.format(start)} – ${DATE_FORMAT.format(end)}` : `${DATE_FORMAT.format(start)} – chọn ngày trả phòng`;

export function SearchExperience() {
  const insets = useSafeAreaInsets();
  const { height, width } = useUserWindowDimensions();
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
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [priceMenuVisible, setPriceMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const filterScrollRef = useRef<ScrollView>(null);
  useEffect(() => { if (loading) { const timer = setTimeout(() => setLoading(false), 350); return () => clearTimeout(timer); } }, [loading]);
  useEffect(() => {
    setSortMenuVisible(false);
    setPriceMenuVisible(false);
  }, [sheet]);

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
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));
  const daySize = Math.min(42, (width - 40) / 7);
  const nights = start && end ? Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000) : null;
  const apply = () => { setSheet(null); setLoading(true); };
  const chooseDate = (day: number) => {
    const selected = new Date(month.getFullYear(), month.getMonth(), day);
    if (!start || end || selected <= start) { setStart(selected); setEnd(null); } else setEnd(selected);
  };
  const toggleType = (type: StayType) => setTypes((previous) => previous.includes(type) ? previous.filter((item) => item !== type) : [...previous, type]);
  const selectedSort = SORT_OPTIONS.find((option) => option.value === sortBy)!;
  const priceRange = PRICE_RANGE_MARKS[priceBand];
  const priceRangeLabels = priceBand === 'all'
    ? ['0đ', 'Không giới hạn']
    : priceBand === 'budget'
      ? ['0đ', '800.000đ']
      : priceBand === 'mid'
        ? ['800.000đ', '1.000.000đ']
        : ['1.000.000đ', 'Không giới hạn'];

  return <View style={[s.screen, { paddingTop: insets.top }]}>
    <View style={s.header}>
      <Pressable style={s.iconButton} accessibilityLabel="Về trang chủ" onPress={() => router.replace('/')}>
        {loading ? <ArrowLeft size={16} color={COLORS.primary} /> : <Se121SharedAsset source={normalHeaderBackAsset} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.primary} />} />}
      </Pressable>
      <Pressable style={s.headerCenter} accessibilityLabel="Sửa tiêu chí tìm kiếm" onPress={() => setSheet('criteria')}><Text numberOfLines={1} style={s.headerTitle}>{destination || 'Tất cả điểm đến'}</Text><Text numberOfLines={1} style={s.headerSubtitle}>{dateLabel(start, end)} · {adults + children} khách</Text></Pressable>
      <View style={s.iconButton}>{loading ? <Map size={18} color={COLORS.primary} /> : <Se121SharedAsset source={normalHeaderMapAsset} width={18} nativeFallback={<Map size={18} color={COLORS.primary} />} />}</View>
    </View>
    {loading ? <View style={[s.list, s.loadingList]}>{[0, 1, 2].map((item) => <View key={item} style={s.skeleton}><View style={s.skeletonImage} /><View style={s.skeletonBody}><View style={s.skeletonLine} /><View style={s.skeletonShort} /></View></View>)}</View> :
      <FlatList data={results} keyExtractor={(item) => item.id} renderItem={({ item }) => <SearchResultCard stay={item} />} contentContainerStyle={s.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTitle}>Không tìm thấy chỗ ở</Text><Text style={s.emptyDescription}>Hãy thử điểm đến khác hoặc điều chỉnh bộ lọc để tìm chỗ ở phù hợp.</Text><Button title="Đổi tìm kiếm" size="md" fullWidth onPress={() => setSheet(priceBand !== 'all' || rating > 0 || types.length > 0 ? 'filters' : 'criteria')} style={s.emptyButton} /></View>} />}
    {!loading && results.length > 0 && <Pressable style={s.filterFab} accessibilityLabel="Mở bộ lọc" onPress={() => setSheet('filters')}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/search-fab.svg')} width={18} nativeFallback={<SlidersHorizontal size={18} color={COLORS.bgWhite} />} /><Text style={s.filterFabText}>Bộ lọc</Text></Pressable>}

    <BottomSheetWrapper visible={sheet !== null} onClose={() => setSheet(null)} variant={sheet === 'criteria' ? 'searchCriteria' : sheet === 'filters' ? 'searchFilters' : sheet === 'destination' ? 'searchDestination' : sheet === 'dates' ? 'searchDates' : sheet === 'guests' ? 'searchGuests' : undefined}>
      {sheet === 'criteria' && <View style={s.criteriaBody}>
        <Text style={s.criteriaTitle}>Tìm chỗ ở</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Chọn điểm đến" style={s.tile} onPress={() => setSheet('destination')}><Text style={s.tileLabel}>Điểm đến</Text><Text style={s.tileText}>{destination || 'Tất cả điểm đến'}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Chọn ngày lưu trú" style={s.tile} onPress={() => setSheet('dates')}><Text style={s.tileLabel}>Ngày lưu trú · chỉ xem trước trong demo</Text><Text style={s.tileText}>{dateLabel(start, end)}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Chọn khách và phòng" style={s.tile} onPress={() => setSheet('guests')}><Text style={s.tileLabel}>Khách và phòng · số phòng chỉ xem trước</Text><Text style={s.tileText}>{adults} người lớn · {children} trẻ em · {rooms} phòng</Text></Pressable>
        <Button title="Tìm chỗ ở" size="md" fullWidth onPress={apply} /><Pressable style={s.cancel} onPress={() => setSheet(null)}><Text style={s.cancelText}>Hủy</Text></Pressable>
      </View>}
      {sheet === 'destination' && <View style={s.sheetBody}>
        <Text style={s.pickerTitle}>Chọn điểm đến</Text>
        <View style={s.searchField}><Search size={20} color={COLORS.inkSubtle} /><TextInput value={query} onChangeText={setQuery} placeholder="Tên chỗ ở hoặc thành phố" placeholderTextColor={COLORS.inkSubtle} style={s.searchInput} />{query.length > 0 && <Pressable onPress={() => setQuery('')}><X size={20} color={COLORS.inkSubtle} /></Pressable>}</View>
        <Text style={s.smallLabel}>Điểm đến phổ biến</Text><ScrollView style={s.destinationScroll} keyboardShouldPersistTaps="handled">
          {['', ...DESTINATIONS].map((city) => <Pressable key={city} style={s.destinationRow} onPress={() => { setDestination(city); setSheet('criteria'); }}><MapPin size={20} color={COLORS.primary} /><View style={s.destinationCopy}><Text numberOfLines={1} style={s.destinationName}>{city || 'Tất cả điểm đến'}</Text>{city && <Text numberOfLines={1} style={s.destinationProvince}>{DESTINATION_PROVINCES.get(city)}</Text>}</View></Pressable>)}
        </ScrollView>
      </View>}
      {sheet === 'dates' && <View style={s.sheetBody}>
        <Text style={s.pickerTitle}>Chọn ngày lưu trú</Text>
        <View style={s.monthBar}><Pressable style={s.monthButton} onPress={() => setMonthOffset(Math.max(0, monthOffset - 1))}><ChevronLeft size={18} color={COLORS.primary} /></Pressable><Text style={s.monthText}>{MONTH_FORMAT.format(month)}</Text><Pressable style={s.monthButton} onPress={() => setMonthOffset(monthOffset + 1)}><ChevronRight size={18} color={COLORS.primary} /></Pressable></View>
        <View style={s.weekdays}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <Text key={day} style={[s.weekday, { width: Math.min(38, daySize) }]}>{day}</Text>)}</View>
        <View style={s.calendar}>{weeks.map((week, weekIndex) => <View key={weekIndex} style={s.week}>{Array.from({ length: 7 }, (_, index) => { const day = week[index] ?? 0; const date = new Date(month.getFullYear(), month.getMonth(), day); const active = day > 0 && (start?.getTime() === date.getTime() || end?.getTime() === date.getTime()); const between = day > 0 && start && end && date > start && date < end; const past = date < new Date(new Date().setHours(0, 0, 0, 0)); return <Pressable key={index} disabled={day < 1 || past} onPress={() => chooseDate(day)} style={[s.day, { width: daySize, height: daySize }, active && s.dayActive, between && s.dayBetween]}><Text style={[s.dayText, (active || between) && s.dayTextSelected, active && s.dayTextActive, past && s.dayTextPast]}>{day > 0 ? day : ''}</Text></Pressable>; })}</View>)}</View>
        <View style={s.dateSummary}><View style={s.dateSummaryCopy}><Text numberOfLines={1} style={s.dateSummaryRange}>{dateLabel(start, end)}</Text>{nights !== null && <Text style={s.dateSummaryNights}>{nights} đêm</Text>}</View>{start && <Text style={s.dateSummaryYear}>{start.getFullYear()}{end && end.getFullYear() !== start.getFullYear() ? `–${end.getFullYear()}` : ''}</Text>}</View><Button title="Áp dụng" size="md" fullWidth textStyle={s.pickerApplyText} disabled={!start || !end} onPress={() => setSheet('criteria')} /><Pressable hitSlop={{ top: 6, bottom: 6 }} style={s.pickerCancel} onPress={() => setSheet('criteria')}><Text style={s.pickerCancelText}>Hủy</Text></Pressable>
      </View>}
      {sheet === 'guests' && <View style={s.sheetBody}>
        <Text style={s.pickerTitle}>Khách và phòng</Text>
        {([{ label: 'Người lớn', hint: 'Từ 18 tuổi', value: adults, minimum: 1, setter: setAdults }, { label: 'Trẻ em', hint: 'Dưới 18 tuổi', value: children, minimum: 0, setter: setChildren }, { label: 'Phòng', hint: 'Số phòng cần', value: rooms, minimum: 1, setter: setRooms }] as const).map(({ label, hint, value, minimum, setter }) => <View key={label} style={s.counterRow}><View style={s.counterCopy}><Text numberOfLines={1} style={s.tileText}>{label}</Text><Text numberOfLines={1} style={s.counterHint}>{hint}</Text></View><View style={s.counterControls}><Pressable accessibilityRole="button" accessibilityLabel={`Giảm số ${label.toLocaleLowerCase('vi-VN')}`} accessibilityState={{ disabled: value <= minimum }} disabled={value <= minimum} hitSlop={6} style={s.counterButton} onPress={() => setter(Math.max(minimum, value - 1))}><Text style={s.counterSymbol}>−</Text></Pressable><Text style={s.counterValue}>{value}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Tăng số ${label.toLocaleLowerCase('vi-VN')}`} accessibilityState={{ disabled: value >= 12 }} disabled={value >= 12} hitSlop={6} style={s.counterButton} onPress={() => setter(Math.min(12, value + 1))}><Text style={s.counterSymbol}>+</Text></Pressable></View></View>)}
        <Button title="Áp dụng" size="md" fullWidth textStyle={s.pickerApplyText} onPress={() => setSheet('criteria')} /><Pressable hitSlop={{ top: 6, bottom: 6 }} style={s.pickerCancel} onPress={() => setSheet('criteria')}><Text style={s.pickerCancelText}>Hủy</Text></Pressable>
      </View>}
      {sheet === 'filters' && <View style={s.filterBody}>
        <View style={s.filterModalHeader}><Text style={s.filterModalTitle}>Bộ lọc</Text><Pressable accessibilityRole="button" hitSlop={8} accessibilityLabel="Đặt lại bộ lọc" onPress={() => { setPriceBand('all'); setRating(0); setTypes([]); setSortBy('recommended'); setSortMenuVisible(false); setPriceMenuVisible(false); }}><Text style={s.filterModalReset}>Đặt lại</Text></Pressable></View>
        <ScrollView ref={filterScrollRef} onContentSizeChange={() => { if (sortMenuVisible) filterScrollRef.current?.scrollToEnd({ animated: true }); }} style={{ maxHeight: height * 0.52 }} contentContainerStyle={s.filterScroll} showsVerticalScrollIndicator={false}>
          <View style={[s.filterSection, s.priceSection]}><Text style={s.sectionTitle}>Khoảng giá / đêm</Text>
            <View style={s.priceTrackWrap}><Pressable accessibilityRole="button" accessibilityLabel={`Chọn khoảng giá: ${PRICES.find((price) => price.value === priceBand)!.label}`} accessibilityState={{ expanded: priceMenuVisible }} aria-expanded={priceMenuVisible} hitSlop={{ top: 20, bottom: 20 }} onPress={() => setPriceMenuVisible((visible) => !visible)} style={s.priceTrack}><View style={s.priceRail} /><View style={[s.priceTrackActive, { left: `${priceRange.start}%`, right: `${100 - priceRange.end}%` }]} /><View style={[s.priceThumb, { left: `${priceRange.start}%`, marginLeft: priceRange.start === 0 ? 0 : -12 }]} /><View style={[s.priceThumb, { left: `${priceRange.end}%`, marginLeft: priceRange.end === 100 ? -24 : -12 }]} /></Pressable><View style={s.priceEnds}><Text style={s.priceLabel}>{priceRangeLabels[0]}</Text><Text style={s.priceLabel}>{priceRangeLabels[1]}</Text></View>{priceMenuVisible && <View style={s.sortMenu}>{PRICES.map((price) => <Pressable key={price.value} accessibilityRole="radio" accessibilityState={{ checked: priceBand === price.value }} aria-checked={priceBand === price.value} onPress={() => { setPriceBand(price.value); setPriceMenuVisible(false); }} style={[s.sortMenuOption, priceBand === price.value && s.sortMenuOptionSelected]}><Text style={[s.sortMenuOptionText, priceBand === price.value && s.sortMenuOptionTextSelected]}>{price.label}</Text>{priceBand === price.value && <Check size={18} color={COLORS.primary} />}</Pressable>)}</View>}</View>
          </View>
          <View style={s.filterSection}><Text style={s.sectionTitle}>Điểm đánh giá tối thiểu</Text><View style={s.optionWrap}>{[0, 3, 4, 4.5, 4.8].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: rating === value }} aria-checked={rating === value} onPress={() => setRating(value)} style={[s.option, s.ratingOption, rating === value && s.starOptionActive]}><Text style={s.optionText}>{value ? `${value}+` : 'Tất cả'}</Text><Star width={13.333} height={12.667} fill="none" color={COLORS.textMuted} /></Pressable>)}</View></View>
          <View style={s.filterSection}><Text style={s.sectionTitle}>Loại chỗ ở</Text><View style={s.typeOptions}>{TYPES.map(({ value, label }) => <Pressable key={value} accessibilityRole="checkbox" accessibilityState={{ checked: types.includes(value) }} aria-checked={types.includes(value)} style={s.typeRow} onPress={() => toggleType(value)}><View style={[s.checkbox, types.includes(value) && s.checkboxChecked]}>{types.includes(value) && <Check size={20} strokeWidth={2.5} color={COLORS.bgWhite} />}</View><Text style={s.typeText}>{label}</Text></Pressable>)}</View></View>
          <View style={s.filterSection}><Text style={s.sectionTitle}>Sắp xếp</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: sortMenuVisible }} aria-expanded={sortMenuVisible} accessibilityLabel={`Sắp xếp: ${selectedSort.label}`} onPress={() => setSortMenuVisible((visible) => !visible)} style={s.sortSelect}><Text style={s.sortSelectText}>{selectedSort.label}</Text><View style={sortMenuVisible ? s.sortChevronOpen : undefined}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/filter-caret.svg')} width={12} height={7.4} nativeFallback={<ChevronDown size={12} color={COLORS.inkSubtle} />} /></View></Pressable>{sortMenuVisible && <View style={s.sortMenu}>{SORT_OPTIONS.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: option.value === sortBy }} aria-checked={option.value === sortBy} onPress={() => { setSortBy(option.value); setSortMenuVisible(false); }} style={[s.sortMenuOption, option.value === sortBy && s.sortMenuOptionSelected]}><Text style={[s.sortMenuOptionText, option.value === sortBy && s.sortMenuOptionTextSelected]}>{option.label}</Text>{option.value === sortBy && <Check size={18} color={COLORS.primary} />}</Pressable>)}</View>}</View>
        </ScrollView><View style={s.filterFooter}><Button title={`Áp dụng bộ lọc · ${results.length} chỗ ở`} size="lg" fullWidth onPress={apply} /></View>
      </View>}
    </BottomSheetWrapper>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm },
  iconButton: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 4 },
  headerTitle: { flexShrink: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  headerSubtitle: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 96, flexGrow: 1 },
  loadingList: { paddingTop: 16 },
  filterFab: { position: 'absolute', bottom: 16, alignSelf: 'center', width: 116, height: 44, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOWS.elevated_layer2 },
  filterFabText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  skeleton: { height: 144, marginBottom: 24, padding: 12, borderRadius: RADII.xl, overflow: 'hidden', backgroundColor: COLORS.bgWhite, flexDirection: 'row', gap: 12, ...SHADOWS.cardSoft },
  skeletonImage: { width: 110, height: 110, borderRadius: RADII.md, backgroundColor: '#E5EDED' },
  skeletonBody: { flex: 1, paddingTop: 16, gap: 14 },
  skeletonLine: { height: 16, width: 170, maxWidth: '100%', borderRadius: RADII.md, backgroundColor: '#E5EDED' },
  skeletonShort: { height: 12, width: 130, maxWidth: '100%', borderRadius: RADII.md, backgroundColor: '#E5EDED' },
  empty: { marginTop: 0, minHeight: 228, padding: 24, borderRadius: RADII.promo, gap: 16, backgroundColor: COLORS.bgWhite },
  emptyTitle: { minHeight: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  emptyDescription: { minHeight: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  emptyButton: { height: 48, minHeight: 48, marginTop: 0 },
  sheetBody: { gap: 12, paddingBottom: 4 },
  pickerTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  criteriaBody: { gap: 12 },
  criteriaTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, marginBottom: 0 },
  tile: { height: 84, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfacePale, justifyContent: 'center', gap: 6 },
  tileLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 16 },
  tileText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 22 },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  pickerCancel: { height: 36, alignItems: 'center', justifyContent: 'center' },
  pickerCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  pickerApplyText: { fontSize: 14, lineHeight: 20 },
  searchField: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.borderTealSoft, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceMint, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
  smallLabel: { color: '#596B66', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 12, lineHeight: 18 },
  destinationScroll: { maxHeight: 330 },
  destinationRow: { height: 52, paddingHorizontal: 14, marginBottom: 10, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceSage, flexDirection: 'row', alignItems: 'center', gap: 12 },
  destinationCopy: { flex: 1, minWidth: 0, height: 38, justifyContent: 'center' },
  destinationName: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  destinationProvince: { color: '#738580', fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  monthBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthButton: { width: 36, height: 36, borderRadius: RADII.full, backgroundColor: COLORS.surfaceSage, alignItems: 'center', justifyContent: 'center' },
  monthText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 16, lineHeight: 24 },
  weekdays: { height: 22, flexDirection: 'row', justifyContent: 'space-between' },
  calendar: { minHeight: 230, gap: 4 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: { textAlign: 'center', color: '#7A8C87', fontFamily: TYPOGRAPHY.families.medium, fontSize: 11, lineHeight: 18 },
  day: { borderRadius: RADII.full, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: COLORS.primaryActive },
  dayBetween: { backgroundColor: '#E0F2ED' },
  dayText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20 },
  dayTextSelected: { fontFamily: TYPOGRAPHY.families.semibold },
  dayTextActive: { color: COLORS.bgWhite },
  dayTextPast: { color: COLORS.borderSage },
  dateSummary: { height: 62, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#DBE8E3', backgroundColor: COLORS.surfacePale, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateSummaryCopy: { flex: 1, minWidth: 0, height: 42 },
  dateSummaryRange: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 22 },
  dateSummaryNights: { color: '#738580', fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  dateSummaryYear: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18, textAlign: 'right', width: 70 },
  counterRow: { height: 72, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#F9FCFA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterCopy: { flex: 1, minWidth: 0, height: 44 },
  counterHint: { color: '#738580', fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  counterControls: { width: 142, height: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterButton: { width: 36, height: 36, borderRadius: RADII.full, borderWidth: 1, borderColor: '#BAD1C9', backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center' },
  counterSymbol: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 20, lineHeight: 24 },
  counterValue: { width: 40, textAlign: 'center', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 16, lineHeight: 24 },
  filterBody: { gap: 0, marginHorizontal: -20 },
  filterModalHeader: { minHeight: 61, paddingHorizontal: 20, paddingBottom: 17, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  filterModalTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  filterModalReset: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  filterFooter: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4, borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.bgWhite, ...SHADOWS.stickyCTA_layer1 },
  filterScroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, gap: 32 },
  filterSection: { gap: 16 },
  priceSection: { gap: 32 },
  priceTrackWrap: { paddingHorizontal: 8, gap: 16 },
  priceTrack: { height: 4, position: 'relative', justifyContent: 'center' },
  priceRail: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  priceTrackActive: { position: 'absolute', height: 4, borderRadius: RADII.full, backgroundColor: COLORS.primary },
  priceThumb: { position: 'absolute', top: -10, marginLeft: -12, width: 24, height: 24, borderRadius: RADII.full, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSubtle },
  priceEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 44, paddingHorizontal: 17, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderSage, justifyContent: 'center' },
  optionActive: { borderColor: COLORS.actionTeal, backgroundColor: COLORS.actionTeal },
  starOptionActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(0, 95, 85, 0.1)' },
  optionText: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  optionTextActive: { color: COLORS.bgWhite },
  ratingOption: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeOptions: { gap: 8 },
  typeRow: { minHeight: 44, paddingLeft: 7, flexDirection: 'row', alignItems: 'center', gap: 15 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: COLORS.borderSage, borderRadius: RADII.lg, backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24 },
  sortSelect: { minHeight: 52, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.borderDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortSelectText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24 },
  sortChevronOpen: { transform: [{ rotate: '180deg' }] },
  sortMenu: { borderWidth: 1, borderTopWidth: 0, borderColor: COLORS.borderDark, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSubtle },
  sortMenuOption: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortMenuOptionSelected: { backgroundColor: COLORS.surfaceMint },
  sortMenuOptionText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  sortMenuOptionTextSelected: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold },
});
