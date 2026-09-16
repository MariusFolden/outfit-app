import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
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

  const selectSuggestion = () => {
    if (!matching.length) {
      setSuggestion(null);
      return;
    }
    const unseen = matching.filter((outfit) => !shownIds.includes(outfit.id));
    const startingNewCycle = unseen.length === 0;
    const pool = startingNewCycle && suggestion && matching.length > 1
      ? matching.filter((outfit) => outfit.id !== suggestion.id)
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

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>A LITTLE INSPIRATION</Text>
    <Text style={styles.title}>What should{'\n'}I wear?</Text>
    <Text style={styles.sub}>Choose the moment. We’ll choose a look.</Text>
    <Text style={styles.label}>OCCASION</Text>
    <View style={styles.chips}>
      {categories.map((item) => <Chip key={item.id} label={item.name} selected={categoryId === item.id} onPress={() => changeCategory(item.id)} />)}
    </View>
    {suggestion ? <Link href={{ pathname: '/outfit/[id]', params: { id: suggestion.id } }} asChild>
      <Pressable style={styles.suggestion}>
        <OutfitImage uri={suggestion.imageUri} cacheKey={suggestion.photoPath} style={styles.image} accessibilityLabel={suggestion.name || 'Suggested outfit'} />
        <View style={styles.caption}>
          <Text style={styles.suggested}>TODAY’S SUGGESTION</Text>
          <Text style={styles.outfitName}>{suggestion.name || 'Untitled outfit'}</Text>
          <Text style={styles.categories}>{suggestion.categories.map((item) => item.name).join(' · ')}</Text>
        </View>
      </Pressable>
    </Link> : <View style={styles.empty}>
      <Text style={styles.emptyMark}>*</Text>
      <Text style={styles.emptyTitle}>{isLoading ? 'Loading your looks...' : matching.length ? 'Ready when you are' : selectedCategory ? `No ${selectedCategory.name.toLowerCase()} outfits yet` : 'No categories yet'}</Text>
      <Text style={styles.emptyText}>{matching.length ? 'Press below for a saved look.' : 'Save a look in this category, then come back for a suggestion.'}</Text>
    </View>}
    <PrimaryButton label={suggestion ? 'Show me another' : 'Suggest an outfit'} disabled={!matching.length} onPress={selectSuggestion} style={styles.button} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 8 },
  title: { color: colors.text, fontSize: 37, fontWeight: '700', letterSpacing: -1.2, lineHeight: 41, marginTop: 5 },
  sub: { color: colors.muted, fontSize: 15, marginTop: 8 },
  label: { color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginTop: 30 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 11 },
  empty: { alignItems: 'center', backgroundColor: colors.chip, borderRadius: 6, height: 330, justifyContent: 'center', marginTop: 26, paddingHorizontal: 30 },
  emptyMark: { color: colors.accent, fontSize: 28 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  suggestion: { backgroundColor: colors.surface, marginTop: 26 },
  image: { aspectRatio: 0.84, borderRadius: 6, width: '100%' },
  caption: { paddingTop: 14 },
  suggested: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  outfitName: { color: colors.text, fontSize: 23, fontWeight: '700', letterSpacing: -0.4, marginTop: 4 },
  categories: { color: colors.muted, fontSize: 14, marginTop: 5 },
  button: { marginTop: 25 },
});
