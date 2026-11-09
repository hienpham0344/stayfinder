import React, { useId } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ArrowRight } from '../../constants/icons';
import { COLORS, TYPOGRAPHY } from '../../constants/tokens';
import { StayImage } from '../ui/StayImage';
import { useUserWindowDimensions } from '../ui/useUserWindowDimensions';
import { AmbientPhoto } from '../ui/AmbientPhoto';

const heroPhoto = require('../../assets/figma/se121-parity/gallery/villa-photo-1.png');

export function PromoBanner({ onPress }: { onPress?: () => void }) {
  const compact = useUserWindowDimensions().width <= 340;
  const gradientId = `home-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <Pressable onPress={onPress} style={s.hero} dataSet={{ interactive: 'hero' }} accessibilityRole="button" accessibilityLabel="Discover places to stay">
    <AmbientPhoto style={StyleSheet.absoluteFill}><StayImage source={heroPhoto} style={s.photo} accessibilityLabel="A warm and spacious villa suite" /></AmbientPhoto>
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%"><Defs><LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={COLORS.bgMain} stopOpacity={0.08} /><Stop offset="0.5" stopColor={COLORS.bgMain} stopOpacity={0.28} /><Stop offset="0.72" stopColor={COLORS.bgMain} stopOpacity={0.72} /><Stop offset="1" stopColor={COLORS.bgMain} stopOpacity={0.94} /></LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${gradientId})`} /></Svg>
    <View style={s.copy}>
      <View style={s.topLine}><View style={s.dot} /><Text style={s.eyebrow}>A LITTLE FURTHER FROM EVERYDAY</Text></View>
      <Text style={[s.title, compact && s.compactTitle]}>Find your{'\n'}kind of away.</Text>
      <View style={s.bottom}><Text style={s.subtitle}>Thoughtful stays, made for the journey.</Text><View style={s.arrow} dataSet={{ heroArrow: 'true' }}><ArrowRight size={22} color={COLORS.onPrimary} strokeWidth={1.5} /></View></View>
    </View>
  </Pressable>;
}

const s = StyleSheet.create({
  hero: { height: 320, marginHorizontal: 20, borderRadius: 18, overflow: 'hidden', backgroundColor: COLORS.bgSecondary, marginBottom: 22 },
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary },
  eyebrow: { flexShrink: 1, color: COLORS.photoText, fontFamily: TYPOGRAPHY.families.medium, fontSize: 11, lineHeight: 16, letterSpacing: 0.7 },
  copy: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  title: { fontFamily: TYPOGRAPHY.families.medium, fontSize: 36, lineHeight: 40, letterSpacing: -1.8, color: COLORS.primary, marginBottom: 8 },
  compactTitle: { fontSize: 32, lineHeight: 36, letterSpacing: -1.4 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  subtitle: { flex: 1, color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20 },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
});
