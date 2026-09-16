import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

export function AuthLoadingScreen() {
  return <View style={styles.page}><Text style={styles.kicker}>PERSONAL OUTFIT LIBRARY</Text><Text style={styles.title}>Outfit App</Text><Text style={styles.caption}>Gathering your looks...</Text></View>;
}

const styles = StyleSheet.create({
  page: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: 24 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 34, fontWeight: '700', letterSpacing: -1, marginTop: 7 },
  caption: { color: colors.muted, fontSize: 15, marginTop: 12 },
});
