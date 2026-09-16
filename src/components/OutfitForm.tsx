import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useOutfits } from '../data/outfitStore';
import { OutfitDraft } from '../types/outfit';
import { colors, spacing } from '../theme';
import { Chip, Field, PrimaryButton, SectionLabel } from './ui';

type Props = { initial?: OutfitDraft; onSave: (draft: OutfitDraft) => Promise<void>; buttonLabel: string; allowPhotoChange?: boolean };

export function OutfitForm({ initial, onSave, buttonLabel, allowPhotoChange = true }: Props) {
  const { categories, addCategory, isSaving } = useOutfits();
  const [imageUri, setImageUri] = useState(initial?.imageUri ?? '');
  const [imageMimeType, setImageMimeType] = useState(initial?.imageMimeType ?? null);
  const [name, setName] = useState(initial?.name ?? '');
  const [selected, setSelected] = useState(initial?.categoryIds ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [newCategory, setNewCategory] = useState('');

  const chooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (!result.canceled) { setImageUri(result.assets[0].uri); setImageMimeType(result.assets[0].mimeType ?? null); }
    } catch { Alert.alert('Could not open photos', 'Please try choosing a photo again.'); }
  };
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permission needed', 'Allow access to your camera to add an outfit photo.'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (!result.canceled) { setImageUri(result.assets[0].uri); setImageMimeType(result.assets[0].mimeType ?? null); }
    } catch { Alert.alert('Could not open camera', 'Please try taking a photo again.'); }
  };
  const toggleCategory = (categoryId: string) => setSelected((current) => current.includes(categoryId) ? current.filter((item) => item !== categoryId) : [...current, categoryId]);
  const createCategory = async () => {
    try {
      const category = await addCategory(newCategory);
      if (category && !selected.includes(category.id)) setSelected((current) => [...current, category.id]);
      setNewCategory('');
    } catch (error) { Alert.alert('Could not create category', error instanceof Error ? error.message : 'Please try again.'); }
  };
  const save = async () => {
    if (allowPhotoChange && !imageUri) { Alert.alert('Add a photo', 'Choose a photo or take one before saving this outfit.'); return; }
    try { await onSave({ imageUri, imageMimeType, name: name.trim() || undefined, categoryIds: selected, notes: notes.trim() || undefined, isFavorite }); }
    catch (error) { Alert.alert('Could not save outfit', error instanceof Error ? error.message : 'Please try again.'); }
  };

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <SectionLabel>Outfit photo</SectionLabel>
    {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : <View style={styles.photoEmpty}><Text style={styles.photoIcon}>*</Text><Text style={styles.photoTitle}>A look worth remembering</Text><Text style={styles.photoSub}>Choose a photo of a complete outfit.</Text></View>}
    {allowPhotoChange ? <View style={styles.photoActions}><Pressable disabled={isSaving} onPress={chooseFromLibrary} style={styles.photoAction}><Text style={styles.photoActionText}>Choose photo</Text></Pressable><Pressable disabled={isSaving} onPress={takePhoto} style={styles.photoAction}><Text style={styles.photoActionText}>Take photo</Text></Pressable></View> : <Text style={styles.photoNote}>This photo will stay as saved.</Text>}
    <View style={styles.section}><SectionLabel>Outfit name <Text style={styles.optional}>optional</Text></SectionLabel><Field value={name} onChangeText={setName} placeholder="e.g. Sunday in the city" /></View>
    <View style={styles.section}><SectionLabel>Categories</SectionLabel><View style={styles.chips}>{categories.map((category) => <Chip key={category.id} label={category.name} selected={selected.includes(category.id)} onPress={() => toggleCategory(category.id)} />)}</View><View style={styles.newCategory}><Field value={newCategory} onChangeText={setNewCategory} placeholder="Create a category" /><Pressable disabled={isSaving} onPress={() => void createCategory()} style={styles.addCategory}><Text style={styles.addCategoryText}>Add</Text></Pressable></View></View>
    <View style={styles.section}><SectionLabel>Notes <Text style={styles.optional}>optional</Text></SectionLabel><Field multiline value={notes} onChangeText={setNotes} placeholder="A detail you want to remember..." /></View>
    <Pressable disabled={isSaving} onPress={() => setIsFavorite((current) => !current)} style={styles.favoriteRow}><Text style={styles.favoriteMark}>{isFavorite ? '♥' : '♡'}</Text><View><Text style={styles.favoriteTitle}>Favorite outfit</Text><Text style={styles.favoriteSub}>Keep this look close at hand.</Text></View></Pressable>
    <PrimaryButton label={isSaving ? 'Saving...' : buttonLabel} disabled={isSaving} onPress={() => void save()} style={styles.save} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 46 }, section: { marginTop: 28 }, preview: { aspectRatio: 0.78, borderRadius: 6, width: '100%' }, photoNote: { color: colors.muted, fontSize: 13, marginTop: 10 },
  photoEmpty: { alignItems: 'center', aspectRatio: 0.78, backgroundColor: colors.chip, borderColor: colors.line, borderRadius: 6, borderStyle: 'dashed', borderWidth: 1, justifyContent: 'center', padding: spacing.lg }, photoIcon: { color: colors.accent, fontSize: 25 }, photoTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 10 }, photoSub: { color: colors.muted, fontSize: 14, marginTop: 5, textAlign: 'center' },
  photoActions: { flexDirection: 'row', marginTop: 10 }, photoAction: { alignItems: 'center', borderColor: colors.line, borderRadius: 10, borderWidth: 1, flex: 1, marginRight: 8, minHeight: 46, justifyContent: 'center' }, photoActionText: { color: colors.text, fontSize: 14, fontWeight: '700' }, optional: { color: colors.muted, fontWeight: '400', textTransform: 'lowercase' }, chips: { flexDirection: 'row', flexWrap: 'wrap' },
  newCategory: { alignItems: 'center', flexDirection: 'row', marginTop: 8 }, addCategory: { alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: 10, height: 52, justifyContent: 'center', marginLeft: 8, width: 58 }, addCategoryText: { color: colors.accent, fontWeight: '700' }, favoriteRow: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', marginTop: 30, paddingTop: 20 }, favoriteMark: { color: colors.accent, fontSize: 30, marginRight: 14 }, favoriteTitle: { color: colors.text, fontSize: 16, fontWeight: '700' }, favoriteSub: { color: colors.muted, fontSize: 13, marginTop: 2 }, save: { marginTop: 28 },
});
