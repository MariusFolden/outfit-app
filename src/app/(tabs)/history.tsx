import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, SectionList, SectionListData, StyleSheet, Text, View } from 'react-native';
import { HistoryOutfitCard } from '../../components/HistoryOutfitCard';
import { MonthCalendar } from '../../components/MonthCalendar';
import { useOutfits } from '../../data/outfitStore';
import { formatLocalMonth, fromLocalDateKey, isSameLocalMonth, shiftLocalMonth, startOfLocalMonth } from '../../lib/localDate';
import { useHistory } from '../../providers/HistoryProvider';
import { colors, spacing } from '../../theme';
import type { LocalDateKey, OutfitWear } from '../../types/history';
import type { Outfit } from '../../types/outfit';

type HistoryFeedItem = {
  outfit: Outfit;
  wear: OutfitWear;
};

type HistorySection = SectionListData<HistoryFeedItem> & {
  dateKey: LocalDateKey;
  title: string;
};

function formatDateHeading(dateKey: LocalDateKey) {
  return fromLocalDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function HistoryScreen() {
  const { outfits } = useOutfits();
  const { getMonthState, historyPresence, loadHistoryPresence, loadMonth, removeWear } = useHistory();
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfLocalMonth());
  const [failedWear, setFailedWear] = useState<OutfitWear | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<LocalDateKey | null>(null);
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [removingWearId, setRemovingWearId] = useState<string | null>(null);
  const listRef = useRef<SectionList<HistoryFeedItem, HistorySection>>(null);
  const pendingSectionIndex = useRef<number | null>(null);
  const removingWearIdRef = useRef<string | null>(null);
  const scrollRetryAttempt = useRef(0);
  const monthState = getMonthState(displayedMonth);
  const currentMonth = startOfLocalMonth();
  const isCurrentMonth = isSameLocalMonth(displayedMonth, currentMonth);
  const markedDateKeys = useMemo(() => new Set(monthState.wears.map((wear) => wear.wornOn)), [monthState.wears]);
  const sections = useMemo<HistorySection[]>(() => {
    const outfitsById = new Map(outfits.map((outfit) => [outfit.id, outfit]));
    const byDate = new Map<LocalDateKey, HistoryFeedItem[]>();

    monthState.wears.forEach((wear) => {
      const outfit = outfitsById.get(wear.outfitId);
      if (!outfit) return;
      const items = byDate.get(wear.wornOn) ?? [];
      items.push({ outfit, wear });
      byDate.set(wear.wornOn, items);
    });

    return [...byDate.entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([dateKey, items]) => ({
        dateKey,
        title: formatDateHeading(dateKey),
        data: [...items].sort((left, right) => right.wear.createdAt.localeCompare(left.wear.createdAt)),
      }));
  }, [monthState.wears, outfits]);

  const loadDisplayedHistory = useCallback(() => {
    void loadMonth(displayedMonth).catch(() => undefined);
    void loadHistoryPresence().catch(() => undefined);
  }, [displayedMonth, loadHistoryPresence, loadMonth]);

  useFocusEffect(useCallback(() => {
    loadDisplayedHistory();
  }, [loadDisplayedHistory]));

  const changeMonth = (amount: number) => {
    setFailedWear(null);
    setRemovalError(null);
    setSelectedDateKey(null);
    setDisplayedMonth((month) => shiftLocalMonth(month, amount));
  };

  const retry = useCallback(() => {
    void loadMonth(displayedMonth, { force: true }).catch(() => undefined);
    void loadHistoryPresence({ force: true }).catch(() => undefined);
  }, [displayedMonth, loadHistoryPresence, loadMonth]);

  const removeHistoryWear = useCallback(async (wear: OutfitWear) => {
    if (removingWearIdRef.current) return;
    removingWearIdRef.current = wear.id;
    setRemovalError(null);
    setFailedWear(null);
    setRemovingWearId(wear.id);
    try {
      await removeWear(wear);
    } catch {
      setFailedWear(wear);
      setRemovalError('We couldn’t remove this history entry. Please try again.');
    } finally {
      removingWearIdRef.current = null;
      setRemovingWearId(null);
    }
  }, [removeWear]);

  const confirmRemoveHistoryWear = useCallback((wear: OutfitWear) => {
    if (removingWearIdRef.current) return;
    Alert.alert('Remove this history entry?', 'This will not delete the outfit.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { void removeHistoryWear(wear); } },
    ]);
  }, [removeHistoryWear]);

  const scrollToSection = useCallback((sectionIndex: number) => {
    listRef.current?.scrollToLocation({ animated: true, itemIndex: 0, sectionIndex, viewOffset: 0 });
  }, []);

  const handleMarkedDatePress = useCallback((dateKey: LocalDateKey) => {
    setSelectedDateKey(dateKey);
    const sectionIndex = sections.findIndex((section) => section.dateKey === dateKey);
    if (sectionIndex < 0) return;
    pendingSectionIndex.current = sectionIndex;
    scrollRetryAttempt.current = 0;
    requestAnimationFrame(() => scrollToSection(sectionIndex));
  }, [scrollToSection, sections]);

  const handleScrollToIndexFailed = useCallback(({ averageItemLength, index }: { averageItemLength: number; index: number }) => {
    const sectionIndex = pendingSectionIndex.current;
    if (sectionIndex === null) return;
    if (scrollRetryAttempt.current > 0) {
      pendingSectionIndex.current = null;
      return;
    }
    scrollRetryAttempt.current += 1;
    listRef.current?.getScrollResponder()?.scrollTo({ animated: false, y: averageItemLength * index });
    setTimeout(() => scrollToSection(sectionIndex), 100);
  }, [scrollToSection]);

  const hasMonthHistory = monthState.wears.length > 0;
  const hasNoHistory = historyPresence.hasLoaded && historyPresence.hasHistory === false;
  const hasNoMonthHistory = historyPresence.hasLoaded && historyPresence.hasHistory === true && monthState.hasLoaded && !hasMonthHistory;
  const isInitialLoading = (!monthState.hasLoaded && monthState.isLoading) || (!historyPresence.hasLoaded && historyPresence.isLoading);
  const hasError = Boolean(monthState.error || historyPresence.error);
  const isRefreshing = monthState.isRefreshing || historyPresence.isLoading && historyPresence.hasLoaded;
  const hasFeedEntries = sections.length > 0;

  useEffect(() => {
    if (selectedDateKey && !markedDateKeys.has(selectedDateKey)) setSelectedDateKey(null);
  }, [markedDateKeys, selectedDateKey]);

  const renderItem = useCallback(({ item }: { item: HistoryFeedItem }) => <HistoryOutfitCard isRemoving={removingWearId !== null} isRemovingThis={removingWearId === item.wear.id} outfit={item.outfit} onRemoveRequest={confirmRemoveHistoryWear} wear={item.wear} />, [confirmRemoveHistoryWear, removingWearId]);
  const renderSectionHeader = useCallback(({ section }: { section: HistorySection }) => <Text style={styles.dateHeading}>{section.title}</Text>, []);

  return <SectionList<HistoryFeedItem, HistorySection>
    ref={listRef}
    sections={sections}
    renderItem={renderItem}
    renderSectionHeader={renderSectionHeader}
    keyExtractor={(item) => item.wear.id}
    ListHeaderComponent={<HistoryHeader
      displayedMonth={displayedMonth}
      isCurrentMonth={isCurrentMonth}
      markedDateKeys={markedDateKeys}
      onChangeMonth={changeMonth}
      onMarkedDatePress={handleMarkedDatePress}
      selectedDateKey={selectedDateKey}
    />}
    ListEmptyComponent={<HistoryEmptyState
      hasError={hasError}
      hasNoHistory={hasNoHistory}
      hasNoMonthHistory={hasNoMonthHistory}
      isLoading={isInitialLoading}
      monthLabel={formatLocalMonth(displayedMonth)}
      onRetry={retry}
    />}
    ListFooterComponent={hasFeedEntries && (hasError || removalError) ? <HistoryFeedback message={removalError ?? 'We couldn’t refresh your history.'} onRetry={removalError && failedWear ? () => { void removeHistoryWear(failedWear); } : retry} /> : null}
    contentContainerStyle={styles.content}
    initialNumToRender={4}
    maxToRenderPerBatch={4}
    onRefresh={retry}
    onScrollToIndexFailed={handleScrollToIndexFailed}
    refreshing={isRefreshing}
    showsVerticalScrollIndicator={false}
    stickySectionHeadersEnabled={false}
    windowSize={7}
  />;
}

function HistoryHeader({ displayedMonth, isCurrentMonth, markedDateKeys, onChangeMonth, onMarkedDatePress, selectedDateKey }: {
  displayedMonth: Date;
  isCurrentMonth: boolean;
  markedDateKeys: ReadonlySet<LocalDateKey>;
  onChangeMonth: (amount: number) => void;
  onMarkedDatePress: (date: LocalDateKey) => void;
  selectedDateKey: LocalDateKey | null;
}) {
  return <View style={styles.header}>
    <Text style={styles.kicker}>PERSONAL OUTFIT DIARY</Text>
    <Text style={styles.title}>History</Text>
    <Text style={styles.sub}>The looks you wore, day by day.</Text>

    <View style={styles.monthHeader}>
      <Pressable accessibilityLabel="Previous month" hitSlop={10} onPress={() => onChangeMonth(-1)} style={styles.monthButton}>
        <Text style={styles.monthButtonText}>‹</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.monthTitle}>{formatLocalMonth(displayedMonth)}</Text>
      <Pressable accessibilityLabel="Next month" disabled={isCurrentMonth} hitSlop={10} onPress={() => onChangeMonth(1)} style={[styles.monthButton, isCurrentMonth && styles.monthButtonDisabled]}>
        <Text style={[styles.monthButtonText, isCurrentMonth && styles.monthButtonTextDisabled]}>›</Text>
      </Pressable>
    </View>

    <MonthCalendar markedDateKeys={markedDateKeys} month={displayedMonth} onMarkedDatePress={onMarkedDatePress} selectedDateKey={selectedDateKey} />
  </View>;
}

function HistoryEmptyState({ hasError, hasNoHistory, hasNoMonthHistory, isLoading, monthLabel, onRetry }: {
  hasError: boolean;
  hasNoHistory: boolean;
  hasNoMonthHistory: boolean;
  isLoading: boolean;
  monthLabel: string;
  onRetry: () => void;
}) {
  if (hasError) return <RefreshError onRetry={onRetry} />;

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

  return null;
}

function RefreshError({ onRetry }: { onRetry: () => void }) {
  return <HistoryFeedback message="We couldn’t refresh your history." onRetry={onRetry} />;
}

function HistoryFeedback({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.status}>
    <Text style={styles.statusTitle}>{message}</Text>
    <Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.retry}>Try again</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 42 },
  header: { paddingHorizontal: spacing.lg },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 8 },
  title: { color: colors.text, fontSize: 36, fontWeight: '700', letterSpacing: -1.2, marginTop: 5 },
  sub: { color: colors.muted, fontSize: 15, marginTop: 5 },
  monthHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  monthTitle: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  monthButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  monthButtonDisabled: { opacity: 0.35 },
  monthButtonText: { color: colors.text, fontSize: 30, lineHeight: 32 },
  monthButtonTextDisabled: { color: colors.muted },
  dateHeading: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2, marginBottom: 13, marginTop: 32, paddingHorizontal: spacing.lg },
  status: { backgroundColor: colors.chip, borderRadius: 6, marginHorizontal: spacing.lg, marginTop: 28, paddingHorizontal: spacing.lg, paddingVertical: 24 },
  statusTitle: { color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  retry: { color: colors.accent, fontSize: 14, fontWeight: '700', marginTop: 11, textAlign: 'center' },
  loadingLine: { alignSelf: 'center', backgroundColor: colors.line, borderRadius: 4, height: 12, width: '65%' },
  loadingLineShort: { alignSelf: 'center', backgroundColor: colors.line, borderRadius: 4, height: 10, marginTop: 10, width: '42%' },
  empty: { alignItems: 'center', paddingHorizontal: 56, paddingTop: 42 },
  emptyTitle: { color: colors.text, fontSize: 21, fontWeight: '700', lineHeight: 28, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'center' },
  libraryAction: { alignItems: 'center', borderColor: colors.text, borderRadius: 14, borderWidth: 1, justifyContent: 'center', marginTop: 22, minHeight: 50, paddingHorizontal: spacing.lg },
  libraryActionText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  monthEmpty: { paddingHorizontal: spacing.lg, paddingTop: 30 },
  monthEmptyText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
});
