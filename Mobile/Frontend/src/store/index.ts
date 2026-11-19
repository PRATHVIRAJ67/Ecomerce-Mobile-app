import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const storage = createJSONStorage(() => AsyncStorage);

// ---------------------------------------------------------------------------
// Preferences (persisted, non-sensitive)
// ---------------------------------------------------------------------------
interface PrefsState {
  onboarded: boolean;
  recentSearches: string[];
  deliveryAddressId: string | null;
  notificationsSeenAt: string | null;
  setOnboarded: () => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  setDeliveryAddressId: (id: string | null) => void;
  markNotificationsSeen: () => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      onboarded: false,
      recentSearches: [],
      deliveryAddressId: null,
      notificationsSeenAt: null,
      setOnboarded: () => set({ onboarded: true }),
      addRecentSearch: (q) =>
        set((s) => {
          const t = q.trim();
          if (!t) return s;
          return { recentSearches: [t, ...s.recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      setDeliveryAddressId: (id) => set({ deliveryAddressId: id }),
      markNotificationsSeen: () => set({ notificationsSeenAt: new Date().toISOString() }),
    }),
    { name: 'uru-prefs', storage },
  ),
);

// ---------------------------------------------------------------------------
// Guest cart & wishlist (persisted until sign-in, then merged into the account server-side)
// ---------------------------------------------------------------------------
export interface GuestLine {
  product_id: string;
  quantity: number;
}

interface GuestState {
  cart: GuestLine[];
  wishlist: string[];
  setCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => boolean;
  removeWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

export const useGuest = create<GuestState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      setCartQuantity: (productId, quantity) =>
        set((s) => {
          const rest = s.cart.filter((l) => l.product_id !== productId);
          if (quantity <= 0) return { cart: rest };
          const idx = s.cart.findIndex((l) => l.product_id === productId);
          if (idx === -1) return { cart: [...s.cart, { product_id: productId, quantity }] };
          const next = [...s.cart];
          next[idx] = { product_id: productId, quantity };
          return { cart: next };
        }),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (productId) => {
        const has = get().wishlist.includes(productId);
        set((s) => ({ wishlist: has ? s.wishlist.filter((x) => x !== productId) : [productId, ...s.wishlist].slice(0, 50) }));
        return !has;
      },
      removeWishlist: (productId) => set((s) => ({ wishlist: s.wishlist.filter((x) => x !== productId) })),
      clearWishlist: () => set({ wishlist: [] }),
    }),
    { name: 'uru-guest', storage },
  ),
);

// ---------------------------------------------------------------------------
// Auth session (in memory; the token itself lives in SecureStore via supabase-js)
// ---------------------------------------------------------------------------
interface AuthStore {
  session: Session | null;
  initialised: boolean;
  setSession: (s: Session | null) => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  session: null,
  initialised: false,
  setSession: (session) => set({ session, initialised: true }),
}));

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
export type ToastTone = 'success' | 'error' | 'info';
export interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  action?: { label: string; href: string };
}

interface ToastStore {
  toasts: ToastItem[];
  show: (tone: ToastTone, message: string, action?: ToastItem['action']) => void;
  dismiss: (id: number) => void;
}

let toastId = 1;
export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  show: (tone, message, action) => {
    const id = toastId++;
    set({ toasts: [...get().toasts.slice(-1), { id, tone, message, action }] });
    setTimeout(() => get().dismiss(id), tone === 'error' ? 5000 : 3200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (m: string, action?: ToastItem['action']) => useToastStore.getState().show('success', m, action),
  error: (m: string) => useToastStore.getState().show('error', m),
  info: (m: string) => useToastStore.getState().show('info', m),
};
