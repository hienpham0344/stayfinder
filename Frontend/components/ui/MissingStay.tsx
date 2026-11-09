import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Button } from './Button';
import { COLORS, TYPOGRAPHY } from '../../constants/tokens';

export function MissingStay({ message = 'This stay is no longer available.' }: { message?: string }) {
  return <View style={{ flex: 1, backgroundColor: COLORS.bgMain, padding: 24, justifyContent: 'center', gap: 16 }}><Text accessibilityRole="header" style={{ fontFamily: TYPOGRAPHY.families.bold, fontSize: 24, color: COLORS.dark }}>{message}</Text><Button title="Explore stays" onPress={() => router.replace('/search')} /></View>;
}
