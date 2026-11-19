import { router } from 'expo-router';
import { useState } from 'react';
import { z } from 'zod';
import { AuthShell, FormError } from '@/components/AuthShell';
import { Button, Input } from '@/components/ui';
import { auth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = z.string().trim().email('Enter a valid email address').safeParse(email);
    setError(r.success ? undefined : r.error.issues[0]?.message);
    if (!r.success) return haptic.error();
    setBusy(true);
    setFormError(null);
    try {
      await auth.sendRecoveryCode(email);
      router.push({ pathname: '/otp', params: { email: email.trim(), mode: 'recovery' } });
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your account email and we'll send you a code to set a new password.">
      <FormError message={formError} />
      <Input label="Email" value={email} onChangeText={setEmail} error={error} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="send" onSubmitEditing={submit} />
      <Button title="Send code" size="lg" loading={busy} onPress={submit} />
    </AuthShell>
  );
}
