import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import type { MotionProps } from './motionTypes';
import { MOTION } from '../../constants/tokens';

export function MotionView({ children, style, delay = 0, duration = MOTION.reveal, preset = 'rise', testID }: MotionProps) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, delay, duration, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reduced]);
  return <Animated.View testID={testID} style={[style, { opacity: progress, transform: preset === 'scale' ? [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] : [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [preset === 'rise' ? 18 : 0, 0] }) }] }]}>{children}</Animated.View>;
}
