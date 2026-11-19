import { useEffect, useRef } from 'react';
import { cart } from '@/hooks/useCart';
import { useAuthListener } from '@/hooks/useAuth';
import { wishlist } from '@/hooks/useWishlist';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store';

/** Session listener + one-time merge of the guest cart & wishlist into the account after sign-in. */
export function AppBootstrap() {
  useAuthListener();
  const uid = useAuthStore((s) => s.session?.user.id);
  const lastUid = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (uid && uid !== lastUid.current) {
      void cart.mergeGuest(uid);
      void wishlist.mergeGuest(uid);
    }
    if (!uid && lastUid.current) {
      // Signed out: drop every per-user cache so the next account starts clean.
      queryClient.removeQueries({ queryKey: ['me'] });
    }
    lastUid.current = uid;
  }, [uid]);

  return null;
}
