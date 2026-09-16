import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Outfit } from '../types/outfit';
import { OutfitImage } from './OutfitImage';

export const OutfitCard = memo(function OutfitCard({ outfit }: { outfit: Outfit }) {
  return <Link href={{ pathname: '/outfit/[id]', params: { id: outfit.id } }} asChild>
    <Pressable style={styles.card}>
      <OutfitImage uri={outfit.imageUri} cacheKey={outfit.photoPath} style={styles.image} accessibilityLabel={outfit.name || 'Untitled outfit'} />
      {outfit.isFavorite && <View style={styles.favorite}><Text style={styles.favoriteText}>♥</Text></View>}
      <Text numberOfLines={1} style={styles.name}>{outfit.name || 'Untitled outfit'}</Text>
    </Pressable>
  </Link>;
});

const styles = StyleSheet.create({
  card: { marginBottom: 22, width: '48.3%' },
  image: { aspectRatio: 0.72, backgroundColor: colors.chip, borderRadius: 5, width: '100%' },
  favorite: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, height: 30, justifyContent: 'center', position: 'absolute', right: 9, top: 9, width: 30 },
  favoriteText: { color: colors.accent, fontSize: 15 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 9 },
});
