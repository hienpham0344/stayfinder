import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type MotionProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  preset?: 'rise' | 'fade' | 'scale';
  testID?: string;
}>;
