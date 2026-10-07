import React from 'react';
import { Image, Platform } from 'react-native';

// Exact local Figma vectors. Keep their exported root dimensions.
export function Se121SharedAsset({ source, width, height = width, nativeFallback }: { source: number; width: number; height?: number; nativeFallback: React.ReactElement }) {
  if (Platform.OS === 'web') return <Image source={source} style={{ width, height }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
  // Native keeps the existing vector stack until its device visual gate is run.
  // This avoids introducing asynchronous SVG/file-URI loading into navigation.
  return nativeFallback;
}

const inactive = [
  require('../../assets/figma/shared/138-144-imgContainer5.svg'),
  require('../../assets/figma/shared/138-144-imgContainer1.svg'),
  require('../../assets/figma/shared/138-144-imgContainer2.svg'),
  require('../../assets/figma/shared/138-144-imgContainer3.svg'),
  require('../../assets/figma/shared/138-144-imgContainer4.svg'),
];
const active = [
  require('../../assets/figma/shared/138-144-imgContainer.svg'),
  require('../../assets/figma/shared/138-144-imgContainer6.svg'),
  require('../../assets/figma/shared/138-144-imgContainer9.svg'),
  require('../../assets/figma/shared/138-144-imgMargin.svg'),
  require('../../assets/figma/shared/138-144-imgContainer12.svg'),
];
export function componentNavigationAsset(index: number, selected: number) {
  if (selected === 3 && index === 4) return require('../../assets/figma/shared/138-144-imgMargin1.svg');
  return selected === index ? active[index] : inactive[index];
}
export const searchNavigationAssets = [
  require('../../assets/figma/shared/229-892-imgContainer2.svg'),
  require('../../assets/figma/shared/229-892-imgContainer3.svg'),
  require('../../assets/figma/shared/229-892-imgContainer4.svg'),
  require('../../assets/figma/shared/229-892-imgContainer5.svg'),
  require('../../assets/figma/shared/229-892-imgContainer6.svg'),
];

// Full USER frames use the softer inactive ink from 229:892; the component
// gallery at 138:144 retains its own icon variants above.
export function fullFrameNavigationAsset(index: number, selected: number) {
  return selected === index ? active[index] : searchNavigationAssets[index];
}
