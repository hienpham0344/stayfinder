import { COLORS as SE121_COLORS } from './tokens';

// Compatibility palette for older USER components that still import this file.
export const COLORS = {
  primary: SE121_COLORS.primary,
  primaryDark: SE121_COLORS.primaryContainer,
  primaryLight: SE121_COLORS.primaryLight,
  secondary: SE121_COLORS.actionTeal,
  secondaryDark: SE121_COLORS.primary,
  dark: SE121_COLORS.dark,
  gray: SE121_COLORS.textMuted,
  lightGray: SE121_COLORS.bgMain,
  border: SE121_COLORS.borderLight,
  white: SE121_COLORS.bgWhite,
  star: SE121_COLORS.starGold,
  success: SE121_COLORS.actionTeal,
  warning: SE121_COLORS.warning,
  danger: SE121_COLORS.validation,
};
