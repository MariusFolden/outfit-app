import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

type Props = {
  uri?: string;
  cacheKey?: string;
  style: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function OutfitImage({ uri, cacheKey, style, accessibilityLabel }: Props) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setHasLoaded(false);
    setHasFailed(false);
  }, [uri]);

  return <View style={[styles.frame, style]} accessibilityLabel={accessibilityLabel}>
    <View pointerEvents="none" style={styles.placeholder}>
      {hasFailed && <Text style={styles.placeholderMark}>*</Text>}
    </View>
    {uri && !hasFailed && <ExpoImage
      source={cacheKey ? { uri, cacheKey } : { uri }}
      style={[StyleSheet.absoluteFill, !hasLoaded && styles.hidden]}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={180}
      onLoad={() => setHasLoaded(true)}
      onError={() => setHasFailed(true)}
    />}
  </View>;
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.chip, overflow: 'hidden' },
  placeholder: { ...StyleSheet.absoluteFill, alignItems: 'center', backgroundColor: colors.chip, justifyContent: 'center' },
  placeholderMark: { color: colors.muted, fontSize: 20 },
  hidden: { opacity: 0 },
});
