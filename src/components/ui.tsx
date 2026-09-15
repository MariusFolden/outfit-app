import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>;
}

export function PrimaryButton({ label, onPress, disabled, style }: { label: string; onPress: () => void; disabled?: boolean; style?: ViewStyle }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.primary, disabled && styles.disabled, style]}><Text style={styles.primaryText}>{label}</Text></Pressable>;
}

export function Field({ value, onChangeText, placeholder, multiline = false }: { value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} style={[styles.field, multiline && styles.multiline]} />;
}

export function SectionLabel({ children }: { children: ReactNode }) { return <Text style={styles.label}>{children}</Text>; }

const styles = StyleSheet.create({
  chip: { backgroundColor: colors.chip, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: colors.text },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: colors.white },
  primary: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 14, justifyContent: 'center', minHeight: 54, paddingHorizontal: spacing.lg },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.4 },
  field: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 52, paddingHorizontal: 15 },
  multiline: { minHeight: 116, paddingTop: 14 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', letterSpacing: 0.4, marginBottom: spacing.sm, textTransform: 'uppercase' },
});
