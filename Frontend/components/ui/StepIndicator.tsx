import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, RADII, SPACING } from '../../constants/tokens';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => (
  <View style={styles.container} accessibilityLabel={'Bước ' + currentStep + ' trên 4'}>
    {[1, 2, 3, 4].map((step) => <View key={step} style={[styles.segment, step <= currentStep && styles.active]} />)}
  </View>
);

const styles = StyleSheet.create({
  container: { height: 24, paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgMain },
  segment: { flex: 1, height: 4, borderRadius: RADII.full, backgroundColor: COLORS.borderLight },
  active: { backgroundColor: COLORS.primary },
});
