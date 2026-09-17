import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '../providers/OnboardingProvider';
import { colors, spacing } from '../theme';

const pages = [
  {
    headline: 'Your personal outfit library',
    copy: 'Save the outfits you actually wear and find them again when you need inspiration.',
  },
  {
    headline: 'Build your library',
    copy: 'Add a photo whenever you wear an outfit. Organize it with categories and favorites.',
  },
  {
    headline: 'Remember what you wore',
    copy: 'Log outfits as you wear them and your History becomes a visual diary over time.',
  },
] as const;

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();
  const [pageIndex, setPageIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const page = pages[pageIndex];
  const isLastPage = pageIndex === pages.length - 1;

  const finish = async () => {
    if (isCompleting) return;
    setError(null);
    setIsCompleting(true);
    try {
      await completeOnboarding();
    } catch {
      setError('We couldn’t save your progress. Please try again.');
      setIsCompleting(false);
    }
  };

  return <SafeAreaView style={styles.page}>
    <View style={styles.topRow}>
      {!isLastPage ? <Pressable accessibilityRole="button" disabled={isCompleting} onPress={() => { void finish(); }} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable> : <View style={styles.skipButton} />}
      <Text style={styles.step}>{pageIndex + 1} / {pages.length}</Text>
    </View>

    <OnboardingVisual pageIndex={pageIndex} />

    <View style={styles.copyBlock}>
      <Text style={styles.headline}>{page.headline}</Text>
      <Text style={styles.copy}>{page.copy}</Text>
    </View>

    <View style={styles.bottom}>
      <View accessibilityLabel={`Page ${pageIndex + 1} of ${pages.length}`} style={styles.indicator}>
        {pages.map((_, index) => <View key={index} style={[styles.dot, index === pageIndex && styles.dotActive]} />)}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        accessibilityRole="button"
        disabled={isCompleting}
        onPress={() => isLastPage ? void finish() : setPageIndex((current) => current + 1)}
        style={[styles.primaryAction, isCompleting && styles.primaryActionDisabled]}
      >
        <Text style={styles.primaryActionText}>{isCompleting ? 'Just a moment…' : isLastPage ? 'Get started' : 'Next'}</Text>
      </Pressable>
    </View>
  </SafeAreaView>;
}

function OnboardingVisual({ pageIndex }: { pageIndex: number }) {
  return <View accessibilityLabel="Editorial placeholder for future onboarding photography" style={styles.visual}>
    <View style={[styles.frame, styles.frameLarge, pageIndex === 1 && styles.frameLargeShifted]} />
    <View style={[styles.frame, styles.frameSmall, pageIndex === 2 && styles.frameSmallShifted]} />
    <View style={[styles.accentShape, pageIndex === 1 && styles.accentShapeWarm, pageIndex === 2 && styles.accentShapeTall]} />
    <Text style={styles.visualLabel}>{pageIndex === 0 ? 'A LOOK, SAVED' : pageIndex === 1 ? 'MADE YOURS' : 'YOUR STORY'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.background, flex: 1, paddingHorizontal: spacing.lg },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 54 },
  skipButton: { alignItems: 'flex-start', justifyContent: 'center', minHeight: 44, minWidth: 54 },
  skipText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  step: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  visual: { backgroundColor: colors.chip, borderRadius: 8, flex: 1, marginTop: spacing.md, maxHeight: 390, minHeight: 210, overflow: 'hidden', position: 'relative' },
  frame: { borderColor: colors.surface, borderWidth: 1, position: 'absolute' },
  frameLarge: { height: '72%', left: '16%', top: '13%', transform: [{ rotate: '-8deg' }], width: '53%' },
  frameLargeShifted: { left: '29%', transform: [{ rotate: '7deg' }] },
  frameSmall: { bottom: '10%', height: '42%', right: '14%', transform: [{ rotate: '8deg' }], width: '37%' },
  frameSmallShifted: { bottom: '17%', right: '25%', transform: [{ rotate: '-5deg' }] },
  accentShape: { backgroundColor: colors.accentSoft, borderRadius: 999, height: 112, position: 'absolute', right: '-8%', top: '8%', width: 112 },
  accentShapeWarm: { opacity: 0.8 },
  accentShapeTall: { height: 176, right: '8%', top: '48%', width: 68 },
  visualLabel: { bottom: 23, color: colors.text, fontSize: 11, fontWeight: '700', left: 23, letterSpacing: 1.5, position: 'absolute' },
  copyBlock: { paddingBottom: spacing.lg, paddingTop: spacing.xl },
  headline: { color: colors.text, fontSize: 34, fontWeight: '700', letterSpacing: -1.1, lineHeight: 39, maxWidth: 330 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 12, maxWidth: 350 },
  bottom: { paddingBottom: spacing.md, paddingTop: spacing.sm },
  indicator: { alignSelf: 'center', flexDirection: 'row', marginBottom: spacing.lg },
  dot: { backgroundColor: colors.line, borderRadius: 4, height: 7, marginHorizontal: 4, width: 7 },
  dotActive: { backgroundColor: colors.accent, width: 20 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18, marginBottom: spacing.sm, textAlign: 'center' },
  primaryAction: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 14, justifyContent: 'center', minHeight: 54 },
  primaryActionDisabled: { opacity: 0.5 },
  primaryActionText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
