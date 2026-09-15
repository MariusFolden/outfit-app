import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OutfitDraft } from '../types/outfit';
import { useOutfits } from '../data/outfitStore';
import { colors, spacing } from '../theme';
import { Chip, Field, PrimaryButton, SectionLabel } from './ui';

type Props = { initial?: OutfitDraft; onSave: (draft: OutfitDraft) => void; buttonLabel: string };

export function OutfitForm({ initial, onSave, buttonLabel }: Props) {
  const { categories, addCategory } = useOutfits();
  const [imageUri, setImageUri] = useState(initial?.imageUri ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [selected, setSelected] = useState(initial?.categories ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [newCategory, setNewCategory] = useState('');

  const chooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch {
      Alert.alert('Could not open photos', 'Please try choosing a photo again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permission needed', 'Allow access to your camera to add an outfit photo.'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch {
      Alert.alert('Could not open camera', 'Please try taking a photo again.');
    }
  };
  const toggleCategory = (category: string) => setSelected((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  const createCategory = () => { const category = addCategory(newCategory); if (category && !selected.includes(category)) setSelected((current) => [...current, category]); setNewCategory(''); };
  const save = () => { if (!imageUri) { Alert.alert('Add a photo', 'Choose a photo or take one before saving this outfit.'); return; } onSave({ imageUri, name: name.trim() || undefined, categories: selected, notes: notes.trim() || undefined, isFavorite }); };

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <SectionLabel>Outfit photo</SectionLabel>
    {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : <View style={styles.photoEmpty}><Text style={styles.photoIcon}>✦</Text><Text style={styles.photoTitle}>A look worth remembering</Text><Text style={styles.photoSub}>Choose a photo of a complete outfit.</Text></View>}
    <View style={styles.photoActions}><Pressable onPress={chooseFromLibrary} style={styles.photoAction}><Text style={styles.photoActionText}>Choose photo</Text></Pressable><Pressable onPress={takePhoto} style={styles.photoAction}><Text style={styles.photoActionText}>Take photo</Text></Pressable></View>
    <View style={styles.section}><SectionLabel>Outfit name <Text style={styles.optional}>optional</Text></SectionLabel><Field value={name} onChangeText={setName} placeholder="e.g. Sunday in the city" /></View>
    <View style={styles.section}><SectionLabel>Categories</SectionLabel><View style={styles.chips}>{categories.map((category) => <Chip key={category} label={category} selected={selected.includes(category)} onPress={() => toggleCategory(category)} />)}</View><View style={styles.newCategory}><Field value={newCategory} onChangeText={setNewCategory} placeholder="Create a category" /><Pressable onPress={createCategory} style={styles.addCategory}><Text style={styles.addCategoryText}>Add</Text></Pressable></View></View>
    <View style={styles.section}><SectionLabel>Notes <Text style={styles.optional}>optional</Text></SectionLabel><Field multiline value={notes} onChangeText={setNotes} placeholder="A detail you want to remember..." /></View>
    <Pressable onPress={() => setIsFavorite((current) => !current)} style={styles.favoriteRow}><Text style={styles.favoriteMark}>{isFavorite ? '♥' : '♡'}</Text><View><Text style={styles.favoriteTitle}>Favorite outfit</Text><Text style={styles.favoriteSub}>Keep this look close at hand.</Text></View></Pressable>
    <PrimaryButton label={buttonLabel} onPress={save} style={styles.save} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 46 }, section: { marginTop: 28 }, preview: { aspectRatio: 0.78, borderRadius: 6, width: '100%' },
  photoEmpty: { alignItems: 'center', aspectRatio: 0.78, backgroundColor: colors.chip, borderColor: colors.line, borderRadius: 6, borderStyle: 'dashed', borderWidth: 1, justifyContent: 'center', padding: spacing.lg }, photoIcon: { color: colors.accent, fontSize: 25 }, photoTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 10 }, photoSub: { color: colors.muted, fontSize: 14, marginTop: 5, textAlign: 'center' },
  photoActions: { flexDirection: 'row', marginTop: 10 }, photoAction: { alignItems: 'center', borderColor: colors.line, borderRadius: 10, borderWidth: 1, flex: 1, marginRight: 8, minHeight: 46, justifyContent: 'center' }, photoActionText: { color: colors.text, fontSize: 14, fontWeight: '700' }, optional: { color: colors.muted, fontWeight: '400', textTransform: 'lowercase' }, chips: { flexDirection: 'row', flexWrap: 'wrap' },
  newCategory: { alignItems: 'center', flexDirection: 'row', marginTop: 8 }, addCategory: { alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: 10, height: 52, justifyContent: 'center', marginLeft: 8, width: 58 }, addCategoryText: { color: colors.accent, fontWeight: '700' }, favoriteRow: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', marginTop: 30, paddingTop: 20 }, favoriteMark: { color: colors.accent, fontSize: 30, marginRight: 14 }, favoriteTitle: { color: colors.text, fontSize: 16, fontWeight: '700' }, favoriteSub: { color: colors.muted, fontSize: 13, marginTop: 2 }, save: { marginTop: 28 },
});
