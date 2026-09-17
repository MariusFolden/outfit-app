import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { ActionSheetIOS, Alert, GestureResponderEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import type { Outfit } from '../types/outfit';
import type { OutfitWear } from '../types/history';
import { OutfitImage } from './OutfitImage';

type HistoryOutfitCardProps = {
  isRemoving: boolean;
  isRemovingThis: boolean;
  outfit: Outfit;
  onRemoveRequest: (wear: OutfitWear) => void;
  wear: OutfitWear;
};

export const HistoryOutfitCard = memo(function HistoryOutfitCard({ isRemoving, isRemovingThis, outfit, onRemoveRequest, wear }: HistoryOutfitCardProps) {
  const router = useRouter();
  const showOverflow = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
    if (isRemoving) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        options: ['Remove from history', 'Cancel'],
      }, (selectedIndex) => {
        if (selectedIndex === 0) onRemoveRequest(wear);
      });
      return;
    }

    Alert.alert('History entry', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove from history', style: 'destructive', onPress: () => onRemoveRequest(wear) },
    ]);
  }, [isRemoving, onRemoveRequest, wear]);

  return <Pressable accessibilityHint="Opens this outfit" onPress={() => router.push({ pathname: '/outfit/[id]', params: { id: outfit.id } })} style={styles.card}>
    <View style={styles.photoWrap}>
      <OutfitImage uri={outfit.imageUri} cacheKey={outfit.photoPath} style={styles.image} accessibilityLabel={outfit.name || 'Untitled outfit'} />
      <Pressable
        accessibilityHint="Opens options for this history entry"
        accessibilityLabel={`More options for ${outfit.name || 'this outfit'}`}
        accessibilityState={{ disabled: isRemoving }}
        disabled={isRemoving}
        hitSlop={8}
        onPress={showOverflow}
        style={[styles.overflow, isRemoving && styles.overflowDisabled]}
      >
        <Text style={styles.overflowText}>•••</Text>
      </Pressable>
    </View>
    <View style={styles.caption}>
      <Text numberOfLines={1} style={styles.name}>{outfit.name || 'Untitled outfit'}</Text>
      {outfit.categories.length > 0 && <Text numberOfLines={1} style={styles.categories}>{outfit.categories.map((category) => category.name).join(' · ')}</Text>}
      {isRemovingThis && <Text style={styles.removing}>Removing…</Text>}
    </View>
  </Pressable>;
});

const styles = StyleSheet.create({
  card: { marginBottom: 30, paddingHorizontal: 24 },
  photoWrap: { position: 'relative' },
  image: { aspectRatio: 0.84, backgroundColor: colors.chip, borderRadius: 6, width: '100%' },
  overflow: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 18, height: 36, justifyContent: 'center', position: 'absolute', right: 10, top: 10, width: 36 },
  overflowDisabled: { opacity: 0.45 },
  overflowText: { color: colors.text, fontSize: 15, letterSpacing: 0.5, lineHeight: 16, marginTop: -5 },
  caption: { paddingTop: 13 },
  name: { color: colors.text, fontSize: 21, fontWeight: '700', letterSpacing: -0.35 },
  categories: { color: colors.muted, fontSize: 14, marginTop: 5 },
  removing: { color: colors.muted, fontSize: 13, marginTop: 7 },
});
