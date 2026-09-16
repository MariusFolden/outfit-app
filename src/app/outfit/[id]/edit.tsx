import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { OutfitForm } from '../../../components/OutfitForm';
import { useOutfits } from '../../../data/outfitStore';

export default function EditOutfit() { const { id } = useLocalSearchParams<{ id: string }>(); const { outfits, updateOutfit } = useOutfits(); const router = useRouter(); const outfit = outfits.find((item) => item.id === id); if (!outfit) return <View><Text>Outfit not found.</Text></View>; const draft = { imageUri: outfit.imageUri, name: outfit.name, categoryIds: outfit.categories.map((category) => category.id), notes: outfit.notes, isFavorite: outfit.isFavorite }; return <OutfitForm initial={draft} allowPhotoChange={false} buttonLabel="Save changes" onSave={async (next) => { await updateOutfit(outfit.id, next); router.back(); }} />; }
