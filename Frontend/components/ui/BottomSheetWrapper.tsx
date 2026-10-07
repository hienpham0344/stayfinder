import React, { useLayoutEffect, useRef } from 'react';
import { Animated, Easing, Platform, View, Text, StyleSheet, Modal, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, TYPOGRAPHY } from '../../constants/tokens';

interface BottomSheetWrapperProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'searchCriteria' | 'searchFilters' | 'searchDestination' | 'searchDates' | 'searchGuests';
}

export const BottomSheetWrapper: React.FC<BottomSheetWrapperProps> = ({
  visible,
  onClose,
  title,
  children,
  variant,
}) => {
  const insets = useSafeAreaInsets();
  // Keep Search's presentation during dismissal, even when its content is cleared.
  const lastVariant = useRef(variant);
  if (visible) lastVariant.current = variant;
  const activeVariant = visible ? variant : lastVariant.current;
  const isCriteria = activeVariant === 'searchCriteria';
  const isFilters = activeVariant === 'searchFilters';
  const isPicker = activeVariant === 'searchDestination' || activeVariant === 'searchDates' || activeVariant === 'searchGuests';
  const pickerHeight = activeVariant === 'searchDestination' ? 566 : activeVariant === 'searchDates' ? 640 : 470;
  const pickerReveal = useRef(new Animated.Value(0)).current;
  const criteriaReveal = useRef(new Animated.Value(1)).current;
  const filtersReveal = useRef(new Animated.Value(0)).current;
  useLayoutEffect(() => {
    if (!visible || !isPicker) return;
    pickerReveal.setValue(0);
    const animation = Animated.timing(pickerReveal, { toValue: 1, duration: 200, easing: Easing.bezier(0, 0, 0.58, 1), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [visible, isPicker, activeVariant, pickerReveal]);
  useLayoutEffect(() => {
    if (!visible || !isCriteria) return;
    criteriaReveal.setValue(0);
    // 475:1033 starts with the card below the 844px frame (top 844), then
    // smart-animates to 226:892 with its top at 364 in 250ms.
    const animation = Animated.timing(criteriaReveal, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [visible, isCriteria, criteriaReveal]);
  useLayoutEffect(() => {
    if (!visible || !isFilters) return;
    filtersReveal.setValue(0);
    const animation = Animated.timing(filtersReveal, { toValue: 1, duration: 220, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [visible, isFilters, filtersReveal]);
  const bottomPadding = isFilters ? insets.bottom : (isCriteria || isPicker) ? Math.max(24, insets.bottom) : Math.max(32, insets.bottom + 16);
  return (
    <Modal
      visible={visible}
      transparent
      animationType={isCriteria || isFilters || isPicker ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, (isCriteria || isFilters || isPicker) && styles.searchBackdrop, (isCriteria || isFilters) && styles.searchOverlayBackdrop, isPicker && styles.pickerBackdrop]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheetContainer, isCriteria && styles.criteriaSheet, isFilters && styles.filtersSheet, isPicker && styles.pickerSheet, activeVariant === 'searchDestination' && styles.destinationSheet, activeVariant === 'searchDates' && styles.datesSheet, activeVariant === 'searchGuests' && styles.guestsSheet, { paddingBottom: bottomPadding }, isPicker && { transform: [{ translateY: pickerReveal.interpolate({ inputRange: [0, 1], outputRange: [pickerHeight, 0] }) }] }, isFilters && { transform: [{ translateY: filtersReveal.interpolate({ inputRange: [0, 1], outputRange: [619, 0] }) }] }, isCriteria && { transform: [{ translateY: criteriaReveal.interpolate({ inputRange: [0, 1], outputRange: [480, 0] }) }] }]}>
        {!isCriteria && !isPicker && <View style={[styles.dragHandle, isFilters && styles.filtersHandle]} />}

        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.content}>{children}</View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  searchBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  searchOverlayBackdrop: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    ...Platform.select({ web: { backdropFilter: 'blur(5px)' } }),
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...Platform.select({ web: { backdropFilter: 'blur(5px)' } }),
  },
  sheetContainer: {
    backgroundColor: COLORS.bgWhite,
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
    ...Platform.select({ web: { boxShadow: '0px -7px 26px rgba(5,41,33,0.08)' }, default: { shadowColor: '#052921', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 13, elevation: 8 } }),
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
      default: { shadowColor: '#051F1A', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.1, shadowRadius: 13, elevation: 8 },
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
