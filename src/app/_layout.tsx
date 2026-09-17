import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen';
import { OutfitProvider } from '../data/outfitStore';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { HistoryProvider } from '../providers/HistoryProvider';
import { colors } from '../theme';

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;

  return <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' }, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={Boolean(session)}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="outfit/[id]" options={{ title: 'Outfit' }} />
      <Stack.Screen name="outfit/[id]/edit" options={{ title: 'Edit outfit', presentation: 'modal' }} />
      <Stack.Screen name="categories" options={{ title: 'My categories', presentation: 'modal' }} />
    </Stack.Protected>
    <Stack.Protected guard={!session}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  return <AuthProvider><OutfitProvider><HistoryProvider><StatusBar style="dark" /><RootNavigator /></HistoryProvider></OutfitProvider></AuthProvider>;
}
