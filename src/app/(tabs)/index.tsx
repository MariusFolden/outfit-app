import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ListRenderItemInfo, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { OutfitCard } from '../../components/OutfitGrid';
import { Chip } from '../../components/ui';
import { useOutfits } from '../../data/outfitStore';
import { colors, spacing } from '../../theme';
import { Category, Outfit } from '../../types/outfit';

const SKELETON_ITEMS = Array.from({ length: 6 }, (_, index) => index);

type HeaderProps = {
  categories: Category[];
  category: string;
  favoritesOnly: boolean;
  hasRefreshError: boolean;
  onCategoryChange: (categoryId: string) => void;
  onClearSearch: () => void;
  onQueryChange: (value: string) => void;
  onRetry: () => void;
  onToggleFavorites: () => void;
  query: string;
};

function LibraryHeader({ categories, category, favoritesOnly, hasRefreshError, onCategoryChange, onClearSearch, onQueryChange, onRetry, onToggleFavorites, query }: HeaderProps) {
  return <View>
    <Text style={styles.kicker}>PERSONAL OUTFIT LIBRARY</Text>
    <Text style={styles.title}>Your outfits</Text>
    <Text style={styles.sub}>Every look, right where you left it.</Text>
    <View style={styles.search}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput value={query} onChangeText={onQueryChange} placeholder="Search your outfits" placeholderTextColor={colors.muted} style={styles.searchInput} />
      {query.length > 0 && <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={onClearSearch} style={styles.clearSearch}><Text style={styles.clearSearchText}>×</Text></Pressable>}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent} keyboardShouldPersistTaps="handled">
      <Chip label="All" selected={category === 'All'} onPress={() => onCategoryChange('All')} />
      {categories.map((item) => <Chip key={item.id} label={item.name} selected={category === item.id} onPress={() => onCategoryChange(item.id)} />)}
    </ScrollView>
    <Pressable onPress={onToggleFavorites} style={[styles.favoriteFilter, favoritesOnly && styles.favoriteFilterActive]}>
      <Text style={[styles.heart, favoritesOnly && styles.heartActive]}>♥</Text>
      <Text style={[styles.favoriteFilterText, favoritesOnly && styles.favoriteFilterTextActive]}>Favorites</Text>
    </Pressable>
    {hasRefreshError && <View style={styles.refreshError}>
      <Text style={styles.refreshErrorText}>Couldn’t refresh your library.</Text>
      <Pressable onPress={onRetry}><Text style={styles.refreshRetry}>Try again</Text></Pressable>
    </View>}
  </View>;
}

function LibrarySkeleton() {
  return <View style={styles.skeletonGrid}>
    {SKELETON_ITEMS.map((item) => <View key={item} style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLine} />
    </View>)}
  </View>;
}

function LibraryEmpty({ onClearFilters, type }: { onClearFilters: () => void; type: 'empty' | 'error' | 'no-results' }) {
  if (type === 'error') return <View style={styles.empty}>
    <Text style={styles.emptyTitle}>We could not load your library</Text>
    <Text style={styles.emptyText}>Check your connection and try again.</Text>
    <Pressable onPress={onClearFilters}><Text style={styles.retry}>Try again</Text></Pressable>
  </View>;

  if (type === 'no-results') return <View style={styles.empty}>
    <Text style={styles.emptyIcon}>○</Text>
    <Text style={styles.emptyTitle}>No outfits match these filters.</Text>
    <Text style={styles.emptyText}>Your saved looks are still in your library.</Text>
    <Pressable onPress={onClearFilters}><Text style={styles.retry}>Clear filters</Text></Pressable>
  </View>;

  return <View style={styles.empty}>
    <Text style={styles.emptyIcon}>○</Text>
    <Text style={styles.emptyTitle}>Your library is ready for its first look.</Text>
    <Text style={styles.emptyText}>Save an outfit you wore, then find it again whenever you need it.</Text>
    <Link href="/add" asChild><Pressable style={styles.emptyAction}><Text style={styles.emptyActionText}>Save an outfit</Text></Pressable></Link>
  </View>;
}

export default function LibraryScreen() {
  const { outfits, categories, isLoading, isRefreshing, error, refresh } = useOutfits();
  const listRef = useRef<FlatList<Outfit>>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  useEffect(() => {
    if (category !== 'All' && !categories.some((item) => item.id === category)) setCategory('All');
  }, [categories, category]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ animated: false, offset: 0 });
  }, [normalizedQuery, category, favoritesOnly]);

  const filtered = useMemo(() => outfits.filter((outfit) => {
    const searchable = `${outfit.name ?? ''} ${outfit.notes ?? ''} ${outfit.categories.map((item) => item.name).join(' ')}`.toLocaleLowerCase();
    return searchable.includes(normalizedQuery) && (!favoritesOnly || outfit.isFavorite) && (category === 'All' || outfit.categories.some((item) => item.id === category));
  }), [outfits, normalizedQuery, category, favoritesOnly]);

  const retry = useCallback(() => void refresh().catch(() => undefined), [refresh]);
  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory('All');
    setFavoritesOnly(false);
  }, []);
  const renderItem = useCallback(({ item }: ListRenderItemInfo<Outfit>) => <OutfitCard outfit={item} />, []);
  const hasOutfits = outfits.length > 0;
  const initialLoadError = Boolean(error && !hasOutfits && !isLoading);
  const listEmpty = isLoading && !hasOutfits
    ? <LibrarySkeleton />
    : initialLoadError
      ? <LibraryEmpty type="error" onClearFilters={retry} />
      : hasOutfits
        ? <LibraryEmpty type="no-results" onClearFilters={clearFilters} />
        : <LibraryEmpty type="empty" onClearFilters={clearFilters} />;

  return <FlatList
    ref={listRef}
    data={filtered}
    renderItem={renderItem}
    keyExtractor={(outfit) => outfit.id}
    numColumns={2}
    columnWrapperStyle={filtered.length ? styles.column : undefined}
    contentContainerStyle={styles.content}
    ListHeaderComponent={<LibraryHeader
      categories={categories}
      category={category}
      favoritesOnly={favoritesOnly}
      hasRefreshError={Boolean(error && hasOutfits)}
      onCategoryChange={setCategory}
      onClearSearch={() => setQuery('')}
      onQueryChange={setQuery}
      onRetry={retry}
      onToggleFavorites={() => setFavoritesOnly((current) => !current)}
      query={query}
    />}
    ListEmptyComponent={listEmpty}
    initialNumToRender={8}
    maxToRenderPerBatch={8}
    windowSize={7}
    updateCellsBatchingPeriod={50}
    keyboardShouldPersistTaps="handled"
    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={retry} tintColor={colors.accent} />}
    showsVerticalScrollIndicator={false}
  />;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 34 },
  column: { justifyContent: 'space-between' },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 8 },
  title: { color: colors.text, fontSize: 36, fontWeight: '700', letterSpacing: -1.2, marginTop: 5 },
  sub: { color: colors.muted, fontSize: 15, marginTop: 5 },
  search: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 12, borderWidth: 1, flexDirection: 'row', height: 52, marginTop: 26, paddingHorizontal: 14 },
  searchIcon: { color: colors.muted, fontSize: 24, marginRight: 8 },
  searchInput: { color: colors.text, flex: 1, fontSize: 15, height: '100%' },
  clearSearch: { alignItems: 'center', height: 30, justifyContent: 'center', width: 30 },
  clearSearchText: { color: colors.muted, fontSize: 23, lineHeight: 25 },
  filterRow: { marginTop: 16 },
  filterContent: { paddingRight: spacing.lg },
  favoriteFilter: { alignItems: 'center', alignSelf: 'flex-start', borderColor: colors.line, borderRadius: 100, borderWidth: 1, flexDirection: 'row', marginBottom: 22, marginTop: 5, paddingHorizontal: 13, paddingVertical: 8 },
  favoriteFilterActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  heart: { color: colors.muted, marginRight: 6 },
  heartActive: { color: colors.accent },
  favoriteFilterText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  favoriteFilterTextActive: { color: colors.accent },
  refreshError: { alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, marginTop: -10, paddingHorizontal: 12, paddingVertical: 10 },
  refreshErrorText: { color: colors.text, fontSize: 13 },
  refreshRetry: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  skeletonCard: { marginBottom: 22, width: '48.3%' },
  skeletonImage: { aspectRatio: 0.72, backgroundColor: colors.chip, borderRadius: 5, width: '100%' },
  skeletonLine: { backgroundColor: colors.line, borderRadius: 4, height: 12, marginTop: 9, width: '68%' },
  empty: { alignItems: 'center', paddingHorizontal: 35, paddingTop: 48 },
  emptyIcon: { color: colors.accent, fontSize: 36 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', lineHeight: 27, marginTop: 12, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 7, textAlign: 'center' },
  retry: { color: colors.accent, fontSize: 15, fontWeight: '700', marginTop: 16 },
  emptyAction: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 14, justifyContent: 'center', marginTop: 22, minHeight: 52, paddingHorizontal: spacing.lg },
  emptyActionText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
