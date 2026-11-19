import type { ProductCard } from '@ecommerce/shared';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { keys } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { toast, useAuthStore, useGuest } from '@/store';

const wishKey = (uid: string | undefined) => [...keys.wishlist, uid] as const;
const fetchWishlist = () => api.get<ProductCard[]>('/me/wishlist');

/** Full wishlist products. Guests: ids stored locally, products fetched live from the catalogue. */
export function useWishlist() {
  const session = useAuthStore((s) => s.session);
  const initialised = useAuthStore((s) => s.initialised);
  const guestIds = useGuest((s) => s.wishlist);
  const signedIn = Boolean(session);
  const server = useQuery({ queryKey: wishKey(session?.user.id), queryFn: fetchWishlist, enabled: signedIn, staleTime: 30_000 });
  const guest = useQuery({
    queryKey: keys.lookup(guestIds),
    queryFn: () => api.get<ProductCard[]>('/catalog/products-lookup', { ids: guestIds.join(',') }),
    enabled: initialised && !signedIn && guestIds.length > 0,
    staleTime: 60_000,
  });
  const q = signedIn ? server : guest;
  const items = signedIn ? server.data : guestIds.length ? guest.data?.filter((p) => guestIds.includes(p.id)).sort((a, b) => guestIds.indexOf(a.id) - guestIds.indexOf(b.id)) : [];
  return {
    items,
    isLoading: !initialised || (signedIn ? server.isPending : guestIds.length > 0 && guest.isPending),
    isRefetching: q.isRefetching,
    error: q.error,
    refetch: () => q.refetch(),
  };
}

export function useIsWishlisted(productId: string): boolean {
  const session = useAuthStore((s) => s.session);
  const guestHas = useGuest((s) => s.wishlist.includes(productId));
  const server = useQuery({
    queryKey: wishKey(session?.user.id),
    queryFn: fetchWishlist,
    enabled: Boolean(session),
    staleTime: 30_000,
    select: (list) => list.some((p) => p.id === productId),
  });
  return session ? Boolean(server.data) : guestHas;
}

export function useWishlistCount(): number {
  const session = useAuthStore((s) => s.session);
  const guestCount = useGuest((s) => s.wishlist.length);
  const server = useQuery({ queryKey: wishKey(session?.user.id), queryFn: fetchWishlist, enabled: Boolean(session), staleTime: 30_000, select: (l) => l.length });
  return session ? (server.data ?? 0) : guestCount;
}

export const wishlist = {
  /** Returns the new state (true = saved). Optimistic for signed-in users, rolled back on failure. */
  async toggle(product: Pick<ProductCard, 'id' | 'name'> & Partial<ProductCard>): Promise<boolean> {
    const uid = useAuthStore.getState().session?.user.id;
    if (!uid) {
      const saved = useGuest.getState().toggleWishlist(product.id);
      haptic.light();
      if (saved) toast.success(`Saved ${product.name}`, { label: 'Wishlist', href: '/wishlist' });
      return saved;
    }
    const key = wishKey(uid);
    const before = queryClient.getQueryData<ProductCard[]>(key) ?? [];
    const has = before.some((p) => p.id === product.id);
    haptic.light();
    queryClient.setQueryData<ProductCard[]>(key, has ? before.filter((p) => p.id !== product.id) : [product as ProductCard, ...before]);
    try {
      if (has) await api.del(`/me/wishlist/${product.id}`);
      else await api.put(`/me/wishlist/${product.id}`);
      if (!has) toast.success(`Saved ${product.name}`, { label: 'Wishlist', href: '/wishlist' });
      void queryClient.invalidateQueries({ queryKey: key });
      return !has;
    } catch (e) {
      queryClient.setQueryData(key, before);
      toast.error(errorMessage(e));
      return has;
    }
  },

  async mergeGuest(uid: string) {
    const ids = useGuest.getState().wishlist;
    if (!ids.length) return;
    await Promise.allSettled(ids.map((id) => api.put(`/me/wishlist/${id}`)));
    useGuest.getState().clearWishlist();
    void queryClient.invalidateQueries({ queryKey: wishKey(uid) });
  },
};
