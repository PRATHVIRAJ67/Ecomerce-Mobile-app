import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '@/components/layout/TabBar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button, Display, EmptyState, ErrorState, Eyebrow, Txt } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { plural } from '@/lib/format';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const { isSignedIn } = useAuth();
  const w = useWishlist();
  const [refreshing, setRefreshing] = useState(false);

  const header = (
    <View style={{ paddingTop: insets.top + 12 }} className="px-5 pb-5">
      <Eyebrow>Saved for later</Eyebrow>
      <Display className="mt-1 text-[34px] leading-[40px]">Your wishlist</Display>
      {w.items && w.items.length > 0 ? <Txt className="mt-1 text-muted">{plural(w.items.length, 'item')}</Txt> : null}
      {!isSignedIn && w.items && w.items.length > 0 ? (
        <Txt className="mt-3 text-[13px] leading-[18px] text-ink-soft">
          Saved on this phone.{' '}
          <Txt weight="semibold" className="text-[13px] text-forest-700" onPress={() => router.push('/login')} accessibilityRole="link">
            Sign in
          </Txt>{' '}
          to keep it on every device.
        </Txt>
      ) : null}
    </View>
  );

  if (w.error && !w.items) {
    return (
      <View className="flex-1 bg-cream">
        {header}
        <ErrorState error={w.error} onRetry={() => void w.refetch()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <ProductGrid
        products={w.items}
        loading={w.isLoading}
        header={header}
        bottomInset={bottom + 8}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await w.refetch();
          setRefreshing(false);
        }}
        empty={<EmptyState icon={Heart} title="Nothing saved yet" message="Tap the heart on any product to keep it here for later." action={<Button title="Discover products" onPress={() => router.push('/explore')} />} />}
      />
    </View>
  );
}
