import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import type { ApiAccommodation } from '../../services/api';

export const formatVnd = (amount: number | null | undefined) =>
  amount == null ? 'Giá chưa cập nhật' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

export function LiveScreen({ title, children, back = false, refresh }: {
  title: string; children: React.ReactNode; back?: boolean; refresh?: () => void;
}) {
  return <SafeAreaView style={styles.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <View style={styles.header}>
      {back && <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.headerAction}><Text style={styles.link}>‹ Quay lại</Text></Pressable>}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {refresh && <Pressable onPress={refresh} accessibilityRole="button" style={styles.headerAction}><Text style={styles.link}>Làm mới</Text></Pressable>}
    </View>
    {children}
  </ScrollView></SafeAreaView>;
}

export function LiveButton({ title, onPress, disabled = false, secondary = false }: {
  title: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabledButton]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>;
}

export function LiveField({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric'; secureTextEntry?: boolean;
}) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput
    accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder}
    keyboardType={keyboardType} secureTextEntry={secureTextEntry} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
    style={styles.input} placeholderTextColor={COLORS.textMuted} /></View>;
}

export function LiveMessage({ text, loading = false }: { text: string; loading?: boolean }) {
  return <View style={styles.message}>{loading && <ActivityIndicator color={COLORS.primary} />}
    <Text accessibilityRole={loading ? undefined : 'alert'} style={styles.messageText}>{text}</Text></View>;
}

export function LiveStayCard({ stay, imageUrl, onPress, saved, onSave }: {
  stay: ApiAccommodation; imageUrl?: string; onPress: () => void; saved?: boolean; onSave?: () => void;
}) {
  return <View style={styles.card}>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Xem ${stay.name}`}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.cover} resizeMode="cover" />
        : <View style={[styles.cover, styles.coverFallback]}><Text style={styles.coverText}>StayFinder</Text></View>}
      <View style={styles.cardBody}><Text style={styles.cardTitle}>{stay.name}</Text>
        <Text style={styles.meta}>{stay.address || 'Địa chỉ chưa cập nhật'}</Text>
        <Text style={styles.price}>{stay.basePrice == null ? 'Giá chưa cập nhật' : `Từ ${formatVnd(stay.basePrice)} / đêm`}</Text></View>
    </Pressable>
    {onSave && <Pressable onPress={onSave} accessibilityRole="button" accessibilityLabel={saved ? 'Bỏ lưu' : 'Lưu chỗ ở'} style={styles.save}>
      <Text style={styles.link}>{saved ? '♥ Đã lưu' : '♡ Lưu'}</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  content: { paddingHorizontal: SPACING.xl, paddingBottom: 52, flexGrow: 1 },
  header: { paddingTop: 12, paddingBottom: 18, gap: 8 },
  headerAction: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  title: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.bold, fontSize: 27, lineHeight: 34 },
  link: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 15 },
  button: { minHeight: 50, backgroundColor: COLORS.primary, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 12 },
  secondaryButton: { backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderLight },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: COLORS.onPrimary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 15 },
  secondaryText: { color: COLORS.primary },
  field: { marginBottom: 14, gap: 5 },
  label: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderControl, paddingHorizontal: 12, color: COLORS.dark, backgroundColor: COLORS.bgSurface, fontFamily: TYPOGRAPHY.families.regular, fontSize: 16 },
  message: { minHeight: 80, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.bgSecondary, borderRadius: 16 },
  messageText: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  card: { backgroundColor: COLORS.bgSurface, borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  cover: { width: '100%', height: 165 },
  coverFallback: { backgroundColor: COLORS.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  coverText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 22 },
  cardBody: { padding: 16, gap: 5 },
  cardTitle: { color: COLORS.dark, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20 },
  meta: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14 },
  price: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 16 },
  save: { paddingHorizontal: 16, paddingBottom: 14, alignSelf: 'flex-end' },
});
