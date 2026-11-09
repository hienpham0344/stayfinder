import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { MOTION } from '../../constants/tokens';

export const OVERLAY_MOTION = { enter: MOTION.overlayEnter, exit: MOTION.overlayExit, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' } as const;

// Web animates compositor properties through CSS; native keeps its native driver.
// Presence outlives visibility so closing never removes a moving panel.
export function useOverlayMotion(visible: boolean, { kind = 'sheet', distance = 480 }: { kind?: 'sheet' | 'dialog'; distance?: number } = {}) {
  const reduced = useReducedMotion();
  const [presented, setPresented] = useState(visible);
  const [entered, setEntered] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !presented) { setEntered(false); setPresented(true); return; }
    if (!presented) return;
    if (reduced) {
      setEntered(visible); progress.setValue(visible ? 1 : 0);
      if (!visible) setPresented(false);
      return;
    }
    if (Platform.OS === 'web') {
      let firstFrame = 0; let secondFrame = 0;
      let exitTimer: ReturnType<typeof setTimeout> | undefined;
      if (visible) {
        firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(() => setEntered(true)); });
      } else {
        setEntered(false);
        exitTimer = setTimeout(() => setPresented(false), OVERLAY_MOTION.exit + 34);
      }
      return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); if (exitTimer) clearTimeout(exitTimer); };
    }
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? OVERLAY_MOTION.enter : OVERLAY_MOTION.exit,
      easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true,
    });
    animation.start(({ finished }) => { if (finished && !visible) setPresented(false); });
    return () => animation.stop();
  }, [visible, presented, reduced, progress]);

  const duration = reduced ? 0 : visible ? OVERLAY_MOTION.enter : OVERLAY_MOTION.exit;
  const panelStyle = Platform.OS === 'web' ? {
    opacity: kind === 'dialog' ? (entered ? 1 : 0) : 1,
    transform: [{ translateY: entered ? 0 : kind === 'sheet' ? distance : 8 }, { scale: kind === 'dialog' && !entered ? 0.985 : 1 }],
    transitionProperty: 'transform, opacity', transitionDuration: `${duration}ms`, transitionTimingFunction: OVERLAY_MOTION.easing,
    willChange: presented ? 'transform, opacity' : 'auto',
  } as ViewStyle : {
    opacity: kind === 'dialog' ? progress : 1,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [kind === 'sheet' ? distance : 8, 0] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [kind === 'dialog' ? 0.985 : 1, 1] }) }],
  };
  const backdropStyle = Platform.OS === 'web' ? {
    opacity: entered ? 1 : 0, transitionProperty: 'opacity', transitionDuration: `${duration}ms`, transitionTimingFunction: OVERLAY_MOTION.easing,
  } as ViewStyle : { opacity: progress };
  return { presented, panelStyle, backdropStyle, reduced };
}
