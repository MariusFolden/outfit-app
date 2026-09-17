import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MonthCalendar } from '../../components/MonthCalendar';
import { formatLocalMonth, isSameLocalMonth, shiftLocalMonth, startOfLocalMonth } from '../../lib/localDate';
import { useHistory } from '../../providers/HistoryProvider';
import { colors, spacing } from '../../theme';
import type { LocalDateKey } from '../../types/history';

export default function HistoryScreen() {
  const { getMonthState, historyPresence, loadHistoryPresence, loadMonth } = useHistory();
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfLocalMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<LocalDateKey | null>(null);
  const monthState = getMonthState(displayedMonth);
  const currentMonth = startOfLocalMonth();
  const isCurrentMonth = isSameLocalMonth(displayedMonth, currentMonth);
  const markedDateKeys = useMemo(() => new Set(monthState.wears.map((wear) => wear.wornOn)), [monthState.wears]);

  const loadDisplayedHistory = useCallback(() => {
    void loadMonth(displayedMonth).catch(() => undefined);
    void loadHistoryPresence().catch(() => undefined);
  }, [displayedMonth, loadHistoryPresence, loadMonth]);

  useFocusEffect(useCallback(() => {
    loadDisplayedHistory();
  }, [loadDisplayedHistory]));

  const changeMonth = (amount: number) => {
    setSelectedDateKey(null);
    setDisplayedMonth((month) => shiftLocalMonth(month, amount));
  };

  const retry = () => {
    void loadMonth(displayedMonth, { force: true }).catch(() => undefined);
    void loadHistoryPresence({ force: true }).catch(() => undefined);
  };

  const hasMonthHistory = monthState.wears.length > 0;
  const hasNoHistory = historyPresence.hasLoaded && historyPresence.hasHistory === false;
  const hasNoMonthHistory = historyPresence.hasLoaded && historyPresence.hasHistory === true && monthState.hasLoaded && !hasMonthHistory;
  const isInitialLoading = (!monthState.hasLoaded && monthState.isLoading) || (!historyPresence.hasLoaded && historyPresence.isLoading);
  const hasError = Boolean(monthState.error || historyPresence.error);

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.kicker}>PERSONAL OUTFIT DIARY</Text>
    <Text style={styles.title}>History</Text>
    <Text style={styles.sub}>The looks you wore, day by day.</Text>

    <View style={styles.monthHeader}>
      <Pressable accessibilityLabel="Previous month" hitSlop={10} onPress={() => changeMonth(-1)} style={styles.monthButton}>
        <Text style={styles.monthButtonText}>‹</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.monthTitle}>{formatLocalMonth(displayedMonth)}</Text>
      <Pressable accessibilityLabel="Next month" disabled={isCurrentMonth} hitSlop={10} onPress={() => changeMonth(1)} style={[styles.monthButton, isCurrentMonth && styles.monthButtonDisabled]}>
        <Text style={[styles.monthButtonText, isCurrentMonth && styles.monthButtonTextDisabled]}>›</Text>
      </Pressable>
    </View>

    <MonthCalendar markedDateKeys={markedDateKeys} month={displayedMonth} onMarkedDatePress={setSelectedDateKey} selectedDateKey={selectedDateKey} />

    <HistoryStatus
      hasError={hasError}
      hasMonthHistory={hasMonthHistory}
      hasNoHistory={hasNoHistory}
      hasNoMonthHistory={hasNoMonthHistory}
      isLoading={isInitialLoading}
      monthLabel={formatLocalMonth(displayedMonth)}
      onRetry={retry}
    />
  </ScrollView>;
}

function HistoryStatus({ hasError, hasMonthHistory, hasNoHistory, hasNoMonthHistory, isLoading, monthLabel, onRetry }: {
  hasError: boolean;
  hasMonthHistory: boolean;
  hasNoHistory: boolean;
  hasNoMonthHistory: boolean;
  isLoading: boolean;
  monthLabel: string;
  onRetry: () => void;
}) {
  if (hasError) return <View style={styles.status}>
    <Text style={styles.statusTitle}>We couldn’t refresh your history.</Text>
    <Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.retry}>Try again</Text></Pressable>
  </View>;

  if (isLoading) return <View style={styles.status}>
    <View style={styles.loadingLine} />
    <View style={styles.loadingLineShort} />
  </View>;

  if (hasNoHistory) return <View style={styles.empty}>
    <Text style={styles.emptyTitle}>Your outfit history starts here.</Text>
    <Text style={styles.emptyText}>Wear an outfit from your Library and it’ll show up here.</Text>
    <Link href="/" asChild><Pressable accessibilityRole="button" style={styles.libraryAction}><Text style={styles.libraryActionText}>Go to Library</Text></Pressable></Link>
  </View>;

  if (hasNoMonthHistory) return <View style={styles.monthEmpty}>
    <Text style={styles.monthEmptyText}>No outfits logged in {monthLabel}.</Text>
  </View>;

  if (hasMonthHistory) return <View style={styles.placeholder}>
    {/* Checkpoint 3 replaces this with the chronological outfit feed. */}
    <Text style={styles.placeholderText}>Your logged looks for this month will appear here.</Text>
  </View>;

  return null;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 42 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 8 },
  title: { color: colors.text, fontSize: 36, fontWeight: '700', letterSpacing: -1.2, marginTop: 5 },
  sub: { color: colors.muted, fontSize: 15, marginTop: 5 },
  monthHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  monthTitle: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  monthButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  monthButtonDisabled: { opacity: 0.35 },
  monthButtonText: { color: colors.text, fontSize: 30, lineHeight: 32 },
  monthButtonTextDisabled: { color: colors.muted },
  status: { backgroundColor: colors.chip, borderRadius: 6, marginTop: 28, paddingHorizontal: spacing.lg, paddingVertical: 24 },
  statusTitle: { color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  retry: { color: colors.accent, fontSize: 14, fontWeight: '700', marginTop: 11, textAlign: 'center' },
  loadingLine: { alignSelf: 'center', backgroundColor: colors.line, borderRadius: 4, height: 12, width: '65%' },
  loadingLineShort: { alignSelf: 'center', backgroundColor: colors.line, borderRadius: 4, height: 10, marginTop: 10, width: '42%' },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 42 },
  emptyTitle: { color: colors.text, fontSize: 21, fontWeight: '700', lineHeight: 28, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'center' },
  libraryAction: { alignItems: 'center', borderColor: colors.text, borderRadius: 14, borderWidth: 1, justifyContent: 'center', marginTop: 22, minHeight: 50, paddingHorizontal: spacing.lg },
  libraryActionText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  monthEmpty: { paddingTop: 30 },
  monthEmptyText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  placeholder: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: 28, paddingTop: 22 },
  placeholderText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
});
