import { Link } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme';

export default function WelcomeScreen() {
  return <SafeAreaView style={styles.page}>
    <View style={styles.visual}>
      <View style={styles.frameLarge} />
      <View style={styles.frameSmall} />
      <View style={styles.accentShape} />
      <Text style={styles.visualLabel}>A PLACE FOR YOUR LOOKS</Text>
    </View>

    <View style={styles.copyBlock}>
      <Text style={styles.kicker}>PERSONAL OUTFIT LIBRARY</Text>
      <Text style={styles.title}>Outfit Library</Text>
      <Text style={styles.sub}>Save what you wear. Find what to wear.</Text>
    </View>

    <View style={styles.actions}>
      <Link href="/sign-up" asChild><Pressable accessibilityRole="button" style={styles.primaryAction}><Text style={styles.primaryActionText}>Create account</Text></Pressable></Link>
      <Link href="/sign-in" asChild><Pressable accessibilityRole="button" style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Log in</Text></Pressable></Link>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.background, flex: 1, paddingHorizontal: spacing.lg },
  visual: { backgroundColor: colors.chip, borderRadius: 8, flex: 1, marginTop: spacing.xl, maxHeight: 420, minHeight: 250, overflow: 'hidden', position: 'relative' },
  frameLarge: { borderColor: colors.surface, borderWidth: 1, height: '68%', left: '16%', position: 'absolute', top: '15%', transform: [{ rotate: '-7deg' }], width: '54%' },
  frameSmall: { borderColor: colors.surface, borderWidth: 1, bottom: '12%', height: '40%', position: 'absolute', right: '14%', transform: [{ rotate: '8deg' }], width: '36%' },
  accentShape: { backgroundColor: colors.accentSoft, borderRadius: 999, height: 126, position: 'absolute', right: '-8%', top: '9%', width: 126 },
  visualLabel: { bottom: 24, color: colors.text, fontSize: 11, fontWeight: '700', left: 24, letterSpacing: 1.4, position: 'absolute' },
  copyBlock: { paddingBottom: spacing.xl, paddingTop: spacing.xl },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 38, fontWeight: '700', letterSpacing: -1.2, marginTop: 8 },
  sub: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 10 },
  actions: { paddingBottom: spacing.lg },
  primaryAction: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 14, justifyContent: 'center', minHeight: 54 },
  primaryActionText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  secondaryAction: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, minHeight: 48 },
  secondaryActionText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
