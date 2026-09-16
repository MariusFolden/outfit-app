import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OutfitImage } from '../../components/OutfitImage';
import { Chip, PrimaryButton } from '../../components/ui';
import { useOutfits } from '../../data/outfitStore';
import { colors, spacing } from '../../theme';
import { Outfit } from '../../types/outfit';

export default function DiscoverScreen() {
  const { outfits, categories, isLoading } = useOutfits();
  const [categoryId, setCategoryId] = useState('');
  const [suggestion, setSuggestion] = useState<Outfit | null>(null);
  const [shownIds, setShownIds] = useState<string[]>([]);

  useEffect(() => {
    if (!categoryId && categories.length) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const selectedCategory = categories.find((category) => category.id === categoryId);
  const matching = useMemo(
    () => outfits.filter((outfit) => outfit.categories.some((category) => category.id === categoryId)),
    [outfits, categoryId],
  );
  const activeSuggestion = suggestion ? matching.find((outfit) => outfit.id === suggestion.id) ?? null : null;

  useEffect(() => {
    if (!suggestion) return;
    if (!activeSuggestion) {
      setSuggestion(null);
      setShownIds([]);
      return;
    }
    if (activeSuggestion !== suggestion) setSuggestion(activeSuggestion);
  }, [activeSuggestion, suggestion]);

  const selectSuggestion = () => {
    if (!matching.length) {
      setSuggestion(null);
      return;
    }
    const unseen = matching.filter((outfit) => !shownIds.includes(outfit.id));
    const startingNewCycle = unseen.length === 0;
    const pool = startingNewCycle && activeSuggestion && matching.length > 1
      ? matching.filter((outfit) => outfit.id !== activeSuggestion.id)
      : unseen.length ? unseen : matching;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setSuggestion(next);
    setShownIds(startingNewCycle ? [next.id] : [...shownIds, next.id]);
  };

  const changeCategory = (nextId: string) => {
    setCategoryId(nextId);
    setSuggestion(null);
    setShownIds([]);
  };

  const hasOneMatch = matching.length === 1;
  const hasMultipleMatches = matching.length > 1;
  const actionLabel = hasOneMatch
    ? activeSuggestion ? 'Your only saved look' : 'Show my saved look'
    : activeSuggestion ? 'Show me another' : 'Suggest an outfit';
  const actionDisabled = !matching.length || (hasOneMatch && Boolean(activeSuggestion));

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>A LITTLE INSPIRATION</Text>
    <Text style={styles.title}>What should{'\n'}I wear?</Text>
    <Text style={styles.sub}>Choose the moment. We’ll choose a look.</Text>
    <Text style={styles.label}>OCCASION</Text>
    <View style={styles.chips}>
      {categories.map((item) => <Chip key={item.id} label={item.name} selected={categoryId === item.id} onPress={() => changeCategory(item.id)} />)}
    </View>
    {hasMultipleMatches && <Text style={styles.matchCount}>{matching.length} saved looks</Text>}
    {activeSuggestion ? <Link href={{ pathname: '/outfit/[id]', params: { id: activeSuggestion.id } }} asChild>
      <Pressable style={styles.suggestion}>
        <OutfitImage uri={activeSuggestion.imageUri} cacheKey={activeSuggestion.photoPath} style={styles.image} accessibilityLabel={activeSuggestion.name || 'Suggested outfit'} />
        <View style={styles.caption}>
          <Text style={styles.suggested}>{hasOneMatch ? 'YOUR ONLY SAVED LOOK' : 'TODAY’S SUGGESTION'}</Text>
          <Text style={styles.outfitName}>{activeSuggestion.name || 'Untitled outfit'}</Text>
          <Text style={styles.categories}>{activeSuggestion.categories.map((item) => item.name).join(' · ')}</Text>
        </View>
      </Pressable>
    </Link> : <DiscoverEmpty hasMatches={matching.length > 0} isLoading={isLoading} selectedCategoryName={selectedCategory?.name} />}
    <PrimaryButton label={actionLabel} disabled={actionDisabled} onPress={selectSuggestion} style={styles.button} />
  </ScrollView>;
}

function DiscoverEmpty({ hasMatches, isLoading, selectedCategoryName }: { hasMatches: boolean; isLoading: boolean; selectedCategoryName?: string }) {
  if (isLoading) return <View style={styles.empty}>
    <Text style={styles.emptyTitle}>Loading your looks...</Text>
  </View>;

  if (hasMatches) return <View style={styles.empty}>
    <Text style={styles.emptyMark}>*</Text>
    <Text style={styles.emptyTitle}>Ready when you are</Text>
    <Text style={styles.emptyText}>Press below for a saved look.</Text>
  </View>;

  if (!selectedCategoryName) return <View style={styles.empty}>
    <Text style={styles.emptyMark}>*</Text>
    <Text style={styles.emptyTitle}>No categories yet</Text>
    <Text style={styles.emptyText}>Add a category to start finding a look for the moment.</Text>
  </View>;

  return <View style={styles.empty}>
    <Text style={styles.emptyMark}>*</Text>
    <Text style={styles.emptyTitle}>No saved {selectedCategoryName.toLowerCase()} looks yet</Text>
    <Text style={styles.emptyText}>Save an outfit for this occasion, then come back for a suggestion.</Text>
    <Link href="/add" asChild><Pressable style={styles.emptyAction}><Text style={styles.emptyActionText}>Save an outfit</Text></Pressable></Link>
  </View>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 8 },
  title: { color: colors.text, fontSize: 37, fontWeight: '700', letterSpacing: -1.2, lineHeight: 41, marginTop: 5 },
  sub: { color: colors.muted, fontSize: 15, marginTop: 8 },
  label: { color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginTop: 30 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 11 },
  matchCount: { color: colors.muted, fontSize: 13, marginTop: 3 },
  empty: { alignItems: 'center', backgroundColor: colors.chip, borderRadius: 6, minHeight: 330, justifyContent: 'center', marginTop: 26, paddingHorizontal: 30, paddingVertical: 28 },
  emptyMark: { color: colors.accent, fontSize: 28 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  emptyAction: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 14, justifyContent: 'center', marginTop: 22, minHeight: 50, paddingHorizontal: spacing.lg },
  emptyActionText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  suggestion: { backgroundColor: colors.surface, marginTop: 26 },
  image: { aspectRatio: 0.84, borderRadius: 6, width: '100%' },
  caption: { paddingTop: 14 },
  suggested: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  outfitName: { color: colors.text, fontSize: 23, fontWeight: '700', letterSpacing: -0.4, marginTop: 4 },
  categories: { color: colors.muted, fontSize: 14, marginTop: 5 },
  button: { marginTop: 25 },
});
