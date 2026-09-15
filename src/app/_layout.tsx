import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OutfitProvider } from '../data/outfitStore';
import { colors } from '../theme';

export default function RootLayout() {
  return <OutfitProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' }, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="outfit/[id]" options={{ title: 'Outfit' }} />
    <Stack.Screen name="outfit/[id]/edit" options={{ title: 'Edit outfit', presentation: 'modal' }} />
    <Stack.Screen name="categories" options={{ title: 'My categories', presentation: 'modal' }} />
  </Stack></OutfitProvider>;
}
