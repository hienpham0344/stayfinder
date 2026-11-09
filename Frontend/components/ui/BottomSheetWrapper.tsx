import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, TYPOGRAPHY } from '../../constants/tokens';
import { OVERLAY_MOTION, useOverlayMotion } from './useOverlayMotion';
import { useUserWindowDimensions } from './useUserWindowDimensions';

interface BottomSheetWrapperProps {
  visible: boolean; onClose: () => void; title?: string; children: React.ReactNode;
  variant?: 'searchCriteria' | 'searchFilters' | 'searchDestination' | 'searchDates' | 'searchGuests';
}
export function BottomSheetWrapper({ visible, onClose, title, children, variant }: BottomSheetWrapperProps) {
  const insets = useSafeAreaInsets();
  const { height } = useUserWindowDimensions();
  const [activeVariant, setActiveVariant] = useState(variant);
  const [overlayVisible, setOverlayVisible] = useState(visible);
  const lastContent = useRef(children);
  const lastTitle = useRef(title);
  if (visible && activeVariant === variant) { lastContent.current = children; lastTitle.current = title; }
  const targetHeight = activeVariant === 'searchDates' ? 640 : activeVariant === 'searchDestination' ? 566 : activeVariant === 'searchFilters' ? 650 : 480;
  const sheetHeight = Math.min(targetHeight + insets.bottom, height - insets.top - 24);
  const motion = useOverlayMotion(overlayVisible, { distance: sheetHeight });
  useEffect(() => {
    if (!visible) { setOverlayVisible(false); return; }
    if (activeVariant === variant || !motion.presented) {
      setActiveVariant(variant); setOverlayVisible(true); return;
    }
    setOverlayVisible(false);
    const timer = setTimeout(() => {
      setActiveVariant(variant); setOverlayVisible(true);
    }, motion.reduced ? 0 : OVERLAY_MOTION.exit);
    return () => clearTimeout(timer);
  }, [visible, variant, activeVariant, motion.presented, motion.reduced]);
  return <Modal visible={motion.presented} transparent animationType="none" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Animated.View style={[StyleSheet.absoluteFill, motion.backdropStyle]}><Pressable accessibilityRole="button" accessibilityLabel="Close sheet" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} /></Animated.View>
      <Animated.View key={activeVariant} testID="bottom-sheet-panel" accessibilityViewIsModal style={[styles.sheetContainer, { height: sheetHeight, maxHeight: sheetHeight, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 }, motion.panelStyle]}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close sheet" style={{ height: 24, alignItems: 'center', justifyContent: 'flex-start' }}><View style={styles.dragHandle} /></Pressable>
        {lastTitle.current && <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>{lastTitle.current}</Text><Pressable hitSlop={10} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close sheet"><Ionicons name="close" size={24} color={COLORS.dark} /></Pressable></View>}
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom), flexGrow: 1 }}>{lastContent.current}</ScrollView>
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  searchBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    ...Platform.select({ web: { backdropFilter: 'blur(5px)' } }),
  },
  searchOverlayBackdrop: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
    alignSelf: 'center',
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  criteriaSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    minHeight: 480,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({ web: { boxShadow: '0px -7px 26px rgba(5,41,33,0.08)' }, default: { shadowColor: COLORS.textSecondary, shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 13, elevation: 8 } }),
  },
  filtersSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 619,
    paddingTop: 12,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    ...Platform.select({ web: { boxShadow: '0px -8px 28px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 8 } }),
  },
  pickerSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0px -7px 26px 0px rgba(5,31,26,0.1)' },
      default: { shadowColor: COLORS.textSecondary, shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.1, shadowRadius: 13, elevation: 8 },
    }),
  },
  destinationSheet: { height: 566 },
  datesSheet: { height: 640 },
  guestsSheet: { height: 470 },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: RADII.full,
    backgroundColor: COLORS.borderDark,
    alignSelf: 'center',
    marginBottom: 12,
  },
  filtersHandle: {
    width: 48,
    height: 6,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 16,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.dark,
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
  },
});
