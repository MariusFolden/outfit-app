import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Outfit } from '../types/outfit';
import { colors } from '../theme';
import { OutfitImage } from './OutfitImage';

export function OutfitGrid({ outfits }: { outfits: Outfit[] }) {
  return <View style={styles.grid}>{outfits.map((outfit) => <Link href={{ pathname: '/outfit/[id]', params: { id: outfit.id } }} asChild key={outfit.id}>
    <Pressable style={styles.card}>
      <OutfitImage uri={outfit.imageUri} cacheKey={outfit.photoPath} style={styles.image} accessibilityLabel={outfit.name || 'Untitled outfit'} />
      {outfit.isFavorite && <View style={styles.favorite}><Text style={styles.favoriteText}>♥</Text></View>}
      <Text numberOfLines={1} style={styles.name}>{outfit.name || 'Untitled outfit'}</Text>
    </Pressable>
  </Link>)}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { marginBottom: 22, width: '48.3%' },
  image: { aspectRatio: 0.72, backgroundColor: colors.chip, borderRadius: 5, width: '100%' },
  favorite: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, height: 30, justifyContent: 'center', position: 'absolute', right: 9, top: 9, width: 30 },
  favoriteText: { color: colors.accent, fontSize: 15 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 9 },
});
