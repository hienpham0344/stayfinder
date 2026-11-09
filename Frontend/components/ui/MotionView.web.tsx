import { useEffect, useRef } from 'react';
import { View, type ViewStyle } from 'react-native';
import type { MotionProps } from './motionTypes';
import { observeMotion } from './webMotionObserver';
import { MOTION } from '../../constants/tokens';

export function MotionView({ children, style, delay = 0, duration = MOTION.reveal, preset = 'rise', testID }: MotionProps) {
  const ref = useRef<View>(null);
  useEffect(() => {
    const element = ref.current as unknown as HTMLElement | null;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { element.dataset.reveal = 'complete'; return; }
    let entered = false;
    const finish = (event: AnimationEvent) => { if (event.target === element) element.dataset.reveal = 'complete'; };
    element.addEventListener('animationend', finish);
    let stop = () => {};
    stop = observeMotion(element, (visible) => {
      if (visible && !entered) { entered = true; element.dataset.reveal = 'visible'; stop(); }
    });
    return () => { stop(); element.removeEventListener('animationend', finish); };
  }, []);
  return <View ref={ref} testID={testID} dataSet={{ reveal: 'pending', motion: preset }} style={[style, { animationDelay: `${delay}ms`, animationDuration: `${duration}ms` } as ViewStyle]}>{children}</View>;
}
