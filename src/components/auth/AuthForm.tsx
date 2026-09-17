import { AuthError } from '@supabase/supabase-js';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../theme';
import { PrimaryButton } from '../ui';

type Mode = 'sign-in' | 'sign-up';

function messageFor(error: AuthError, mode: Mode) {
  const message = error.message.toLowerCase();
  if (message.includes('invalid login credentials')) return 'That email or password doesn’t look right.';
  if (message.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (message.includes('password should be at least')) return 'Choose a longer password and try again.';
  if (message.includes('network') || message.includes('fetch')) return 'We couldn’t reach your account. Check your connection and try again.';
  return mode === 'sign-in' ? 'We couldn’t sign you in. Please try again.' : 'We couldn’t create your account. Please try again.';
}

function AuthField({ label, value, onChangeText, secure = false, autoComplete }: { label: string; value: string; onChangeText: (value: string) => void; secure?: boolean; autoComplete: 'email' | 'password' | 'new-password' }) {
  return <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} autoCapitalize="none" autoCorrect={false} autoComplete={autoComplete} keyboardType={secure ? 'default' : 'email-address'} secureTextEntry={secure} placeholder={secure ? '••••••••' : 'you@example.com'} placeholderTextColor={colors.muted} style={styles.field} /></View>;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const isSignUp = mode === 'sign-up';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setErrorMessage(null);
    setNotice(null);

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Enter your password.');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setErrorMessage('Your passwords don’t match.');
      return;
    }

    setIsSubmitting(true);
    const result = isSignUp
      ? await supabase.auth.signUp({ email: normalizedEmail, password })
      : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(messageFor(result.error, mode));
      return;
    }
    if (isSignUp && !result.data.session) {
      setNotice('Your account is ready. Check your email before signing in.');
    }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Link href="/welcome" asChild><Pressable accessibilityRole="button" style={styles.back}><Text style={styles.backText}>‹ Welcome</Text></Pressable></Link>
      <View style={styles.hero}>
        <Text style={styles.kicker}>PERSONAL OUTFIT LIBRARY</Text>
        <Text style={styles.title}>{isSignUp ? 'Start saving\nyour looks.' : 'Welcome\nback.'}</Text>
        <Text style={styles.sub}>{isSignUp ? 'A private place for every outfit you wore.' : 'Your saved looks are waiting for you.'}</Text>
      </View>
      <View style={styles.form}>
        <AuthField label="EMAIL" value={email} onChangeText={setEmail} autoComplete="email" />
        <AuthField label="PASSWORD" value={password} onChangeText={setPassword} secure autoComplete={isSignUp ? 'new-password' : 'password'} />
        {isSignUp && <AuthField label="CONFIRM PASSWORD" value={confirmPassword} onChangeText={setConfirmPassword} secure autoComplete="new-password" />}
        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}
        <PrimaryButton label={isSubmitting ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'} onPress={submit} disabled={isSubmitting} style={styles.submit} />
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{isSignUp ? 'Already have an account?' : 'New to Outfit Library?'}</Text>
          <Link href={isSignUp ? '/sign-in' : '/sign-up'} asChild><Pressable><Text style={styles.switchLink}>{isSignUp ? 'Sign in' : 'Create one'}</Text></Pressable></Link>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: 'space-between', padding: spacing.lg, paddingBottom: 42, paddingTop: 24 },
  back: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 40 },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  hero: { paddingTop: 20 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 39, fontWeight: '700', letterSpacing: -1.4, lineHeight: 43, marginTop: 8 },
  sub: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 12, maxWidth: 290 },
  form: { marginTop: 58 },
  fieldGroup: { marginBottom: 19 },
  fieldLabel: { color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  field: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, height: 54, paddingHorizontal: 15 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  notice: { color: colors.accent, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  submit: { marginTop: 18 },
  switchRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  switchText: { color: colors.muted, fontSize: 14, marginRight: 6 },
  switchLink: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
