import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { OutfitForm } from '../../../components/OutfitForm';
import { useOutfits } from '../../../data/outfitStore';

export default function EditOutfit() { const { id } = useLocalSearchParams<{ id: string }>(); const { outfits, updateOutfit } = useOutfits(); const router = useRouter(); const outfit = outfits.find((item) => item.id === id); if (!outfit) return <View><Text>Outfit not found.</Text></View>; const { id: _id, createdAt: _createdAt, ...draft } = outfit; return <OutfitForm initial={draft} buttonLabel="Save changes" onSave={(next) => { updateOutfit(outfit.id, next); router.back(); }} />; }
