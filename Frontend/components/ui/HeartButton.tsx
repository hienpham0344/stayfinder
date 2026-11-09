import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Heart } from '../../constants/icons';
import { useWishlist } from '../../state/AppState';
import { COLORS } from '../../constants/tokens';
import { useReducedMotion } from './useReducedMotion';

export function HeartButton({ stayId, style, size = 20 }: { stayId: string; style?: StyleProp<ViewStyle>; size?: number }) {
  const { savedIds, toggleWishlist } = useWishlist();
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => () => scale.stopAnimation(), [scale]);
  const [pulse, setPulse] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);
  const Frame = Platform.OS === 'web' ? View : Animated.View;
  const saved = savedIds.includes(stayId);
  return <Pressable style={style} hitSlop={6} accessibilityRole="button" accessibilityLabel={saved ? 'Remove from wishlist' : 'Save to wishlist'} accessibilityState={{ selected: saved }} onPress={(event) => {
    event.stopPropagation(); toggleWishlist(stayId);
    if (Platform.OS === 'web') {
      if (reduced) return;
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      setPulse(true); pulseTimer.current = setTimeout(() => setPulse(false), 120);
      return;
    }
    scale.stopAnimation(); scale.setValue(1);
    if (!reduced) Animated.sequence([Animated.timing(scale, { toValue: 1.14, duration: 120, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 3, useNativeDriver: true })]).start();
  }} aria-pressed={saved}><Frame style={Platform.OS === 'web' ? { transform: [{ scale: reduced ? 1 : pulse ? 1.14 : 1 }], transitionProperty: 'transform', transitionDuration: reduced ? '0ms' : pulse ? '120ms' : '240ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' } as ViewStyle : { transform: [{ scale }] }}><Heart size={size} color={saved ? COLORS.accentRed : COLORS.textMuted} fill={saved ? COLORS.accentRed : 'none'} /></Frame></Pressable>;
}
