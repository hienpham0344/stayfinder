import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import type { MotionProps } from './motionTypes';
import { observeMotion } from './webMotionObserver';

export function AmbientPhoto({ children, style }: MotionProps) {
  const ref = useRef<View>(null);
  useEffect(() => {
    const element = ref.current as unknown as HTMLElement | null;
    if (!element) return;
    return observeMotion(element, (visible) => { element.dataset.ambientState = visible ? 'playing' : 'paused'; });
  }, []);
  return <View ref={ref} dataSet={{ ambient: 'hero', ambientState: 'paused' }} style={style}>{children}</View>;
}
