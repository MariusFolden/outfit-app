import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import type { Outfit } from '../types/outfit';
import { OutfitImage } from './OutfitImage';

export const HistoryOutfitCard = memo(function HistoryOutfitCard({ outfit }: { outfit: Outfit }) {
  return <Link href={{ pathname: '/outfit/[id]', params: { id: outfit.id } }} asChild>
    <Pressable accessibilityHint="Opens this outfit" style={styles.card}>
      <OutfitImage uri={outfit.imageUri} cacheKey={outfit.photoPath} style={styles.image} accessibilityLabel={outfit.name || 'Untitled outfit'} />
      <View style={styles.caption}>
        <Text numberOfLines={1} style={styles.name}>{outfit.name || 'Untitled outfit'}</Text>
        {outfit.categories.length > 0 && <Text numberOfLines={1} style={styles.categories}>{outfit.categories.map((category) => category.name).join(' · ')}</Text>}
      </View>
    </Pressable>
  </Link>;
});

const styles = StyleSheet.create({
  card: { marginBottom: 30, paddingHorizontal: 24 },
  image: { aspectRatio: 0.84, backgroundColor: colors.chip, borderRadius: 6, width: '100%' },
  caption: { paddingTop: 13 },
  name: { color: colors.text, fontSize: 21, fontWeight: '700', letterSpacing: -0.35 },
  categories: { color: colors.muted, fontSize: 14, marginTop: 5 },
});
