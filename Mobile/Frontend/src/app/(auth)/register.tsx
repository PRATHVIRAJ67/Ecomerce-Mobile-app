import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { z } from 'zod';
import { AuthShell, FormError, PasswordInput, safeNext, useCloseAuth } from '@/components/AuthShell';
import { Button, Input, Txt } from '@/components/ui';
import { auth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { C } from '@/lib/theme';
import { toast } from '@/store';

const schema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter your full name').max(120),
    email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirm: z.string(),
    terms: z.literal(true, { message: 'Please accept the terms to continue' }),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type Form = { full_name: string; email: string; password: string; confirm: string; terms: boolean };

export default function Register() {
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next, '');
  const [form, setForm] = useState<Form>({ full_name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const close = useCloseAuth();
  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: typeof errors = {};
      for (const i of r.error.issues) errs[i.path[0] as keyof Form] ??= i.message;
      setErrors(errs);
      return haptic.error();
    }
    setErrors({});
    setBusy(true);
    setFormError(null);
    try {
      const { needsVerification } = await auth.signUp(form.full_name, form.email, form.password);
      if (needsVerification) {
        router.push({ pathname: '/otp', params: { email: form.email.trim(), mode: 'signup', next } });
      } else {
        haptic.success();
        toast.success('Welcome to URU!');
        close(next);
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
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <Txt className="text-ink-soft">
          Already have an account?{' '}
          <Txt weight="semibold" className="text-forest-700" accessibilityRole="link" onPress={() => router.replace({ pathname: '/login', params: { next } })}>
            Sign in
          </Txt>
        </Txt>
      }
    >
      <FormError message={formError} />
      <Input label="Full name" value={form.full_name} onChangeText={set('full_name')} error={errors.full_name} autoComplete="name" textContentType="name" autoCapitalize="words" />
      <Input label="Email" value={form.email} onChangeText={set('email')} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <PasswordInput label="Password" value={form.password} onChangeText={set('password')} error={errors.password} hint="At least 8 characters" autoComplete="new-password" textContentType="newPassword" />
      <PasswordInput label="Confirm password" value={form.confirm} onChangeText={set('confirm')} error={errors.confirm} autoComplete="new-password" textContentType="newPassword" />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: form.terms }}
        onPress={() => {
          haptic.tap();
          setForm((f) => ({ ...f, terms: !f.terms }));
        }}
        className="flex-row items-start gap-3"
      >
        <View className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md ${form.terms ? 'bg-forest-700' : 'border border-line bg-white'}`}>{form.terms ? <Check size={13} color={C.cream} strokeWidth={3} /> : null}</View>
        <Txt className="flex-1 text-[13.5px] leading-[19px] text-ink-soft">
          I agree to the{' '}
          <Txt weight="semibold" className="text-[13.5px] text-forest-700" onPress={() => router.push({ pathname: '/policies/[slug]', params: { slug: 'terms' } })}>
            Terms
          </Txt>{' '}
          and{' '}
          <Txt weight="semibold" className="text-[13.5px] text-forest-700" onPress={() => router.push({ pathname: '/policies/[slug]', params: { slug: 'privacy' } })}>
            Privacy policy
          </Txt>
        </Txt>
      </Pressable>
      {errors.terms ? <Txt className="-mt-2 text-[12.5px] text-danger">{errors.terms}</Txt> : null}
      <Button title="Create account" size="lg" loading={busy} onPress={submit} />
    </AuthShell>
  );
}
