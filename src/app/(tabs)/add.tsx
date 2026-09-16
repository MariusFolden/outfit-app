import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { OutfitForm } from '../../components/OutfitForm';
import { useOutfits } from '../../data/outfitStore';
import { colors } from '../../theme';

export default function AddScreen() { const { addOutfit } = useOutfits(); const router = useRouter(); return <View style={styles.page}><View style={styles.header}><Text style={styles.kicker}>NEW MEMORY</Text><Text style={styles.title}>Save an outfit</Text><Text style={styles.sub}>A complete look you want to find again.</Text></View><OutfitForm buttonLabel="Save outfit" onSave={async (draft) => { await addOutfit(draft); router.replace('/'); }} /></View>; }
const styles = StyleSheet.create({ page: { backgroundColor: colors.background, flex: 1 }, header: { paddingHorizontal: 24, paddingTop: 18 }, kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }, title: { color: colors.text, fontSize: 31, fontWeight: '700', letterSpacing: -0.8, marginTop: 5 }, sub: { color: colors.muted, fontSize: 15, marginTop: 5 } });
