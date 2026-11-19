import { profileUpdateInput, type Profile } from '@ecommerce/shared';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordInput } from '@/components/AuthShell';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, Card, Display, Input, Loading, ScreenHeader, Txt } from '@/components/ui';
import { auth, useAuth } from '@/hooks/useAuth';
import { api, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { keys } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/store';

export default function ProfileScreen() {
  return (
    <RequireAuth title="Profile">
      <ProfileLoader />
    </RequireAuth>
  );
}

function ProfileLoader() {
  const { profile } = useAuth();
  if (!profile) return <Loading />;
  return <ProfileForm key={profile.id} initial={{ full_name: profile.full_name ?? '', phone: profile.phone ?? '' }} />;
}

function ProfileForm({ initial }: { initial: { full_name: string; phone: string } }) {
  const insets = useSafeAreaInsets();
  const { userId, email } = useAuth();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<{ full_name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [pwErr, setPwErr] = useState<{ password?: string; confirm?: string }>({});
  const [pwBusy, setPwBusy] = useState(false);

  const save = async () => {
    // Same schema the API validates with (Shared/validation → profileUpdateInput).
    const r = profileUpdateInput.safeParse({ full_name: form.full_name.trim(), phone: form.phone.trim() || null });
    if (!r.success) {
      const errs: typeof errors = {};
      for (const i of r.error.issues) {
        const k = i.path[0] as keyof typeof errors;
        errs[k] ??= k === 'full_name' ? 'Enter your full name (at least 2 characters)' : i.message;
      }
      setErrors(errs);
      return haptic.error();
    }
    setErrors({});
    setBusy(true);
    try {
      const updated = await api.patch<Profile>('/me', r.data);
      queryClient.setQueryData([...keys.profile, userId], (old: Profile | undefined) => ({ ...(old ?? updated), ...updated }));
      haptic.success();
      toast.success('Profile updated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    const errs = { password: pw.password.length < 8 ? 'Use at least 8 characters' : undefined, confirm: pw.password !== pw.confirm ? 'Passwords do not match' : undefined };
    setPwErr(errs);
    if (errs.password || errs.confirm) return haptic.error();
    setPwBusy(true);
    try {
      await auth.updatePassword(pw.password);
      setPw({ password: '', confirm: '' });
      haptic.success();
      toast.success('Password changed');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} className="bg-cream">
      <ScreenHeader title="Profile" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 30 }}>
        <Display className="text-[28px]">Personal details</Display>
        <Card className="gap-4">
          <Input label="Full name" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} error={errors.full_name} autoComplete="name" autoCapitalize="words" />
          <Input label="Mobile number" optional value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" />
          <View className="gap-1.5">
            <Txt weight="medium" className="text-[13px] text-ink-soft">
              Email
            </Txt>
            <View className="h-[52px] justify-center rounded-2xl border border-line bg-cream-dark/60 px-4">
              <Txt className="text-ink-soft">{email}</Txt>
            </View>
            <Txt className="text-[12.5px] text-muted">Contact support to change your email.</Txt>
          </View>
          <Button title="Save changes" loading={busy} onPress={() => void save()} />
        </Card>

        <Display className="mt-2 text-[22px]">Change password</Display>
        <Card className="gap-4">
          <PasswordInput label="New password" value={pw.password} onChangeText={(v) => setPw({ ...pw, password: v })} error={pwErr.password} hint="At least 8 characters" autoComplete="new-password" textContentType="newPassword" />
          <PasswordInput label="Confirm new password" value={pw.confirm} onChangeText={(v) => setPw({ ...pw, confirm: v })} error={pwErr.confirm} autoComplete="new-password" textContentType="newPassword" />
          <Button title="Update password" variant="outline" loading={pwBusy} onPress={() => void changePassword()} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
