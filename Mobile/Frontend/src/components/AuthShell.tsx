import { router, useNavigation, type Href } from 'expo-router';
import { Eye, EyeOff, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabaseConfigured } from '@/lib/supabase';
import { C } from '@/lib/theme';
import { LogoMark } from './layout/BrandSplash';
import { Display, IconButton, Input, Txt } from './ui';

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, flexGrow: 1 }}>
        <View className="flex-row items-center justify-between px-4">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-forest-700">
            <LogoMark size={30} />
          </View>
          <IconButton icon={X} label="Close" tone="white" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
        <View className="px-6 pt-8">
          <Display className="text-[34px] leading-[40px]">{title}</Display>
          {subtitle ? <Txt className="mt-2 text-[15px] leading-[22px] text-ink-soft">{subtitle}</Txt> : null}
          {!supabaseConfigured ? (
            <View accessibilityRole="alert" className="mt-6 rounded-2xl bg-warning-tint p-4">
              <Txt className="text-warning">Customer accounts are’ configured for this app yet (missing Supabase settings).</Txt>
            </View>
          ) : (
            <View className="mt-8 gap-4">{children}</View>
          )}
        </View>
        <View className="flex-1" />
        {footer ? <View className="mt-8 items-center px-6">{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      secureTextEntry={!show}
      autoCapitalize="none"
      autoCorrect={false}
      right={
        <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((s) => !s)} hitSlop={10}>
          {show ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}
        </Pressable>
      }
    />
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" className="rounded-2xl bg-danger-tint px-4 py-3">
      <Txt className="text-[13.5px] text-danger">{message}</Txt>
    </View>
  );
}

/** Same-app relative routes only (prevents odd deep-link redirects). */
export function safeNext(next: unknown, fallback = '/'): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

/** Closes the whole auth modal (all its screens), then optionally opens `next`. */
export function useCloseAuth() {
  const navigation = useNavigation();
  return (next?: string) => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else router.replace('/');
    if (next) setTimeout(() => router.push(next as Href), 60);
  };
}
