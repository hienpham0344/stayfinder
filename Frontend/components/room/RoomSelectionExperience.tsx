import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, BedDouble, CircleCheck, Flame, ImageOff, Ruler, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';

type RoomFixture = {
  id: 'deluxe' | 'suite';
  name: string;
  price: string;
  guests: string;
  size: string;
  bed: string;
  amenities: string[];
  badge: 'High Demand' | 'Available';
  availability: string;
  image: number;
};

// Node 13:782 provides a local presentation fixture. Its selection index still
// maps to the route's existing room-tier id before Continue is pressed.
const FIGMA_ROOMS: RoomFixture[] = [
  {
    id: 'deluxe',
    name: 'Deluxe Ocean View',
    price: '$299',
    guests: '2-3 Guests',
    size: '450 sqft',
    bed: '1 King',
    amenities: ['Free Wi-Fi', 'Balcony', 'Mini Bar'],
    badge: 'High Demand',
    availability: '3 rooms left',
    image: require('../../assets/figma/se121-parity/room-selection/deluxe-ocean-view.jpeg'),
  },
  {
    id: 'suite',
    name: 'Premium Suite',
    price: '$450',
    guests: '2-4 Guests',
    size: '800 sqft',
    bed: '1 King, 1 Sofa',
    amenities: ['Lounge Access', 'Kitchenette', 'Free Wi-Fi'],
    badge: 'Available',
    availability: 'Instant Confirmation',
    image: require('../../assets/figma/se121-parity/room-selection/premium-suite.jpeg'),
  },
];

export function RoomSelectionExperience() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stay = MOCK_STAYS.find((item) => item.id === id) || MOCK_STAYS[0];
  const insets = useSafeAreaInsets();
  const compact = useUserWindowDimensions().width <= 340;
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [failedRoomId, setFailedRoomId] = useState<RoomFixture['id'] | null>(null);
  const selectedTierId = stay.roomTiers?.[selectedRoomIndex]?.id || stay.roomTiers?.[0]?.id || 'rt-std';

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <View style={styles.header}>
      <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
        <Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/back.svg')} width={16} nativeFallback={<ArrowLeft size={16} color={COLORS.inkSoft} />} />
      </Pressable>
      <Text style={styles.headerTitle}>StayFinder</Text>
      <View style={styles.back} />
    </View>
    <View style={styles.stepIndicator} accessibilityLabel="Step 1 of 4">{[0, 1, 2, 3].map((segment) => <View key={segment} style={[styles.stepSegment, segment === 0 && styles.stepSegmentActive]} />)}</View>
    <ScrollView contentContainerStyle={[styles.list, { paddingBottom: SIZES.stickyCta + insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      {FIGMA_ROOMS.map((room, index) => {
        const selected = index === selectedRoomIndex;
        const isSuite = room.id === 'suite';

        return <Pressable
          key={room.id}
          style={({ pressed }) => [styles.card, isSuite && styles.suiteCard, selected && styles.selectedCard, compact && styles.compactCard, pressed && styles.cardPressed]}
          onPress={() => setSelectedRoomIndex(index)}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={room.name + ', ' + room.price + ' per night'}
          aria-checked={selected}
        >
          <View style={styles.imageWrap}>
            {failedRoomId === room.id
              ? <ImageOff size={24} color={COLORS.textMuted} />
              : <Image source={room.image} style={styles.image} resizeMode="cover" onError={() => setFailedRoomId(room.id)} />}
            <View style={[styles.badge, room.badge === 'High Demand' ? styles.limitedBadge : styles.availableBadge]}>
              {room.badge === 'High Demand'
                ? <Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/high-demand.svg')} width={9.3333} height={11.0833} nativeFallback={<Flame size={11} color={COLORS.bgWhite} />} />
                : <Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/available.svg')} width={11.6667} height={11.6667} nativeFallback={<CircleCheck size={12} color={COLORS.bgWhite} />} />}
              <Text style={styles.badgeText}>{room.badge}</Text>
            </View>
          </View>
          <View style={[styles.cardBody, isSuite && styles.suiteCardBody, compact && styles.compactCardBody]}>
            <View style={styles.titleRow}>
              <Text style={[styles.roomTitle, compact && styles.compactRoomTitle]}>{room.name}</Text>
              <View style={styles.priceColumn}><Text style={styles.cardPrice}>{room.price}</Text><Text style={styles.night}>/ night</Text></View>
            </View>
            <View style={styles.specRow}>
              <View style={styles.spec}><Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/guests.svg')} width={12} nativeFallback={<Users size={16} color={COLORS.inkSoft} />} /><Text style={styles.specText}>{room.guests}</Text></View>
              <View style={styles.spec}><Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/size.svg')} width={12.7631} nativeFallback={<Ruler size={16} color={COLORS.inkSoft} />} /><Text style={styles.specText}>{room.size}</Text></View>
              <View style={styles.spec}><Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/bed.svg')} width={15} height={10.5} nativeFallback={<BedDouble size={16} color={COLORS.inkSoft} />} /><Text style={styles.specText} numberOfLines={1}>{room.bed}</Text></View>
            </View>
            <View style={styles.amenities}>{room.amenities.map((amenity) => <View key={amenity} style={styles.chip}><Text style={styles.chipText}>{amenity}</Text></View>)}</View>
            <View style={styles.cardFooter}>
              <View style={styles.availability}>
                {room.badge === 'High Demand'
                  ? <Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/rooms-left.svg')} width={14.6667} height={12.6667} nativeFallback={<Flame size={15} color={COLORS.errorDark} />} />
                  : <Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/instant-confirmation.svg')} width={10.6667} height={13.3333} nativeFallback={<CircleCheck size={15} color={COLORS.primary} />} />}
                <Text style={[styles.roomsLeft, room.badge === 'Available' && styles.instantConfirmation]}>{room.availability}</Text>
              </View>
              <View style={[styles.selectButton, selected && styles.selectButtonActive]}><Text style={[styles.selectText, selected && styles.selectTextActive]}>{selected ? 'Selected' : 'Select'}</Text></View>
            </View>
          </View>
        </Pressable>;
      })}
    </ScrollView>
    <View style={[styles.footer, { height: 84 + Math.max(0, insets.bottom - 16), paddingBottom: Math.max(16, insets.bottom) }]}>
      <View style={styles.footerPriceWrap}><Text style={styles.footerLabel}>Total for 3 nights</Text><Text style={styles.footerPrice}>$897.00</Text></View>
      <Pressable style={styles.continueButton} onPress={() => router.push('/booking/guest-info?id=' + stay.id + '&tierId=' + selectedTierId as never)} accessibilityLabel="Continue to guest information">
        <Text style={styles.continueText}>Continue</Text>
        <Se121SharedAsset source={require('../../assets/figma/se121-parity/room-selection/continue.svg')} width={12.4999} nativeFallback={<ArrowRight size={18} color={COLORS.bgWhite} />} />
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  stepIndicator: { height: 24, marginTop: 6, paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stepSegment: { flex: 1, height: 4, borderRadius: RADII.full, backgroundColor: COLORS.borderMuted },
  stepSegmentActive: { backgroundColor: COLORS.primary },
  list: { paddingHorizontal: SPACING.xl, paddingTop: 30, gap: 16 },
  card: { height: 400, borderRadius: RADII.xl, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.actionTeal, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  suiteCard: { height: 398, borderColor: '#E0E8F0', backgroundColor: 'rgba(11, 122, 109, 0.05)' },
  selectedCard: { borderColor: COLORS.actionTeal },
  compactCard: { height: undefined, minHeight: 400 },
  cardPressed: { opacity: 0.92 },
  imageWrap: { height: 192, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 16, left: 16, height: 24, paddingHorizontal: 12, borderRadius: RADII.full, flexDirection: 'row', alignItems: 'center', gap: 4, ...SHADOWS.cardSubtle },
  limitedBadge: { backgroundColor: COLORS.accentOrange },
  availableBadge: { backgroundColor: COLORS.primaryActive },
  badgeText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  cardBody: { height: 204, padding: 16, justifyContent: 'space-between' },
  suiteCardBody: { height: 202 },
  compactCardBody: { height: undefined, minHeight: 204 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  roomTitle: { flex: 1, color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  compactRoomTitle: { fontSize: 18, lineHeight: 24 },
  priceColumn: { alignItems: 'flex-end', gap: 5.5, paddingBottom: 2.5 },
  cardPrice: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  night: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  specRow: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%', flexShrink: 1 },
  specText: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  amenities: { minHeight: 36, marginTop: 8, paddingTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { minHeight: 26, maxWidth: '100%', paddingHorizontal: 13, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADII.full, justifyContent: 'center' },
  chipText: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  cardFooter: { height: 40, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  roomsLeft: { color: COLORS.errorDark, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  instantConfirmation: { color: COLORS.primary },
  selectButton: { height: 36, minWidth: 92, paddingHorizontal: 24, borderWidth: 1, borderColor: COLORS.primaryActive, borderRadius: RADII.full, backgroundColor: '#F1F4F2', alignItems: 'center', justifyContent: 'center' },
  selectButtonActive: { minWidth: 112, height: 38, paddingHorizontal: 25, backgroundColor: COLORS.primaryActive },
  selectText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  selectTextActive: { color: COLORS.bgWhite },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 84, paddingTop: 17, paddingHorizontal: SPACING.xl, backgroundColor: COLORS.bgWhite, borderTopWidth: 1, borderTopColor: COLORS.borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, ...SHADOWS.stickyFooter },
  footerPriceWrap: { flexShrink: 1 },
  footerLabel: { color: COLORS.textMuted, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  footerPrice: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  continueButton: { height: 52, minWidth: 143.5, paddingHorizontal: 24, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  continueText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
});
