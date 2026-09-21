import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADII, TYPOGRAPHY } from '../../constants/tokens';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { step: 1, title: 'Room' },
  { step: 2, title: 'Guest Info' },
  { step: 3, title: 'Payment' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      {STEPS.map((item, index) => {
        const isActive = item.step === currentStep;
        const isCompleted = item.step < currentStep;

        return (
          <React.Fragment key={item.step}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  (isActive || isCompleted) && styles.circleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    (isActive || isCompleted) && styles.stepNumberActive,
                  ]}
                >
                  {isCompleted ? '✓' : item.step}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  isCompleted && styles.labelCompleted,
                ]}
              >
                {item.title}
              </Text>
            </View>

            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.line,
                  item.step < currentStep && styles.lineActive,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.bgWhite,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: RADII.full,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepNumber: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  labelActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  labelCompleted: {
    color: COLORS.dark,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 8,
    marginTop: -16,
  },
  lineActive: {
    backgroundColor: COLORS.primary,
  },
});
