import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '../../theme';

const icon = (symbol: string, active: boolean) => <View style={symbol === '+' ? { backgroundColor: colors.text, borderRadius: 24, height: 48, justifyContent: 'center', marginTop: -18, width: 48 } : undefined}><Text style={{ color: symbol === '+' ? colors.white : active ? colors.text : colors.muted, fontSize: symbol === '+' ? 27 : 19, textAlign: 'center' }}>{symbol}</Text></View>;

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false, headerTitleStyle: { color: colors.text, fontWeight: '700' }, sceneStyle: { backgroundColor: colors.background }, tabBarActiveTintColor: colors.text, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.line, height: 76, paddingTop: 8 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'Library', tabBarIcon: ({ focused }) => icon('▦', focused) }} />
    <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ focused }) => icon('✦', focused) }} />
    <Tabs.Screen name="add" options={{ title: 'Add', tabBarIcon: () => icon('+', true) }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => icon('◯', focused) }} />
  </Tabs>;
}
