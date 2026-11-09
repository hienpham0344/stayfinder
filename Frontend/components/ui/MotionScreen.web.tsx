import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { MotionProps } from './motionTypes';

export function MotionScreen({ children, style, testID }: MotionProps) {
  const ref = useRef<View>(null);
  useFocusEffect(useCallback(() => {
    const element = ref.current as unknown as HTMLElement | null;
    if (!element) return;
    element.dataset.screenMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'complete' : 'enter';
    const complete = () => { element.dataset.screenMotion = 'complete'; };
    const finish = (event: AnimationEvent) => { if (event.target === element) complete(); };
    element.addEventListener('animationend', finish);
    return () => { complete(); element.removeEventListener('animationend', finish); };
  }, []));
  return <View ref={ref} testID={testID} dataSet={{ screenMotion: 'complete' }} style={style}>{children}</View>;
}
