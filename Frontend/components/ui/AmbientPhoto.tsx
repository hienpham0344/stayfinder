import { View } from 'react-native';
import type { MotionProps } from './motionTypes';

export function AmbientPhoto({ children, style }: MotionProps) {
  return <View style={style}>{children}</View>;
}
