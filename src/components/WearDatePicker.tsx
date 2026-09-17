import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { fromLocalDateKey, toLocalDateKey } from '../lib/localDate';
import { colors, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onDateSelected: (date: Date) => void;
};

export function WearDatePicker({ visible, onClose, onDateSelected }: Props) {
  const today = useMemo(() => fromLocalDateKey(toLocalDateKey()), [visible]);
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    if (visible) setSelectedDate(today);
  }, [today, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    DateTimePickerAndroid.open({
      value: today,
      maximumDate: today,
      mode: 'date',
      onChange: (event: DateTimePickerEvent, date?: Date) => {
        onClose();
        if (event.type === 'set' && date) onDateSelected(date);
      },
    });
  }, [onClose, onDateSelected, today, visible]);

  if (Platform.OS !== 'ios') return null;

  return <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Log another date</Text>
        <DateTimePicker value={selectedDate} maximumDate={today} mode="date" display="spinner" textColor={colors.text} onChange={(_event, date) => { if (date) setSelectedDate(date); }} />
        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
          <Pressable onPress={() => onDateSelected(selectedDate)} style={styles.primary}><Text style={styles.primaryText}>Log date</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(23, 23, 22, 0.22)', flex: 1, justifyContent: 'flex-end', padding: spacing.md },
  sheet: { backgroundColor: colors.background, borderRadius: 20, padding: spacing.lg, width: '100%' },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  secondary: { alignItems: 'center', borderColor: colors.line, borderRadius: 13, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 50 },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  primary: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 13, flex: 1, justifyContent: 'center', minHeight: 50 },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
