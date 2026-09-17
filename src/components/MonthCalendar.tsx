import { Pressable, StyleSheet, Text, View } from 'react-native';
import { daysInLocalMonth, localDateKeyForMonthDay, mondayFirstLeadingDays, toLocalDateKey } from '../lib/localDate';
import { colors, spacing } from '../theme';
import type { LocalDateKey } from '../types/history';

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type MonthCalendarProps = {
  markedDateKeys: ReadonlySet<LocalDateKey>;
  month: Date;
  onMarkedDatePress?: (date: LocalDateKey) => void;
  selectedDateKey?: LocalDateKey | null;
};

export function MonthCalendar({ markedDateKeys, month, onMarkedDatePress, selectedDateKey }: MonthCalendarProps) {
  const leadingDays = mondayFirstLeadingDays(month);
  const totalDays = daysInLocalMonth(month);
  const today = toLocalDateKey();
  const cells = Array.from({ length: leadingDays + totalDays }, (_, index) => index < leadingDays ? null : index - leadingDays + 1);

  return <View accessibilityLabel="Monthly outfit history calendar" style={styles.calendar}>
    <View style={styles.weekdays}>
      {weekdays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
    </View>
    <View style={styles.days}>
      {cells.map((day, index) => {
        if (!day) return <View key={`blank-${index}`} style={styles.blankCell} />;

        const dateKey = localDateKeyForMonthDay(month, day);
        const isMarked = markedDateKeys.has(dateKey);
        const isSelected = selectedDateKey === dateKey;
        const isToday = today === dateKey;
        const cellStyle = [styles.dayCell, isToday && styles.todayCell, isSelected && styles.selectedCell];
        const dayNumber = <Text style={[styles.dayNumber, isSelected && styles.selectedDayNumber]}>{day}</Text>;

        if (!isMarked) return <View key={dateKey} style={cellStyle}>{dayNumber}</View>;

        return <Pressable
          key={dateKey}
          accessibilityHint="Selects this date in your outfit history."
          accessibilityLabel={`Outfits logged on ${dateKey}`}
          onPress={() => onMarkedDatePress?.(dateKey)}
          style={cellStyle}
        >
          {dayNumber}
          <View style={[styles.marker, isSelected && styles.selectedMarker]} />
        </Pressable>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  calendar: { marginTop: spacing.lg },
  weekdays: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { color: colors.muted, flex: 1, fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textAlign: 'center' },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  blankCell: { height: 46, width: '14.285714%' },
  dayCell: { alignItems: 'center', height: 46, justifyContent: 'center', width: '14.285714%' },
  todayCell: { borderColor: colors.line, borderRadius: 18, borderWidth: 1 },
  selectedCell: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft, borderRadius: 18 },
  dayNumber: { color: colors.text, fontSize: 14, fontWeight: '600' },
  selectedDayNumber: { color: colors.accent, fontWeight: '700' },
  marker: { backgroundColor: colors.accent, borderRadius: 2.5, height: 5, marginTop: 3, width: 5 },
  selectedMarker: { backgroundColor: colors.accent },
});
