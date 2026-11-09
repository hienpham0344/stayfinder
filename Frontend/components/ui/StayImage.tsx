import React, { useState } from 'react';
import { Image, ImageProps, StyleSheet, View } from 'react-native';
import { ImageOff } from '../../constants/icons';
import { COLORS } from '../../constants/tokens';

function Photo({ source, style, onError, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (!source || failed) return <View style={[styles.fallback, style]} accessibilityRole="image" accessibilityLabel="Photo unavailable"><ImageOff size={24} color={COLORS.textMuted} /></View>;
  return <Image {...props} source={source} style={style} resizeMode={props.resizeMode ?? 'cover'} resizeMethod="resize" onError={(event) => { setFailed(true); onError?.(event); }} />;
}

// A new source must recover from the previous source's error state.
export const StayImage = React.memo(function StayImage(props: ImageProps) {
  return <Photo key={JSON.stringify(props.source)} {...props} />;
});

const styles = StyleSheet.create({ fallback: { backgroundColor: COLORS.bgSecondary, alignItems: 'center', justifyContent: 'center' } });
