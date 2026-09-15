import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useOutfits } from '../../data/outfitStore';
import { OutfitGrid } from '../../components/OutfitGrid';
import { Chip } from '../../components/ui';
import { colors, spacing } from '../../theme';

export default function LibraryScreen() {
  const { outfits, categories } = useOutfits();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const filtered = useMemo(() => outfits.filter((outfit) => {
    const search = `${outfit.name ?? ''} ${outfit.notes ?? ''} ${outfit.categories.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return search && (!favoritesOnly || outfit.isFavorite) && (category === 'All' || outfit.categories.includes(category));
  }), [outfits, query, category, favoritesOnly]);
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.kicker}>PERSONAL OUTFIT LIBRARY</Text><Text style={styles.title}>Your outfits</Text><Text style={styles.sub}>Every look, right where you left it.</Text>
    <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search your outfits" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}><Chip label="All" selected={category === 'All'} onPress={() => setCategory('All')} />{categories.map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView>
    <Pressable onPress={() => setFavoritesOnly((current) => !current)} style={[styles.favoriteFilter, favoritesOnly && styles.favoriteFilterActive]}><Text style={[styles.heart, favoritesOnly && styles.heartActive]}>♥</Text><Text style={[styles.favoriteFilterText, favoritesOnly && styles.favoriteFilterTextActive]}>Favorites</Text></Pressable>
    {filtered.length ? <OutfitGrid outfits={filtered} /> : <View style={styles.empty}><Text style={styles.emptyIcon}>◌</Text><Text style={styles.emptyTitle}>Nothing to show yet</Text><Text style={styles.emptyText}>Try another filter, or save a new outfit to your library.</Text></View>}
  </ScrollView>;
}

const styles = StyleSheet.create({ content: { padding: spacing.lg, paddingBottom: 34 }, kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 8 }, title: { color: colors.text, fontSize: 36, fontWeight: '700', letterSpacing: -1.2, marginTop: 5 }, sub: { color: colors.muted, fontSize: 15, marginTop: 5 }, search: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 12, borderWidth: 1, flexDirection: 'row', height: 52, marginTop: 26, paddingHorizontal: 14 }, searchIcon: { color: colors.muted, fontSize: 24, marginRight: 8 }, searchInput: { color: colors.text, flex: 1, fontSize: 15, height: '100%' }, filterRow: { marginTop: 16 }, filterContent: { paddingRight: spacing.lg }, favoriteFilter: { alignItems: 'center', alignSelf: 'flex-start', borderColor: colors.line, borderRadius: 100, borderWidth: 1, flexDirection: 'row', marginBottom: 22, marginTop: 5, paddingHorizontal: 13, paddingVertical: 8 }, favoriteFilterActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }, heart: { color: colors.muted, marginRight: 6 }, heartActive: { color: colors.accent }, favoriteFilterText: { color: colors.muted, fontSize: 13, fontWeight: '700' }, favoriteFilterTextActive: { color: colors.accent }, empty: { alignItems: 'center', paddingHorizontal: 35, paddingTop: 70 }, emptyIcon: { color: colors.accent, fontSize: 36 }, emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 12 }, emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 7, textAlign: 'center' } });
