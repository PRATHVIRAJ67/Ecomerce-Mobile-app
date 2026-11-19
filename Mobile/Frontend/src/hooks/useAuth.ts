import type { Profile } from '@ecommerce/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import { keys } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Email or password is incorrect.';
  if (m.includes('email not confirmed')) return 'Please verify your email first — enter the code we sent you.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Try signing in.';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('token has expired') || m.includes('invalid') && m.includes('otp')) return 'That code is invalid or has expired. Request a new one.';
  if (m.includes('password should be')) return 'Password must be at least 8 characters.';
  return message;
}

const need = () => {
  if (!supabase) throw new Error('Customer accounts are not configured for this app yet.');
  return supabase;
};

export type OtpMode = 'email' | 'signup' | 'recovery';

/** Auth actions — Supabase Auth on the client; the API verifies the JWT on every request. */
export const auth = {
  async signIn(email: string, password: string) {
    const { error } = await need().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(friendly(error.message));
  },
  async signUp(full_name: string, email: string, password: string): Promise<{ needsVerification: boolean }> {
    const { data, error } = await need().auth.signUp({ email: email.trim(), password, options: { data: { full_name: full_name.trim() } } });
    if (error) throw new Error(friendly(error.message));
    if (data.user?.identities && data.user.identities.length === 0) throw new Error('An account with this email already exists. Try signing in.');
    return { needsVerification: !data.session };
  },
  /** Passwordless sign-in: emails a one-time code to an existing account. */
  async sendLoginCode(email: string) {
    const { error } = await need().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
    if (error) throw new Error(friendly(error.message));
  },
  async sendRecoveryCode(email: string) {
    const { error } = await need().auth.resetPasswordForEmail(email.trim());
    if (error) throw new Error(friendly(error.message));
  },
  async resend(mode: OtpMode, email: string) {
    if (mode === 'signup') {
      const { error } = await need().auth.resend({ type: 'signup', email: email.trim() });
      if (error) throw new Error(friendly(error.message));
    } else if (mode === 'recovery') await auth.sendRecoveryCode(email);
    else await auth.sendLoginCode(email);
  },
  async verifyCode(mode: OtpMode, email: string, token: string) {
    const { error } = await need().auth.verifyOtp({ email: email.trim(), token: token.trim(), type: mode });
    if (error) throw new Error(friendly(error.message));
  },
  async updatePassword(password: string) {
    const { error } = await need().auth.updateUser({ password });
    if (error) throw new Error(friendly(error.message));
  },
  async signOut() {
    await supabase?.auth.signOut();
    queryClient.removeQueries({ queryKey: ['me'] });
  },
};

/** Keeps the Zustand session in sync with Supabase. Mount once at the root. */
export function useAuthListener() {
  const setSession = useAuthStore((s) => s.setSession);
  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [setSession]);
}

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const initialised = useAuthStore((s) => s.initialised);
  const userId = session?.user.id;
  const me = useQuery({
    queryKey: [...keys.profile, userId],
    queryFn: () => api.get<Profile>('/me'),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    retry: (c, e) => !(e instanceof ApiError && (e.status === 401 || e.status === 403)) && c < 2,
  });

  // Suspended account or revoked session → sign out locally; the visitor keeps browsing as a guest.
  useEffect(() => {
    if (me.error instanceof ApiError && (me.error.status === 401 || me.error.status === 403)) void auth.signOut();
  }, [me.error]);

  return {
    session,
    userId,
    ready: initialised,
    isSignedIn: Boolean(session),
    profile: me.data ?? null,
    email: me.data?.email ?? session?.user.email ?? null,
  };
}
