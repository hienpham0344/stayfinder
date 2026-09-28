import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../../constants/tokens';

interface TopAppBarProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  showBack = true,
  onBackPress,
  rightAction,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SIZES.appBar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.bgMain,
  },
  backButton: {
    width: SIZES.iconButton,
    height: SIZES.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
    letterSpacing: -0.24,
    color: COLORS.primary,
    textAlign: 'center',
    flex: 1,
  },
  rightAction: {
    width: SIZES.iconButton,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: SIZES.iconButton,
  },
});
