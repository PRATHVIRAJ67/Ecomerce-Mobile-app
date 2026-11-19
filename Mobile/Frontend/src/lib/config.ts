import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API base URL.
 * - Production: set EXPO_PUBLIC_API_URL (e.g. https://api.yourdomain.com/api/v1).
 * - Development: falls back to the Expo dev server's LAN host on port 4000, so a real phone running
 *   Expo Go / a dev build reaches the Admin backend on your computer without editing anything.
 */
function devApiUrl(): string {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:4000/api/v1`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api/v1'; // Android emulator → host machine
  return 'http://localhost:4000/api/v1';
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || devApiUrl()).replace(/\/+$/, '');
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
