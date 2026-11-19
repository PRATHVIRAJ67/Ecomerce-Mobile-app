import type { CartSummary, ProductCard } from '@ecommerce/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { api, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { keys } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { toast, useAuthStore, useGuest } from '@/store';

const EMPTY: CartSummary = { lines: [], item_count: 0, subtotal: 0, shipping_fee: 0, total: 0, has_unavailable_items: false };
type Purchasable = Pick<ProductCard, 'id' | 'name' | 'max_order_quantity' | 'in_stock'>;

const usePending = create<{ ids: string[]; set: (id: string, on: boolean) => void }>()((set) => ({
  ids: [],
  set: (id, on) => set((s) => ({ ids: on ? [...s.ids, id] : s.ids.filter((x) => x !== id) })),
}));

const userId = () => useAuthStore.getState().session?.user.id;
const cartKey = (uid: string | undefined) => [...keys.cart, uid] as const;

function fetchServerCart() {
  return api.get<CartSummary>('/me/cart');
}

/** Full cart summary. Signed in → server cart; guest → server-priced preview of the local cart. */
export function useCart() {
  const session = useAuthStore((s) => s.session);
  const initialised = useAuthStore((s) => s.initialised);
  const guestLines = useGuest((s) => s.cart);
  const uid = session?.user.id;
  const signedIn = Boolean(session);

  const server = useQuery({ queryKey: cartKey(uid), queryFn: fetchServerCart, enabled: signedIn, staleTime: 15_000 });
  const guest = useQuery({
    queryKey: ['catalog', 'cart-preview', guestLines],
    queryFn: () => api.post<CartSummary>('/catalog/cart-preview', { items: guestLines }),
    enabled: initialised && !signedIn && guestLines.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const q = signedIn ? server : guest;
  const summary = signedIn ? server.data : guestLines.length ? guest.data : EMPTY;
  return {
    summary,
    isLoading: !initialised || (signedIn ? server.isPending : guestLines.length > 0 && guest.isPending),
    isRefetching: q.isRefetching,
    error: q.error,
    refetch: () => q.refetch(),
  };
}

/** Item count for badges — cheap selector, re-renders only when the count changes. */
export function useCartCount(): number {
  const session = useAuthStore((s) => s.session);
  const guestCount = useGuest((s) => s.cart.reduce((n, l) => n + l.quantity, 0));
  const server = useQuery({ queryKey: cartKey(session?.user.id), queryFn: fetchServerCart, enabled: Boolean(session), staleTime: 15_000, select: (c) => c.item_count });
  return session ? (server.data ?? 0) : guestCount;
}

/** Quantity of one product in the cart (product cards / PDP). */
export function useCartQuantity(productId: string): number {
  const session = useAuthStore((s) => s.session);
  const guestQty = useGuest((s) => s.cart.find((l) => l.product_id === productId)?.quantity ?? 0);
  const server = useQuery({
    queryKey: cartKey(session?.user.id),
    queryFn: fetchServerCart,
    enabled: Boolean(session),
    staleTime: 15_000,
    select: (c) => c.lines.find((l) => l.product_id === productId)?.quantity ?? 0,
  });
  return session ? (server.data ?? 0) : guestQty;
}

export const useCartPending = (productId: string) => usePending((s) => s.ids.includes(productId));

function currentQuantity(productId: string): number {
  const uid = userId();
  if (!uid) return useGuest.getState().cart.find((l) => l.product_id === productId)?.quantity ?? 0;
  return queryClient.getQueryData<CartSummary>(cartKey(uid))?.lines.find((l) => l.product_id === productId)?.quantity ?? 0;
}

/** Cart mutations. Stock/limits are enforced again by the API on every write and at checkout. */
export const cart = {
  async setQuantity(product: Purchasable, quantity: number): Promise<boolean> {
    const qty = Math.max(0, Math.floor(quantity));
    if (qty > 0 && !product.in_stock) {
      haptic.error();
      toast.error(`${product.name} is out of stock`);
      return false;
    }
    if (qty > product.max_order_quantity) {
      haptic.warning();
      toast.info(`Only ${product.max_order_quantity} of ${product.name} can be ordered right now`);
      return false;
    }
    const uid = userId();
    if (!uid) {
      useGuest.getState().setCartQuantity(product.id, qty);
      return true;
    }
    usePending.getState().set(product.id, true);
    try {
      queryClient.setQueryData(cartKey(uid), await api.put<CartSummary>(`/me/cart/${product.id}`, { quantity: qty }));
      return true;
    } catch (e) {
      haptic.error();
      toast.error(errorMessage(e));
      void queryClient.invalidateQueries({ queryKey: keys.cart });
      return false;
    } finally {
      usePending.getState().set(product.id, false);
    }
  },

  async add(product: Purchasable, quantity = 1): Promise<boolean> {
    const current = currentQuantity(product.id);
    if (current >= product.max_order_quantity) {
      haptic.warning();
      toast.info(`You already have the maximum (${product.max_order_quantity}) of ${product.name}`);
      return false;
    }
    const ok = await cart.setQuantity(product, Math.min(current + quantity, product.max_order_quantity));
    if (ok) {
      haptic.success();
      toast.success(`${product.name} added to cart`, { label: 'View', href: '/cart' });
    }
    return ok;
  },

  async remove(productId: string) {
    const uid = userId();
    haptic.light();
    if (!uid) {
      useGuest.getState().setCartQuantity(productId, 0);
      return;
    }
    usePending.getState().set(productId, true);
    try {
      queryClient.setQueryData(cartKey(uid), await api.put<CartSummary>(`/me/cart/${productId}`, { quantity: 0 }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      usePending.getState().set(productId, false);
    }
  },

  async clear() {
    const uid = userId();
    if (!uid) {
      useGuest.getState().clearCart();
      return;
    }
    try {
      queryClient.setQueryData(cartKey(uid), await api.del<CartSummary>('/me/cart'));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  },

  /** After sign-in: move the guest cart into the account. The server skips unavailable items. */
  async mergeGuest(uid: string) {
    const lines = useGuest.getState().cart;
    if (!lines.length) return;
    try {
      queryClient.setQueryData(cartKey(uid), await api.post<CartSummary>('/me/cart/merge', { items: lines }));
      useGuest.getState().clearCart();
    } catch (e) {
      toast.error(`We couldn't move your saved cart: ${errorMessage(e)}`);
    }
  },
};
