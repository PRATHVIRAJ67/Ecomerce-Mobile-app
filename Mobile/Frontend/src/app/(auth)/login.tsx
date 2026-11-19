import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { z } from 'zod';
import { AuthShell, FormError, PasswordInput, safeNext, useCloseAuth } from '@/components/AuthShell';
import { Button, Input, Txt } from '@/components/ui';
import { auth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { toast } from '@/store';

const emailSchema = z.string().trim().min(1, 'Enter your email').email('Enter a valid email address');

export default function Login() {
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next, '');
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const close = useCloseAuth();

  const leave = () => {
    haptic.success();
    toast.success('Welcome back!');
    close(next);
  };

  const submit = async () => {
    const e = emailSchema.safeParse(email);
    const errs = { email: e.success ? undefined : e.error.issues[0]?.message, password: mode === 'password' && !password ? 'Enter your password' : undefined };
    setErrors(errs);
    if (errs.email || errs.password) return haptic.error();
    setBusy(true);
    setFormError(null);
    try {
      if (mode === 'password') {
        await auth.signIn(email, password);
        leave();
      } else {
        await auth.sendLoginCode(email);
        router.push({ pathname: '/otp', params: { email: email.trim(), mode: 'email', next } });
      }
    } catch (err) {
      haptic.error();
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to check out, track orders and see your saved items."
      footer={
        <Txt className="text-ink-soft">
          New to URU?{' '}
          <Txt weight="semibold" className="text-forest-700" accessibilityRole="link" onPress={() => router.replace({ pathname: '/register', params: { next } })}>
            Create an account
          </Txt>
        </Txt>
      }
    >
      <FormError message={formError} />
      <Input label="Email" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType={mode === 'code' ? 'send' : 'next'} onSubmitEditing={mode === 'code' ? submit : undefined} />
      {mode === 'password' ? (
        <>
          <PasswordInput label="Password" value={password} onChangeText={setPassword} error={errors.password} autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
          <Pressable accessibilityRole="link" onPress={() => router.push('/forgot-password')} className="self-end" hitSlop={8}>
            <Txt weight="semibold" className="text-[13.5px] text-forest-700">
              Forgot password?
            </Txt>
          </Pressable>
        </>
      ) : (
        <Txt className="text-[13.5px] leading-[19px] text-ink-soft">W’l email you a 6-digit code to sign in — no password needed.</Txt>
      )}
      <Button title={mode === 'password' ? 'Sign in' : 'Email me a code'} size="lg" loading={busy} onPress={submit} />
      <View className="my-1 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-line" />
        <Txt className="text-[12px] text-muted">or</Txt>
        <View className="h-px flex-1 bg-line" />
      </View>
      <Button
        title={mode === 'password' ? 'Sign in with a one-time code' : 'Sign in with password'}
        icon={mode === 'password' ? Mail : KeyRound}
        variant="outline"
        onPress={() => {
          setFormError(null);
          setMode(mode === 'password' ? 'code' : 'password');
        }}
      />
    </AuthShell>
  );
}
