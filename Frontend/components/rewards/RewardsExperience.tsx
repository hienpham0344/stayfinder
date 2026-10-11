import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BedDouble, ChevronRight, CircleHelp, Coffee, Hotel, Sparkles, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { UserBottomNavigation } from '../ui/UserBottomNavigation';
import { Se121SharedAsset } from '../ui/Se121SharedAssets';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';

type Sheet = 'choice' | 'catalog' | 'dialog' | null;
type Reward = { id: 'breakfast' | 'upgrade' | 'spa'; title: string; description: string; points: string; accent: 'coral' | 'teal' | 'aqua'; asset: number; width: number; height: number; fallback: React.ReactElement };
type HistoryEntry = { id: string; title: string; detail: string; amount: string; kind: 'earned' | 'spent' | 'bonus' };
type RewardsDialog = { title: string; description: string; primary: string; kind: 'details' | 'earn-more' | 'claim'; reward?: Reward };

const REWARDS: Reward[] = [
  { id: 'breakfast', title: 'Free Breakfast', description: 'Enjoy a complimentary breakfast for two at selected premium stays.', points: '5,000', accent: 'coral', asset: require('../../assets/figma/se121-parity/rewards/breakfast.svg'), width: 18, height: 18, fallback: <Coffee size={18} color={COLORS.accentOrange} /> },
  { id: 'upgrade', title: 'Room Upgrade', description: 'Upgrade to the next room category subject to availability.', points: '12,000', accent: 'teal', asset: require('../../assets/figma/se121-parity/rewards/room-upgrade.svg'), width: 13, height: 17, fallback: <BedDouble size={17} color={COLORS.primaryActive} /> },
  { id: 'spa', title: '$50 Spa Credit', description: 'Relax and unwind with a $50 credit towards spa services.', points: '8,500', accent: 'aqua', asset: require('../../assets/figma/se121-parity/rewards/spa.svg'), width: 20, height: 20, fallback: <Sparkles size={20} color={COLORS.actionTeal} /> },
];
const HISTORY: HistoryEntry[] = [
  { id: 'grand-budapest', title: 'Stay at The Grand Budapest', detail: 'Oct 24, 2023 • Earned', amount: '+2,500', kind: 'earned' },
  { id: 'room-upgrade', title: 'Redeemed Room Upgrade', detail: 'Oct 15, 2023 • Spent', amount: '-12,000', kind: 'spent' },
  { id: 'anniversary', title: 'Bonus: Anniversary', detail: 'Sep 01, 2023 • Earned', amount: '+1,000', kind: 'bonus' },
  { id: 'oceanview', title: 'Stay at Oceanview Resort', detail: 'Aug 12, 2023 • Earned', amount: '+4,200', kind: 'earned' },
];

function RewardsSheet({ visible, onClose, title, children, height }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; height?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, visible]);
  return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}><View style={styles.sheetRoot}><Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close sheet" /><Animated.View style={[styles.sheetCard, height ? { height } : undefined, { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height || 268, 0] }) }] }]}><Text style={styles.sheetTitle}>{title}</Text>{children}</Animated.View></View></Modal>;
}

export function RewardsExperience() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useUserWindowDimensions();
  const compact = width <= 340;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [points, setPoints] = useState(24500);
  const [history, setHistory] = useState<HistoryEntry[]>(HISTORY);
  const [dialog, setDialog] = useState<RewardsDialog>({ title: 'About StayFinder Rewards', description: 'Earn points after completed stays. Claim rewards from the catalog when you have enough points.', primary: 'Done', kind: 'details' });
  const [toast, setToast] = useState<string | null>(null);
  const toastProgress = useRef(new Animated.Value(0)).current;
  const dialogProgress = useRef(new Animated.Value(0)).current;
  const cardWidth = Math.max(280, width - (SPACING.xl * 2));
  const openDialog = (nextDialog: RewardsDialog) => { setDialog(nextDialog); setSheet('dialog'); };
  const openClaim = (reward: Reward) => {
    const cost = Number(reward.points.replace(',', ''));
    openDialog(points < cost
      ? { title: 'Not enough points', description: 'Earn more points from completed bookings to unlock this reward.', primary: 'Done', kind: 'details' }
      : { title: 'Claim reward?', description: `Redeem ${cost} points for this reward?`, primary: 'Confirm claim', kind: 'claim', reward });
  };
  const confirmDialog = () => {
    setSheet(null);
    if (dialog.kind === 'earn-more') { router.push('/'); return; }
    if (dialog.kind !== 'claim' || !dialog.reward) return;
    const cost = Number(dialog.reward.points.replace(',', ''));
    if (points < cost) return;
    setPoints((current) => current - cost);
    setHistory((current) => [{
      id: `claimed-${dialog.reward!.id}-${Date.now()}`,
      title: `Redeemed ${dialog.reward!.title}`,
      detail: 'Just now · Spent',
      amount: `-${dialog.reward!.points}`,
      kind: 'spent',
    }, ...current]);
    setToast('Reward claimed');
  };
  useEffect(() => {
    if (sheet !== 'dialog') return;
    dialogProgress.setValue(0);
    const animation = Animated.timing(dialogProgress, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [dialogProgress, sheet]);
  useEffect(() => {
    if (!toast) return;
    toastProgress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(toastProgress, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1520),
      Animated.timing(toastProgress, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => { if (finished) setToast(null); });
    return () => animation.stop();
  }, [toast, toastProgress]);

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headingRow}><View style={styles.headingCopy}><Text style={styles.title}>Rewards Wallet</Text><Text style={styles.subtitle}>Manage your StayFinder points and{`\n`}perks.</Text></View><Pressable style={styles.helpButton} onPress={() => openDialog({ title: 'About StayFinder Rewards', description: 'Earn points after completed stays. Claim rewards from the catalog when you have enough points.', primary: 'Done', kind: 'details' })} accessibilityRole="button" accessibilityLabel="Learn about rewards points"><Se121SharedAsset source={require('../../assets/figma/se121-parity/rewards/help.svg')} width={20} nativeFallback={<CircleHelp size={20} color={COLORS.primary} />} /></Pressable></View>
      <View style={styles.balanceCard}>{Platform.OS !== 'web' && <Svg style={StyleSheet.absoluteFill} width="100%" height="100%"><Defs><LinearGradient id="rewardsBalanceGradient" x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0" stopColor={COLORS.primaryActive} /><Stop offset="1" stopColor={COLORS.accentOrange} /></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#rewardsBalanceGradient)" /></Svg>}<View pointerEvents="none" style={styles.balanceLight} /><View pointerEvents="none" style={styles.balanceShade} /><View style={styles.balanceInfo}><View style={styles.balanceLabel}><Se121SharedAsset source={require('../../assets/figma/se121-parity/rewards/points-star.svg')} width={11.667} height={11.667} nativeFallback={<Star size={12} color={COLORS.bgWhite} fill={COLORS.bgWhite} />} /><Text style={styles.balanceLabelText}>Available Points</Text></View><Text style={styles.balance}>{String(points).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</Text><Text style={styles.balanceHint}>100 points = $1 in rewards</Text></View><View style={styles.balanceActions}><Pressable style={[styles.redeemButton, compact && styles.compactRedeemButton]} onPress={() => setSheet('choice')} accessibilityRole="button" accessibilityLabel="Redeem rewards"><Text style={styles.redeemText}>Redeem</Text></Pressable><Pressable style={styles.earnButton} onPress={() => openDialog({ title: 'Earn more points', description: 'Earn points on completed stays. Use your rewards towards future stays and upgrades.', primary: 'Explore stays', kind: 'earn-more' })} accessibilityRole="button" accessibilityLabel="Learn how to earn more points"><Text style={styles.earnText}>Earn More</Text></Pressable></View></View>
      <View style={styles.rewardsSection}><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Available Rewards</Text><Pressable onPress={() => setSheet('catalog')} accessibilityRole="button" accessibilityLabel="View all rewards" hitSlop={10}><Text style={styles.viewAll}>View All</Text></Pressable></View><ScrollView horizontal style={styles.carousel} contentContainerStyle={styles.rewardsCarousel} showsHorizontalScrollIndicator={false} accessibilityLabel="Available rewards carousel">{REWARDS.map((reward) => <View key={reward.id} style={[styles.rewardCard, { width: cardWidth }]}><Text style={styles.rewardTitle}>{reward.title}</Text><Text style={styles.rewardDescription}>{reward.description}</Text><View style={styles.rewardFooter}><Text style={styles.rewardPoints}>{reward.points} pt</Text><Pressable onPress={() => openClaim(reward)} accessibilityRole="button" accessibilityLabel={`Claim ${reward.title}`} hitSlop={10} style={styles.claimButton}><Text style={styles.claimText}>Claim</Text><Se121SharedAsset source={require('../../assets/figma/se121-parity/rewards/arrow-right.svg')} width={9.333} nativeFallback={<ChevronRight size={12} color={COLORS.primary} />} /></Pressable></View><View pointerEvents="none" style={[styles.rewardCorner, reward.accent === 'coral' ? styles.rewardCornerCoral : reward.accent === 'teal' ? styles.rewardCornerTeal : styles.rewardCornerAqua]} /><View pointerEvents="none" style={styles.rewardIcon}><Se121SharedAsset source={reward.asset} width={reward.width} height={reward.height} nativeFallback={reward.fallback} /></View></View>)}</ScrollView></View>
      <View style={styles.historySection}><Text style={styles.historyTitle}>Points History</Text><View style={styles.historyCard}>{history.map((item, index) => <View key={item.id} style={[styles.historyRow, index < history.length - 1 && styles.historyBorder]}><View style={[styles.historyIconWrap, item.kind === 'spent' && styles.historyIconSpent]}>{item.kind === 'spent' ? <Se121SharedAsset source={require('../../assets/figma/se121-parity/rewards/reward-spent.svg')} width={20} height={19} nativeFallback={<BedDouble size={20} color={COLORS.errorDark} />} /> : item.kind === 'bonus' ? <Se121SharedAsset source={require('../../assets/figma/se121-parity/rewards/anniversary.svg')} width={20} height={19} nativeFallback={<Star size={20} color={COLORS.primary} />} /> : <Se121SharedAsset source={require('../../assets/figma/se121-parity/rewards/stay-earned.svg')} width={22} height={15} nativeFallback={<Hotel size={22} color={COLORS.primary} />} />}</View><View style={styles.historyCopy}><Text style={styles.historyName} numberOfLines={2}>{item.title}</Text><Text style={styles.historyDetail}>{item.detail}</Text></View><Text style={[styles.historyAmount, item.kind === 'spent' && styles.historyAmountSpent]}>{item.amount}</Text></View>)}</View><Pressable style={styles.loadMoreButton} onPress={() => openDialog({ title: 'Reward history', description: 'Your latest activity is shown below.\n\nPoints are earned after check-out. Claimed rewards are recorded immediately.', primary: 'Done', kind: 'details' })} accessibilityRole="button" accessibilityLabel="Load more points history"><Text style={styles.loadMoreText}>Load More History</Text></Pressable></View>
    </ScrollView>
    <UserBottomNavigation active="Profile" />
    <RewardsSheet visible={sheet === 'choice'} onClose={() => setSheet(null)} title="Available rewards" height={268}>
      {REWARDS.map((reward, index) => <Pressable key={reward.id} style={[styles.catalogRow, index === 2 && styles.lastSheetRow]} onPress={() => openClaim(reward)} accessibilityRole="button" accessibilityLabel={`Redeem ${reward.title}`}><Text style={styles.choiceTitle}>{reward.title} · {reward.points} points</Text></Pressable>)}
    </RewardsSheet>
    <RewardsSheet visible={sheet === 'catalog'} onClose={() => setSheet(null)} title="Available Rewards" height={268}>
      {REWARDS.map((reward, index) => <Pressable key={reward.id} style={[styles.catalogRow, index === REWARDS.length - 1 && styles.lastSheetRow]} onPress={() => openClaim(reward)} accessibilityRole="button" accessibilityLabel={`Select ${reward.title}`}><Text style={styles.catalogTitle}>{reward.title}</Text><Text style={styles.catalogPoints}>{reward.points} points</Text></Pressable>)}
    </RewardsSheet>
    <Modal visible={sheet === 'dialog'} transparent animationType="none" onRequestClose={() => setSheet(null)}><View style={styles.dialogRoot}><Pressable style={StyleSheet.absoluteFill} onPress={() => setSheet(null)} accessibilityLabel="Close dialog" /><Animated.View style={[styles.dialogCard, { opacity: dialogProgress, transform: [{ scale: dialogProgress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}><Text style={styles.dialogTitle}>{dialog.title}</Text><Text style={styles.dialogDescription}>{dialog.description}</Text><Pressable style={styles.dialogConfirm} onPress={confirmDialog} accessibilityRole="button"><Text style={styles.dialogConfirmText}>{dialog.primary}</Text></Pressable><Pressable style={styles.dialogCancel} onPress={() => setSheet(null)} accessibilityRole="button"><Text style={styles.dialogCancelText}>Cancel</Text></Pressable></Animated.View></View></Modal>
    {toast && <Animated.View pointerEvents="none" style={[styles.toast, { opacity: toastProgress, transform: [{ translateY: toastProgress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}><Text style={styles.toastText}>{toast}</Text></Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  headingRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingCopy: { flex: 1 },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  subtitle: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24, marginTop: 4 },
  helpButton: { width: 48, height: 48, borderRadius: RADII.full, backgroundColor: '#F0F7F4', alignItems: 'center', justifyContent: 'center' },
  balanceCard: { height: 198, marginTop: 24, padding: 24, borderRadius: RADII.xxl, overflow: 'hidden', backgroundColor: COLORS.primaryActive, ...SHADOWS.elevated_layer2, ...(Platform.OS === 'web' ? { backgroundImage: 'linear-gradient(135.5729376180147deg, #0b7a6d 0%, #fd6e58 100%)' } as ViewStyle : {}) },
  balanceLight: { position: 'absolute', top: -96, right: -96, width: 256, height: 256, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, opacity: 0.1, ...(Platform.OS === 'web' ? { filter: 'blur(32px)' } as ViewStyle : {}) },
  balanceShade: { position: 'absolute', bottom: -96, left: -96, width: 256, height: 256, borderRadius: RADII.full, backgroundColor: COLORS.errorDark, opacity: 0.2, ...(Platform.OS === 'web' ? { filter: 'blur(32px)' } as ViewStyle : {}) },
  balanceInfo: { gap: SPACING.xs },
  balanceLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceLabelText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  balance: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  balanceHint: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16, lineHeight: 24, opacity: 0.8 },
  balanceActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  redeemButton: { width: 144, height: 46, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, alignItems: 'center', justifyContent: 'center' },
  compactRedeemButton: { width: 116 },
  redeemText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  earnButton: { flex: 1, minWidth: 0, height: 46, borderRadius: RADII.full, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(2px)' } as ViewStyle : {}) },
  earnText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  notice: { marginTop: -SPACING.lg, textAlign: 'center', color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: TYPOGRAPHY.sizes.xs, lineHeight: TYPOGRAPHY.lineHeights.xs },
  rewardsSection: { marginTop: SPACING.xxl, gap: SPACING.xxl },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  viewAll: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  carousel: { marginHorizontal: -SPACING.xl },
  rewardsCarousel: { paddingHorizontal: SPACING.xl, gap: SPACING.lg, paddingBottom: SPACING.lg },
  rewardCard: { height: 154, padding: 17, paddingBottom: 14, borderRadius: RADII.xl, borderWidth: 1, borderColor: 'rgba(189, 201, 197, 0.3)', overflow: 'hidden', backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  featuredIcon: { position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderBottomLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, backgroundColor: COLORS.errorBg, alignItems: 'center', justifyContent: 'center' },
  rewardTitle: { maxWidth: '75%', color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  rewardDescription: { width: '100%', maxWidth: 316, minHeight: 48, marginTop: 4, color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  rewardFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rewardPoints: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  claimButton: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.xs },
  claimText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  rewardCorner: { position: 'absolute', top: -16, right: -16, borderBottomLeftRadius: RADII.full },
  rewardCornerCoral: { width: 81, height: 71, backgroundColor: 'rgba(253, 110, 88, 0.2)' },
  rewardCornerTeal: { width: 64, height: 64, backgroundColor: 'rgba(11, 122, 109, 0.1)' },
  rewardCornerAqua: { width: 64, height: 64, backgroundColor: 'rgba(0, 122, 109, 0.1)' },
  rewardIcon: { position: 'absolute', top: 16, right: 16, minWidth: 20, minHeight: 20, alignItems: 'center', justifyContent: 'center' },
  historySection: { marginTop: SPACING.xxl, gap: SPACING.xxl },
  historyTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  historyCard: { overflow: 'hidden', borderRadius: RADII.xl, backgroundColor: COLORS.bgWhite, ...SHADOWS.cardSoft },
  historyRow: { minHeight: 81, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, flexDirection: 'row', alignItems: 'center' },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(189, 201, 197, 0.3)' },
  historyIconWrap: { width: 48, height: 48, marginRight: SPACING.lg, borderRadius: RADII.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 95, 85, 0.1)' },
  historyIconSpent: { backgroundColor: 'rgba(172, 51, 35, 0.1)' },
  historyCopy: { flex: 1, minWidth: 0, paddingRight: SPACING.lg },
  historyName: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  historyDetail: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  historyAmount: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 20, lineHeight: 24 },
  historyAmountSpent: { color: COLORS.accentRed },
  loadMoreButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: RADII.full },
  loadMoreText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  catalogRow: { minHeight: 52, paddingHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#DDEAE5', borderRadius: 14, backgroundColor: '#F4FAF8', flexDirection: 'row', alignItems: 'center', gap: 8 },
  lastSheetRow: { marginBottom: 0 },
  choiceTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  catalogTitle: { flex: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  catalogPoints: { color: '#056E61', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  helpText: { color: COLORS.inkSoft, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  helpClose: { minHeight: SIZES.button, marginTop: 20, borderRadius: RADII.full, backgroundColor: COLORS.actionTeal, alignItems: 'center', justifyContent: 'center' },
  helpCloseText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.16)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(5px)' } as ViewStyle : {}) },
  sheetCard: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, borderTopLeftRadius: RADII.promo, borderTopRightRadius: RADII.promo, backgroundColor: COLORS.bgWhite, ...Platform.select({ web: { boxShadow: '0px -7px 26px rgba(5,41,33,0.08)' }, default: { shadowColor: '#052921', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 13, elevation: 14 } }) },
  sheetTitle: { marginBottom: 12, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  dialogRoot: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  dialogCard: { position: 'absolute', top: 220, left: 20, right: 20, minHeight: 235, padding: 24, gap: 16, borderRadius: 24, backgroundColor: COLORS.bgWhite, alignItems: 'center' },
  dialogTitle: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, textAlign: 'center' },
  dialogDescription: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  dialogConfirm: { width: '100%', height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  dialogConfirmText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  dialogCancel: { width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' },
  dialogCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  toast: { position: 'absolute', bottom: 92, left: 20, right: 20, height: 52, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, backgroundColor: '#1F2936' },
  toastText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
});
