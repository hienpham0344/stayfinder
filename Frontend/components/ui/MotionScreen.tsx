import { useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useReducedMotion } from './useReducedMotion';
import type { MotionProps } from './motionTypes';
import { MOTION } from '../../constants/tokens';

export function MotionScreen({ children, style, testID }: MotionProps) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  useFocusEffect(useCallback(() => {
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: MOTION.screen, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced]));
  return <Animated.View testID={testID} style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>{children}</Animated.View>;
}
