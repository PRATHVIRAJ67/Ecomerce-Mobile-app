import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { AuthShell, FormError, safeNext, useCloseAuth } from '@/components/AuthShell';
import { Button, Txt } from '@/components/ui';
import { AView } from '@/components/ui/animated';
import { auth, type OtpMode } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { C } from '@/lib/theme';
import { toast } from '@/store';

const LENGTH = 6;
const RESEND_AFTER = 45;

/** One-time code verification for email sign-in, sign-up confirmation and password recovery. */
export default function OtpScreen() {
  const params = useLocalSearchParams<{ email: string; mode: OtpMode; next?: string }>();
  const email = params.email ?? '';
  const mode: OtpMode = params.mode === 'signup' || params.mode === 'recovery' ? params.mode : 'email';
  const next = safeNext(params.next, '');
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_AFTER);
  const close = useCloseAuth();
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  useEffect(() => {
    const t = setInterval(() => setWait((w) => (w > 0 ? w - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const verify = async (value = code) => {
    if (value.length !== LENGTH) return;
    setBusy(true);
    setError(null);
    try {
      await auth.verifyCode(mode, email, value);
      haptic.success();
      if (mode === 'recovery') {
        router.replace('/new-password');
        return;
      }
      toast.success(mode === 'signup' ? 'Your account is verified. Welcome to URU!' : 'Signed in');
      close(next);
    } catch (err) {
      haptic.error();
      setError(errorMessage(err));
      setCode('');
      shake.set(withSequence(withTiming(-10, { duration: 50 }), withTiming(10, { duration: 50 }), withTiming(-6, { duration: 50 }), withTiming(0, { duration: 50 })));
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await auth.resend(mode, email);
      setWait(RESEND_AFTER);
      toast.info('A new code is on its way');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const title = mode === 'signup' ? 'Verify your email' : mode === 'recovery' ? 'Reset your password' : 'Enter your code';

  return (
    <AuthShell title={title} subtitle={`We sent a ${LENGTH}-digit code to ${email}. It expires in a few minutes.`}>
      <FormError message={error} />
      <Pressable onPress={() => input.current?.focus()} accessibilityLabel={`Verification code, ${code.length} of ${LENGTH} digits entered`}>
        <AView style={[{ flexDirection: 'row', justifyContent: 'space-between' }, shakeStyle]}>
          {Array.from({ length: LENGTH }, (_, i) => {
            const filled = i < code.length;
            const active = i === code.length;
            return (
              <View key={i} className={`h-[58px] w-[48px] items-center justify-center rounded-2xl border-2 bg-white ${active ? 'border-forest-600' : filled ? 'border-forest-300' : 'border-line'}`}>
                <Txt weight="bold" className="text-[22px]">
                  {code[i] ?? ''}
                </Txt>
              </View>
            );
          })}
        </AView>
      </Pressable>
      {/* Hidden field drives the boxes; supports SMS/email one-time-code autofill. */}
      <TextInput
        ref={input}
        value={code}
        onChangeText={(t) => {
          const digits = t.replace(/\D/g, '').slice(0, LENGTH);
          setCode(digits);
          if (digits.length === LENGTH) void verify(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={LENGTH}
        caretHidden
        selectionColor={C.terracotta}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        accessibilityLabel="Verification code"
      />
      <Button title="Verify" size="lg" loading={busy} disabled={code.length !== LENGTH} onPress={() => void verify()} />
      <View className="flex-row justify-center">
        {wait > 0 ? (
          <Txt className="text-[13.5px] text-muted">Resend code in {wait}s</Txt>
        ) : (
          <Pressable accessibilityRole="button" onPress={resend} hitSlop={8}>
            <Txt weight="semibold" className="text-[13.5px] text-forest-700">
              Resend code
            </Txt>
          </Pressable>
        )}
      </View>
      {mode === 'signup' ? <Txt className="text-center text-[12.5px] leading-[18px] text-muted">You can also tap the link in the email, then come back and sign in.</Txt> : null}
    </AuthShell>
  );
}
