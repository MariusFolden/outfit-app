import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { OutfitImage } from '../../components/OutfitImage';
import { useOutfits } from '../../data/outfitStore';
import { colors, spacing } from '../../theme';

export default function OutfitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outfits, toggleFavorite, deleteOutfit, isSaving } = useOutfits();
  const router = useRouter();
  const outfit = outfits.find((item) => item.id === id);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!outfit) {
    if (isDeleting) return null;
    return <View style={styles.notFound}><Text style={styles.notFoundText}>This outfit is no longer in your library.</Text></View>;
  }

  const completeDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOutfit(outfit.id);
      if (router.canGoBack()) router.back();
      else router.dismissAll();
    } catch (error) {
      setIsDeleting(false);
      Alert.alert('Could not delete outfit', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const remove = () => Alert.alert('Delete outfit?', 'This removes the saved outfit and its private photo.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { void completeDelete(); } },
  ]);
  const favorite = () => void toggleFavorite(outfit.id).catch((error) => Alert.alert('Could not update favorite', error instanceof Error ? error.message : 'Please try again.'));

  return <ScrollView contentContainerStyle={styles.content}>
    <OutfitImage uri={outfit.imageUri} cacheKey={outfit.photoPath} style={styles.image} accessibilityLabel={outfit.name || 'Untitled outfit'} />
    <View style={styles.body}>
      <View style={styles.top}>
        <View style={styles.titleWrap}>
          <Text style={styles.kicker}>SAVED LOOK</Text>
          <Text style={styles.title}>{outfit.name || 'Untitled outfit'}</Text>
        </View>
        <Pressable disabled={isSaving} onPress={favorite} style={styles.favorite}>
          <Text style={styles.heart}>{outfit.isFavorite ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
      <View style={styles.tags}>{outfit.categories.map((category) => <View style={styles.tag} key={category.id}><Text style={styles.tagText}>{category.name}</Text></View>)}</View>
      {outfit.notes && <View style={styles.notes}><Text style={styles.label}>NOTES</Text><Text style={styles.notesText}>{outfit.notes}</Text></View>}
      <Text style={styles.date}>Saved {new Date(outfit.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
      <Link href={{ pathname: '/outfit/[id]/edit', params: { id: outfit.id } }} asChild>
        <Pressable style={styles.edit}><Text style={styles.editText}>Edit outfit</Text></Pressable>
      </Link>
      <Pressable disabled={isSaving} onPress={remove} style={styles.delete}>
        <Text style={styles.deleteText}>{isSaving ? 'Deleting...' : 'Delete outfit'}</Text>
      </Pressable>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  image: { aspectRatio: 0.78, backgroundColor: colors.chip, width: '100%' },
  body: { padding: spacing.lg },
  top: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  titleWrap: { flex: 1 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.8, marginTop: 5 },
  favorite: { alignItems: 'center', borderColor: colors.line, borderRadius: 22, borderWidth: 1, height: 44, justifyContent: 'center', marginLeft: 16, width: 44 },
  heart: { color: colors.accent, fontSize: 23 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 22 },
  tag: { backgroundColor: colors.chip, borderRadius: 100, marginBottom: 8, marginRight: 8, paddingHorizontal: 12, paddingVertical: 7 },
  tagText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  notes: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: 22, paddingTop: 20 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  notesText: { color: colors.text, fontSize: 16, lineHeight: 24, marginTop: 8 },
  date: { color: colors.muted, fontSize: 13, marginTop: 24 },
  edit: { alignItems: 'center', borderColor: colors.text, borderRadius: 13, borderWidth: 1, marginTop: 30, minHeight: 52, justifyContent: 'center' },
  editText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  delete: { alignItems: 'center', marginTop: 20 },
  deleteText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  notFound: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  notFoundText: { color: colors.muted, textAlign: 'center' },
});
