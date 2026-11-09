import { MotionScreen } from '../ui/MotionScreen';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Map, MapPin, Search, SlidersHorizontal, Star, X } from '../../constants/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetWrapper } from '../ui/BottomSheetWrapper';
import { Button } from '../ui/Button';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
import { SearchResultCard } from './SearchResultCard';
import { STAY_CATALOG } from '../../constants/stayCatalog';
import { useBookingDraft } from '../../state/AppState';
import { SearchFilters, createDraft, dateKey, parseTravelDate, validTravelDates, formatDateRange, filterCatalog } from '../../utils/frontendState';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { Stay } from '../../types/stay';

type Sheet = 'criteria' | 'destination' | 'dates' | 'guests' | 'filters' | null;
type StayType = Stay['type'];
type SortBy = 'recommended' | 'price' | 'rating';
const TYPES: { value: StayType; label: string }[] = [
  { value: 'Hotel', label: 'Hotel' }, { value: 'Homestay', label: 'Homestay' },
  { value: 'Resort', label: 'Resort' }, { value: 'Villas', label: 'Villas' },
];
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'recommended', label: 'Best match' },
  { value: 'price', label: 'Price: low to high' },
  { value: 'rating', label: 'Top rated' },
];
const PRICE_STOPS = [
  { position: 0, price: 0 },
  { position: 20, price: 50 },
  { position: 27.19, price: 100 },
  { position: 62.82, price: 250 },
  { position: 70, price: 350 },
  { position: 100, price: 1000 },
];
const priceForPosition = (position: number) => {
  for (let index = 1; index < PRICE_STOPS.length; index += 1) {
    const from = PRICE_STOPS[index - 1];
    const to = PRICE_STOPS[index];
    if (position <= to.position) return from.price + ((position - from.position) / (to.position - from.position)) * (to.price - from.price);
  }
  return 1000;
};
const DESTINATIONS = [
  { city: 'Bali, Indonesia', country: 'Indonesia', recent: true },
  { city: 'Da Lat, Vietnam', country: 'Vietnam', recent: false },
  { city: 'Tokyo, Japan', country: 'Japan', recent: false },
  { city: 'Ho Chi Minh City, Vietnam', country: 'Vietnam', recent: false },
];
const normalHeaderBackAsset = require('../../assets/figma/search-completion/13-1213-header-back.svg');
const normalHeaderMapAsset = require('../../assets/figma/search-completion/13-1213-header-map.svg');
const INITIAL_DRAFT = createDraft();
const INITIAL_CHECK_IN = parseTravelDate(INITIAL_DRAFT.checkIn)!;
const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const MONTH_SHORT_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short' });
const dateLabel = (start: Date | null, end: Date | null) => !start ? 'Select travel dates' : end ? `${start.getDate()} ${MONTH_SHORT_FORMAT.format(start)} — ${end.getDate()} ${MONTH_SHORT_FORMAT.format(end)}` : `${start.getDate()} ${MONTH_SHORT_FORMAT.format(start)} — Select check-out`;
const criteriaDateLabel = (start: Date | null, end: Date | null) => start && end ? formatDateRange(dateKey(start), dateKey(end)) : 'Select travel dates';

export function SearchExperience() {
  const insets = useSafeAreaInsets();
  const { draft, patchDraft, beginBooking } = useBookingDraft();
  const [searchError, setSearchError] = useState('');
  const { entry, category } = useLocalSearchParams<{ entry?: string; category?: string }>();
  const { height, width } = useUserWindowDimensions();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [adults, setAdults] = useState(draft.adults);
  const [children, setChildren] = useState(draft.children);
  const [rooms, setRooms] = useState(draft.rooms);
  const [start, setStart] = useState<Date | null>(parseTravelDate(draft.checkIn));
  const [end, setEnd] = useState<Date | null>(parseTravelDate(draft.checkOut));
  const pickerSnapshot = useRef({ adults, children, rooms, start, end });
  const openPicker = (next: 'dates' | 'guests') => {
    pickerSnapshot.current = { adults, children, rooms, start, end };
    setSheet(next);
  };
  const cancelPicker = () => {
    const saved = pickerSnapshot.current;
    setAdults(saved.adults); setChildren(saved.children); setRooms(saved.rooms);
    setStart(saved.start); setEnd(saved.end); setSearchError(''); setSheet('criteria');
  };
  const [monthOffset, setMonthOffset] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minPosition, setMinPosition] = useState(0);
  const [maxPosition, setMaxPosition] = useState(100);
  const [rating, setRating] = useState(0);
  const [types, setTypes] = useState<StayType[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('recommended');
  const [applied, setApplied] = useState<SearchFilters>({ destination: '', adults: draft.adults, children: draft.children, rooms: draft.rooms, minPrice: 0, maxPrice: 1000, rating: 0, types: [], amenities: [], sortBy: 'recommended' });
  useEffect(() => {
    if (category !== 'all' && !TYPES.some((item) => item.value === category)) return;
    const selected: StayType[] = category === 'all' ? [] : [category as StayType];
    setTypes(selected);
    setApplied((current) => ({ ...current, types: selected }));
  }, [category]);
  const appliedPositions = useRef({ min: 0, max: 100 });
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const filterScrollRef = useRef<ScrollView>(null);
  const priceTrackWidth = useRef(334);
  const priceTrackX = useRef(28);
  const priceTrackRef = useRef<View>(null);
  const pricePositions = useRef({ min: 0, max: 100 });
  const activePriceThumb = useRef<'min' | 'max'>('min');
  const setPriceAt = (pageX: number) => {
    const position = Math.max(0, Math.min(100, ((pageX - priceTrackX.current) / priceTrackWidth.current) * 100));
    if (activePriceThumb.current === 'min') {
      const next = Math.min(position, pricePositions.current.max - 3);
      pricePositions.current.min = next;
      setMinPosition(next);
      setMinPrice(Math.max(0, Math.min(1000, Math.round(priceForPosition(next) / 10) * 10)));
    } else {
      const next = Math.max(position, pricePositions.current.min + 3);
      pricePositions.current.max = next;
      setMaxPosition(next);
      setMaxPrice(Math.max(0, Math.min(1000, Math.round(priceForPosition(next) / 10) * 10)));
    }
  };
  const priceResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const position = ((event.nativeEvent.pageX - priceTrackX.current) / priceTrackWidth.current) * 100;
      activePriceThumb.current = Math.abs(position - pricePositions.current.min) <= Math.abs(position - pricePositions.current.max) ? 'min' : 'max';
      setPriceAt(event.nativeEvent.pageX);
    },
    onPanResponderMove: (_, gesture) => setPriceAt(gesture.moveX),
  })).current;
  useEffect(() => {
    if (entry === 'criteria' || entry === 'filters' || entry === 'destination') {
      setSheet(entry);
      router.setParams({ entry: undefined, origin: undefined });
    }
  }, [entry]);
  useEffect(() => {
    setSortMenuVisible(false);
  }, [sheet]);

  const resetFilters = () => {
    pricePositions.current = { min: 0, max: 100 };
    setMinPosition(0);
    setMaxPosition(100);
    setMinPrice(0);
    setMaxPrice(1000);
    setRating(0);
    setTypes([]);
    setAmenities([]);
    setSortBy('recommended');
    setSortMenuVisible(false);
  };

  const results = useMemo(() => filterCatalog(STAY_CATALOG, applied), [applied]);
  const month = new Date(INITIAL_CHECK_IN.getFullYear(), INITIAL_CHECK_IN.getMonth() + monthOffset, 1);
  const emptyDays = (month.getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: emptyDays + dayCount }, (_, index) => index - emptyDays + 1);
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));
  const daySize = Math.min(42, (width - 40) / 7);
  const nights = start && end ? Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000) : null;
  const apply = () => {
    if (!start || !end || !validTravelDates(dateKey(start), dateKey(end))) { setSearchError('Select a check-in from today and a later check-out.'); setSheet('dates'); return; }
    setApplied({ destination, adults, children, rooms, minPrice, maxPrice, rating, types: [...types], amenities: [...amenities], sortBy });
    appliedPositions.current = { min: minPosition, max: maxPosition };
    patchDraft({ checkIn: dateKey(start), checkOut: dateKey(end), adults, children, rooms });
    setSearchError(''); setSheet(null);
  };
  const closeSheet = () => {
    setDestination(applied.destination); setAdults(applied.adults); setChildren(applied.children); setRooms(applied.rooms);
    setMinPrice(applied.minPrice); setMaxPrice(applied.maxPrice); setRating(applied.rating); setTypes([...applied.types]); setAmenities([...applied.amenities]); setSortBy(applied.sortBy);
    pricePositions.current = { ...appliedPositions.current }; setMinPosition(appliedPositions.current.min); setMaxPosition(appliedPositions.current.max);
    setStart(parseTravelDate(draft.checkIn)); setEnd(parseTravelDate(draft.checkOut)); setSearchError(''); setSheet(null);
  };
  const chooseDate = (day: number) => {
    const selected = new Date(month.getFullYear(), month.getMonth(), day);
    if (dateKey(selected) < dateKey(new Date())) return;
    if (!start || end || selected <= start) { setStart(selected); setEnd(null); } else setEnd(selected);
  };
  const toggleType = (type: StayType) => setTypes((previous) => previous.includes(type) ? previous.filter((item) => item !== type) : [...previous, type]);
  const toggleAmenity = (amenity: string) => setAmenities((previous) => previous.includes(amenity) ? previous.filter((item) => item !== amenity) : [...previous, amenity]);
  const selectedSort = SORT_OPTIONS.find((option) => option.value === sortBy)!;
  const criteriaDates = sheet ? criteriaDateLabel(start, end) : formatDateRange(draft.checkIn, draft.checkOut);
  const availableDestinations = DESTINATIONS.filter((item) => item.city.toLowerCase().includes(destinationQuery.trim().toLowerCase()) || item.country.toLowerCase().includes(destinationQuery.trim().toLowerCase()));

  return <MotionScreen style={[s.screen, { paddingTop: insets.top }]}>
    <View style={s.header}>
      <Pressable style={s.iconButton} accessibilityRole="button" accessibilityLabel="Về trang chủ" onPress={() => router.replace('/')}>
        <Se121SharedAsset source={normalHeaderBackAsset} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.primary} />} />
      </Pressable>
      <Pressable style={s.headerCenter} accessibilityRole="button" accessibilityLabel="Edit search criteria" onPress={() => setSheet('criteria')}><Text numberOfLines={1} style={s.headerTitle}>{applied.destination || 'Anywhere'}</Text><Text numberOfLines={1} style={s.headerSubtitle}>{criteriaDates} · {applied.adults + applied.children} guests · {applied.rooms} room{applied.rooms > 1 ? 's' : ''}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Edit destination" onPress={() => setSheet('destination')} style={s.iconButton}><Se121SharedAsset source={normalHeaderMapAsset} width={18} nativeFallback={<Map size={18} color={COLORS.primary} />} /></Pressable>
    </View>
      <FlatList ListHeaderComponent={<Text style={{ color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, marginBottom: 16 }}>{results.length} stays · {applied.destination || 'All destinations'}</Text>} data={results} keyExtractor={(item) => item.id} renderItem={({ item }) => <SearchResultCard stay={item} onPress={() => { beginBooking(item.id, item.matchedTierId); router.push(`/room/${item.id}` as never); }} />} contentContainerStyle={s.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTitle}>No stays found</Text><Text style={s.emptyDescription}>Try another destination or adjust your dates to find a stay that works for you.</Text><Button title="Change search" size="md" fullWidth onPress={() => { resetFilters(); setSheet('criteria'); }} style={s.emptyButton} /></View>} />
    {results.length > 0 && <Pressable style={s.filterFab} accessibilityRole="button" accessibilityLabel="Open filters" onPress={() => setSheet('filters')}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/search-fab.svg')} width={18} nativeFallback={<SlidersHorizontal size={18} color={COLORS.onPrimary} />} /><Text style={s.filterFabText}>Filters</Text></Pressable>}

    <BottomSheetWrapper visible={sheet !== null} onClose={closeSheet} variant={sheet === 'criteria' ? 'searchCriteria' : sheet === 'filters' ? 'searchFilters' : sheet === 'destination' ? 'searchDestination' : sheet === 'dates' ? 'searchDates' : sheet === 'guests' ? 'searchGuests' : undefined}>
      {sheet === 'criteria' && <View style={s.criteriaBody}>
        <Text style={s.criteriaTitle}>Find your stay</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose destination" style={s.tile} onPress={() => setSheet('destination')}><Text style={s.tileLabel}>Destination</Text><Text style={s.tileText}>{destination || 'Anywhere'}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose dates" style={s.tile} onPress={() => openPicker('dates')}><Text style={s.tileLabel}>Dates</Text><Text style={s.tileText}>{criteriaDates}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose guests and rooms" style={s.tile} onPress={() => openPicker('guests')}><Text style={s.tileLabel}>Guests & rooms</Text><Text style={s.tileText}>{`${adults} adults · ${children} ${children === 1 ? 'child' : 'children'} · ${rooms} room${rooms === 1 ? '' : 's'}`}</Text></Pressable>
        <Button title="Search stays" size="md" fullWidth onPress={apply} /><Pressable style={s.cancel} onPress={closeSheet} accessibilityRole="button"><Text style={s.cancelText}>Cancel</Text></Pressable>
      </View>}
      {sheet === 'destination' && <View style={s.sheetBody}>
        <Text style={s.pickerTitle}>Choose destination</Text>
        <View style={s.searchField}><Search size={20} color={COLORS.inkSubtle} /><TextInput value={destinationQuery} onChangeText={setDestinationQuery} placeholder="Search city, country, or property" placeholderTextColor={COLORS.inkSubtle} style={s.searchInput} />{destinationQuery.length > 0 && <Pressable onPress={() => setDestinationQuery('')} accessibilityLabel="Clear destination search" accessibilityRole="button"><X size={20} color={COLORS.inkSubtle} /></Pressable>}</View>
        {!!destinationQuery.trim() && <Pressable accessibilityRole="button" accessibilityLabel={`Search for ${destinationQuery.trim()}`} style={s.destinationRow} onPress={() => { setDestination(destinationQuery.trim()); setDestinationQuery(''); setSheet('criteria'); }}><Search size={20} color={COLORS.primary} /><Text style={s.destinationName}>Search for “{destinationQuery.trim()}”</Text></Pressable>}
        <ScrollView style={s.destinationScroll} contentContainerStyle={s.destinationList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {availableDestinations.some((item) => item.recent) && <Text style={s.smallLabel}>Recent searches</Text>}
          {availableDestinations.filter((item) => item.recent).map((item) => <Pressable key={item.city} style={s.destinationRow} onPress={() => { setDestination(item.city); setDestinationQuery(''); setSheet('criteria'); }} accessibilityRole="button" accessibilityLabel={item.city}><MapPin size={20} color={COLORS.primary} /><View style={s.destinationCopy}><Text numberOfLines={1} style={s.destinationName}>{item.city}</Text><Text numberOfLines={1} style={s.destinationProvince}>{item.country}</Text></View></Pressable>)}
          {availableDestinations.some((item) => !item.recent) && <Text style={s.smallLabel}>Popular destinations</Text>}
          {availableDestinations.filter((item) => !item.recent).map((item) => <Pressable key={item.city} style={s.destinationRow} onPress={() => { setDestination(item.city); setDestinationQuery(''); setSheet('criteria'); }} accessibilityRole="button" accessibilityLabel={item.city}><MapPin size={20} color={COLORS.primary} /><View style={s.destinationCopy}><Text numberOfLines={1} style={s.destinationName}>{item.city}</Text><Text numberOfLines={1} style={s.destinationProvince}>{item.country}</Text></View></Pressable>)}
        </ScrollView>
      </View>}
      {sheet === 'dates' && <View style={s.sheetBody}>
        <Text style={s.pickerTitle}>Select travel dates</Text>
        <View style={s.monthBar}><Pressable style={s.monthButton} accessibilityRole="button" accessibilityLabel="Previous month" disabled={monthOffset === 0} accessibilityState={{ disabled: monthOffset === 0 }} onPress={() => setMonthOffset(Math.max(0, monthOffset - 1))} aria-disabled={monthOffset === 0}><ChevronLeft size={18} color={COLORS.primary} /></Pressable><Text style={s.monthText}>{MONTH_FORMAT.format(month)}</Text><Pressable style={s.monthButton} accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonthOffset(monthOffset + 1)}><ChevronRight size={18} color={COLORS.primary} /></Pressable></View>
        <View style={s.weekdays}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={[s.weekday, { width: Math.min(38, daySize) }]}>{day}</Text>)}</View>
        <View style={s.calendar}>{weeks.map((week, weekIndex) => <View key={weekIndex} style={s.week}>{Array.from({ length: 7 }, (_, index) => { const day = week[index] ?? 0; const date = new Date(month.getFullYear(), month.getMonth(), day); const active = day > 0 && (start?.getTime() === date.getTime() || end?.getTime() === date.getTime()); const between = day > 0 && start && end && date > start && date < end; return <Pressable key={index} accessibilityRole="button" accessibilityLabel={day > 0 ? dateKey(date) : undefined} accessibilityState={{ disabled: day < 1 || dateKey(date) < dateKey(new Date()), selected: active }} disabled={day < 1 || dateKey(date) < dateKey(new Date())} onPress={() => chooseDate(day)} style={[s.day, { width: daySize, height: daySize }, active && s.dayActive, between && s.dayBetween]} aria-disabled={day < 1 || dateKey(date) < dateKey(new Date())} aria-pressed={active}><Text style={[s.dayText, day > 0 && dateKey(date) < dateKey(new Date()) && { opacity: 0.3 }, (active || between) && s.dayTextSelected, active && s.dayTextActive]}>{day > 0 ? day : ''}</Text></Pressable>; })}</View>)}</View>
        {!!searchError && <Text accessibilityRole="alert" style={{ color: COLORS.error, marginBottom: 8 }}>{searchError}</Text>}<View style={s.dateSummary}><View style={s.dateSummaryCopy}><Text numberOfLines={1} style={s.dateSummaryRange}>{dateLabel(start, end)}</Text>{nights !== null && <Text style={s.dateSummaryNights}>{nights} nights</Text>}</View>{start && <Text style={s.dateSummaryYear}>{start.getFullYear()}{end && end.getFullYear() !== start.getFullYear() ? `–${end.getFullYear()}` : ''}</Text>}</View><Button title="Apply" size="md" fullWidth textStyle={s.pickerApplyText} disabled={!start || !end || !validTravelDates(dateKey(start), dateKey(end))} onPress={() => setSheet('criteria')} /><Pressable hitSlop={{ top: 6, bottom: 6 }} style={s.pickerCancel} onPress={cancelPicker} accessibilityRole="button"><Text style={s.pickerCancelText}>Cancel</Text></Pressable>
      </View>}
      {sheet === 'guests' && <View style={s.sheetBody}>
        <Text style={s.pickerTitle}>Guests & rooms</Text>
        {([{ label: 'Adults', hint: 'Age 18+', value: adults, minimum: 1, setter: setAdults }, { label: 'Children', hint: 'Ages 0–17', value: children, minimum: 0, setter: setChildren }, { label: 'Rooms', hint: 'Rooms needed', value: rooms, minimum: 1, setter: setRooms }] as const).map(({ label, hint, value, minimum, setter }) => <View key={label} style={s.counterRow}><View style={s.counterCopy}><Text numberOfLines={1} style={s.tileText}>{label}</Text><Text numberOfLines={1} style={s.counterHint}>{hint}</Text></View><View style={s.counterControls}><Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label.toLocaleLowerCase('en-US')}`} accessibilityState={{ disabled: value <= minimum }} disabled={value <= minimum} hitSlop={6} style={s.counterButton} onPress={() => setter(Math.max(minimum, value - 1))} aria-disabled={value <= minimum}><Text style={s.counterSymbol}>−</Text></Pressable><Text style={s.counterValue}>{value}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label.toLocaleLowerCase('en-US')}`} accessibilityState={{ disabled: value >= 12 }} disabled={value >= 12} hitSlop={6} style={s.counterButton} onPress={() => setter(Math.min(12, value + 1))} aria-disabled={value >= 12}><Text style={s.counterSymbol}>+</Text></Pressable></View></View>)}
        <Button title="Apply" size="md" fullWidth textStyle={s.pickerApplyText} onPress={() => setSheet('criteria')} /><Pressable hitSlop={{ top: 6, bottom: 6 }} style={s.pickerCancel} onPress={cancelPicker} accessibilityRole="button"><Text style={s.pickerCancelText}>Cancel</Text></Pressable>
      </View>}
      {sheet === 'filters' && <View style={s.filterBody}>
        <View style={s.filterModalHeader}><Text style={s.filterModalTitle}>Filters</Text><Pressable accessibilityRole="button" hitSlop={8} accessibilityLabel="Reset filters" onPress={resetFilters}><Text style={s.filterModalReset}>Reset</Text></Pressable></View>
        <ScrollView ref={filterScrollRef} onContentSizeChange={() => { if (sortMenuVisible) filterScrollRef.current?.scrollToEnd({ animated: true }); }} style={{ maxHeight: Math.min(443, height * 0.525) }} contentContainerStyle={s.filterScroll} showsVerticalScrollIndicator={false}>
          <View style={[s.filterSection, s.priceSection]}><Text style={s.sectionTitle}>Price Range</Text>
            <View style={s.priceTrackWrap}><View ref={priceTrackRef} {...priceResponder.panHandlers} onLayout={(event) => { priceTrackWidth.current = event.nativeEvent.layout.width; priceTrackRef.current?.measureInWindow((x) => { priceTrackX.current = x; }); }} accessibilityRole="adjustable" accessibilityLabel={`Price range $${minPrice} to $${maxPrice}`} accessibilityValue={{ min: 0, max: 1000, now: maxPrice }} accessibilityActions={[{ name: 'increment', label: 'Increase maximum price' }, { name: 'decrement', label: 'Decrease maximum price' }]} onAccessibilityAction={(event) => { const next = Math.max(minPrice, Math.min(1000, maxPrice + (event.nativeEvent.actionName === 'increment' ? 10 : -10))); setMaxPrice(next); const stop = PRICE_STOPS.findIndex((item) => item.price >= next); const upper = PRICE_STOPS[Math.max(1, stop)]; const lower = PRICE_STOPS[Math.max(0, stop - 1)]; const position = lower.position + (next - lower.price) / (upper.price - lower.price) * (upper.position - lower.position); setMaxPosition(position); pricePositions.current.max = position; }} style={s.priceTrack}><View style={s.priceRail} /><View style={[s.priceTrackActive, { left: `${minPosition}%`, right: `${100 - maxPosition}%` }]} /><View style={[s.priceThumb, { left: `${minPosition}%`, marginLeft: -12 }]} /><View style={[s.priceThumb, { left: `${maxPosition}%`, marginLeft: -12 }]} /></View><View style={s.priceEnds}><Text style={s.priceLabel}>${minPrice}</Text><Text style={s.priceLabel}>${maxPrice}</Text></View></View>
          </View>
          <View style={s.filterSection}><Text style={s.sectionTitle}>Star Rating</Text><View style={s.optionWrap}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: rating === value }} aria-checked={rating === value} onPress={() => setRating(rating === value ? 0 : value)} style={[s.option, s.ratingOption, rating === value && s.starOptionActive]}><Text style={s.optionText}>{value}</Text><Star width={13.333} height={12.667} fill="none" color={COLORS.textMuted} /></Pressable>)}</View></View>
          <View style={s.filterSection}><Text style={s.sectionTitle}>Property Type</Text><View style={s.typeOptions}>{TYPES.map(({ value, label }) => <Pressable key={value} accessibilityRole="checkbox" accessibilityState={{ checked: types.includes(value) }} aria-checked={types.includes(value)} style={s.typeRow} onPress={() => toggleType(value)}><View style={[s.checkbox, types.includes(value) && s.checkboxChecked]}>{types.includes(value) && <Check size={20} strokeWidth={2.5} color={COLORS.onPrimary} />}</View><Text style={s.typeText}>{label}</Text></Pressable>)}</View></View>
          <View style={s.filterSection}><Text style={s.sectionTitle}>Amenities</Text><View style={s.typeOptions}>{['Wi-Fi', 'Pool', 'Breakfast', 'Parking'].map((amenity) => <Pressable key={amenity} accessibilityRole="checkbox" accessibilityState={{ checked: amenities.includes(amenity) }} aria-checked={amenities.includes(amenity)} style={s.typeRow} onPress={() => toggleAmenity(amenity)}><View style={[s.checkbox, amenities.includes(amenity) && s.checkboxChecked]}>{amenities.includes(amenity) && <Check size={20} strokeWidth={2.5} color={COLORS.onPrimary} />}</View><Text style={s.typeText}>{amenity}</Text></Pressable>)}</View></View>
          <View style={s.filterSection}><Text style={s.sectionTitle}>Sort By</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: sortMenuVisible }} aria-expanded={sortMenuVisible} accessibilityLabel={`Sort by: ${selectedSort.label}`} onPress={() => setSortMenuVisible((visible) => !visible)} style={s.sortSelect}><Text style={s.sortSelectText}>{selectedSort.label}</Text><View style={sortMenuVisible ? s.sortChevronOpen : undefined}><Se121SharedAsset source={require('../../assets/figma/exhaust-account-completion/filter-caret.svg')} width={12} height={7.4} nativeFallback={<ChevronDown size={12} color={COLORS.inkSubtle} />} /></View></Pressable>{sortMenuVisible && <View style={s.sortMenu}>{SORT_OPTIONS.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: option.value === sortBy }} aria-checked={option.value === sortBy} onPress={() => { setSortBy(option.value); setSortMenuVisible(false); }} style={[s.sortMenuOption, option.value === sortBy && s.sortMenuOptionSelected]}><Text style={[s.sortMenuOptionText, option.value === sortBy && s.sortMenuOptionTextSelected]}>{option.label}</Text>{option.value === sortBy && <Check size={18} color={COLORS.primary} />}</Pressable>)}</View>}</View>
        </ScrollView><View style={s.filterFooter}><Button title="Apply Filters" size="lg" fullWidth onPress={apply} /></View>
      </View>}
    </BottomSheetWrapper>
  </MotionScreen>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm },
  iconButton: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 4 },
  headerTitle: { flexShrink: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  headerSubtitle: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 96, flexGrow: 1 },
  filterFab: { position: 'absolute', bottom: 16, alignSelf: 'center', width: 116, height: 44, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOWS.elevated_layer2 },
  filterFabText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  empty: { marginTop: 0, minHeight: 228, padding: 24, borderRadius: RADII.promo, gap: 16, backgroundColor: COLORS.bgSurface },
  emptyTitle: { minHeight: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  emptyDescription: { minHeight: 50, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  emptyButton: { height: 48, minHeight: 48, marginTop: 0 },
  sheetBody: { gap: 12, paddingBottom: 4 },
  pickerTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  criteriaBody: { gap: 12 },
  criteriaTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, marginBottom: 0 },
  tile: { height: 84, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderControl, backgroundColor: COLORS.surfacePale, justifyContent: 'flex-start', gap: 6 },
  tileLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 12, lineHeight: 16 },
  tileText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 22 },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  pickerCancel: { height: 36, alignItems: 'center', justifyContent: 'center' },
  pickerCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  pickerApplyText: { fontSize: 14, lineHeight: 20 },
  searchField: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.borderControl, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceMint, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
  smallLabel: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 12, lineHeight: 18 },
  destinationScroll: { maxHeight: 330 },
  destinationList: { gap: 12 },
  destinationRow: { height: 52, paddingHorizontal: 14, borderRadius: RADII.lg, backgroundColor: COLORS.surfaceSage, flexDirection: 'row', alignItems: 'center', gap: 12 },
  destinationCopy: { flex: 1, minWidth: 0, height: 38, justifyContent: 'center' },
  destinationName: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  destinationProvince: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  monthBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthButton: { width: 36, height: 36, borderRadius: RADII.full, backgroundColor: COLORS.surfaceSage, alignItems: 'center', justifyContent: 'center' },
  monthText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 16, lineHeight: 24 },
  weekdays: { height: 22, flexDirection: 'row', justifyContent: 'space-between' },
  calendar: { minHeight: 230, gap: 4 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: { textAlign: 'center', color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11, lineHeight: 18 },
  day: { borderRadius: RADII.full, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: COLORS.primaryActive },
  dayBetween: { backgroundColor: COLORS.bgSecondary },
  dayText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20 },
  dayTextSelected: { fontFamily: TYPOGRAPHY.families.semibold },
  dayTextActive: { color: COLORS.onPrimary },
  dayTextPast: { color: COLORS.borderSage },
  dateSummary: { height: 62, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderControl, backgroundColor: COLORS.surfacePale, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateSummaryCopy: { flex: 1, minWidth: 0, height: 42 },
  dateSummaryRange: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 22 },
  dateSummaryNights: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  dateSummaryYear: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18, textAlign: 'right', width: 70 },
  counterRow: { height: 72, paddingHorizontal: 14, borderRadius: 14, backgroundColor: COLORS.bgSurface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterCopy: { flex: 1, minWidth: 0, height: 44 },
  counterHint: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 16 },
  counterControls: { width: 142, height: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterButton: { width: 36, height: 36, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderControl, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center' },
  counterSymbol: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.medium, fontSize: 20, lineHeight: 24 },
  counterValue: { width: 40, textAlign: 'center', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 16, lineHeight: 24 },
  filterBody: { gap: 0, marginHorizontal: -20 },
  filterModalHeader: { minHeight: 61, paddingHorizontal: 20, paddingBottom: 17, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  filterModalTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  filterModalReset: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  filterFooter: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.bgSurface, ...SHADOWS.stickyCTA_layer1 },
  filterScroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, gap: 40 },
  filterSection: { gap: 16 },
  priceSection: { gap: 32 },
  priceTrackWrap: { paddingHorizontal: 8, gap: 16 },
  priceTrack: { height: 24, marginTop: -10, marginBottom: -10, position: 'relative' },
  priceRail: { position: 'absolute', left: 0, right: 0, top: 10, height: 4, borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  priceTrackActive: { position: 'absolute', top: 10, height: 4, borderRadius: RADII.full, backgroundColor: COLORS.primary },
  priceThumb: { position: 'absolute', top: 0, width: 24, height: 24, borderRadius: RADII.full, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.bgSurface, ...SHADOWS.cardSubtle },
  priceEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 44, width: 60, paddingHorizontal: 11, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderControl, justifyContent: 'center' },
  optionActive: { borderColor: COLORS.actionTeal, backgroundColor: COLORS.actionTeal },
  starOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  optionText: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  optionTextActive: { color: COLORS.onPrimary },
  ratingOption: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeOptions: { gap: 8 },
  typeRow: { minHeight: 44, paddingLeft: 7, flexDirection: 'row', alignItems: 'center', gap: 15 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: COLORS.borderControl, borderRadius: RADII.lg, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24 },
  sortSelect: { minHeight: 52, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.borderControl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortSelectText: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24 },
  sortChevronOpen: { transform: [{ rotate: '180deg' }] },
  sortMenu: { borderWidth: 1, borderTopWidth: 0, borderColor: COLORS.borderControl, backgroundColor: COLORS.bgSurface, ...SHADOWS.cardSubtle },
  sortMenuOption: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortMenuOptionSelected: { backgroundColor: COLORS.surfaceMint },
  sortMenuOptionText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  sortMenuOptionTextSelected: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold },
});
