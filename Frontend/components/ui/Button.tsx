import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { Animated, Platform, Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, MOTION, RADII, SIZES, TYPOGRAPHY } from '../../constants/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ButtonSurface = Platform.OS === 'web' ? Pressable : AnimatedPressable;

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  useEffect(() => () => scale.stopAnimation(), [scale]);
  const pressScale = (value: number) => { if (Platform.OS === 'web') return; scale.stopAnimation(); if (reduced) scale.setValue(1); else Animated.spring(scale, { toValue: value, speed: 22, bounciness: 2, useNativeDriver: true }).start(); };
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      case 'primary':
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      case 'ghost':
        return styles.textGhost;
      case 'primary':
      default:
        return styles.textPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sm;
      case 'lg':
        return styles.lg;
      case 'md':
      default:
        return styles.md;
    }
  };

  return (
    <ButtonSurface
      onPressIn={() => { setPressed(true); pressScale(0.985); }}
      onPressOut={() => { setPressed(false); pressScale(1); }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }} aria-disabled={disabled || loading} aria-busy={loading}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        Platform.OS === 'web' ? { transform: [{ scale: reduced ? 1 : pressed ? 0.985 : 1 }], transitionProperty: 'transform, opacity', transitionDuration: reduced ? '0ms' : pressed ? '140ms' : `${MOTION.press}ms`, transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' } as ViewStyle : { transform: [{ scale }] },
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
        pressed && !disabled && !loading && (variant === 'primary' ? styles.primaryPressed : styles.pressed),
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.onPrimary : COLORS.primary} />
      ) : (
        <>
          <Text style={[styles.textBase, getTextStyle(), textStyle]}>{title}</Text>
          {icon}
        </>
      )}
    </ButtonSurface>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.lg,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  primaryPressed: { opacity: 0.94 },
  pressed: { opacity: 0.8 },

  // Sizes
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 36,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    height: 48,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    height: SIZES.button,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.primaryActive,
  },
  secondary: {
    backgroundColor: COLORS.bgSecondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.borderControl,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Text
  textBase: {
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: TYPOGRAPHY.sizes.base,
    lineHeight: TYPOGRAPHY.lineHeights.base,
  },
  textPrimary: {
    color: COLORS.onPrimary,
  },
  textSecondary: {
    color: COLORS.dark,
  },
  textOutline: {
    color: COLORS.dark,
  },
  textGhost: {
    color: COLORS.primary,
  },
});
