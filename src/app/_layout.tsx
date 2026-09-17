import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen';
import { OutfitProvider } from '../data/outfitStore';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { HistoryProvider } from '../providers/HistoryProvider';
import { OnboardingProvider, useOnboarding } from '../providers/OnboardingProvider';
import { colors } from '../theme';

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const { isComplete, isLoading: isOnboardingLoading } = useOnboarding();

  if (isLoading || isOnboardingLoading) return <AuthLoadingScreen />;

  return <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' }, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!isComplete}>
      <Stack.Screen name="onboarding" options={{ animation: 'fade', headerShown: false }} />
    </Stack.Protected>
    <Stack.Protected guard={isComplete && Boolean(session)}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="outfit/[id]" options={{ title: 'Outfit' }} />
      <Stack.Screen name="outfit/[id]/edit" options={{ title: 'Edit outfit', presentation: 'modal' }} />
      <Stack.Screen name="categories" options={{ title: 'My categories', presentation: 'modal' }} />
    </Stack.Protected>
    <Stack.Protected guard={isComplete && !session}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  return <AuthProvider><OnboardingProvider><OutfitProvider><HistoryProvider><StatusBar style="dark" /><RootNavigator /></HistoryProvider></OutfitProvider></OnboardingProvider></AuthProvider>;
}
