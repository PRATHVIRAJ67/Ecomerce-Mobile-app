import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * Session storage in the device keychain / keystore (expo-secure-store).
 * SecureStore values are limited to ~2 KB, and a Supabase session is larger, so the value is split
 * into chunks under `<key>.0`, `<key>.1`, … with the chunk count stored at `<key>.n`.
 * On web (used only for development previews) it falls back to localStorage.
 */
const CHUNK = 1800;

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const n = Number(await SecureStore.getItemAsync(`${key}.n`));
    if (!n) return null;
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    const old = Number(await SecureStore.getItemAsync(`${key}.n`)) || 0;
    const count = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < count; i++) await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(`${key}.n`, String(count));
    for (let i = count; i < old; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
  },
  async removeItem(key: string): Promise<void> {
    const n = Number(await SecureStore.getItemAsync(`${key}.n`)) || 0;
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await SecureStore.deleteItemAsync(`${key}.n`);
  },
};

const webStorage = {
  getItem: async (k: string) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
  setItem: async (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  removeItem: async (k: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: Platform.OS === 'web' ? webStorage : secureStorage,
        storageKey: 'uru-mobile-auth',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Refresh tokens only while the app is in the foreground (Supabase guidance for React Native).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });
}
