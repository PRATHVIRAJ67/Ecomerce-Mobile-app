import { useState } from 'react';
import { AuthShell, FormError, PasswordInput, useCloseAuth } from '@/components/AuthShell';
import { Button } from '@/components/ui';
import { auth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { toast } from '@/store';

/** Shown after a recovery code is verified (the session is then a short-lived recovery session). */
export default function NewPassword() {
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const close = useCloseAuth();

  const submit = async () => {
    const errs = {
      password: pw.password.length < 8 ? 'Use at least 8 characters' : undefined,
      confirm: pw.password !== pw.confirm ? 'Passwords do not match' : undefined,
    };
    setErrors(errs);
    if (errs.password || errs.confirm) return haptic.error();
    setBusy(true);
    setFormError(null);
    try {
      await auth.updatePassword(pw.password);
      haptic.success();
      toast.success('Password updated');
      close();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="You're verified. Set a new password for your account.">
      <FormError message={formError} />
      <PasswordInput label="New password" value={pw.password} onChangeText={(v) => setPw({ ...pw, password: v })} error={errors.password} hint="At least 8 characters" autoComplete="new-password" textContentType="newPassword" />
      <PasswordInput label="Confirm new password" value={pw.confirm} onChangeText={(v) => setPw({ ...pw, confirm: v })} error={errors.confirm} autoComplete="new-password" textContentType="newPassword" />
      <Button title="Update password" size="lg" loading={busy} onPress={submit} />
    </AuthShell>
  );
}
