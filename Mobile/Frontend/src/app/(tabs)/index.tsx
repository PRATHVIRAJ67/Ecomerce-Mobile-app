import { router } from 'expo-router';
import { Bell, Search } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeliveryLocation } from '@/components/DeliveryLocation';
import { CategoryGrid, CollectionCards } from '@/components/home/Categories';
import { HeroCarousel, StripBanners } from '@/components/home/HeroCarousel';
import { StoryCard } from '@/components/home/StoryCard';
import { useTabBarSpace } from '@/components/layout/TabBar';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductRail } from '@/components/product/ProductRail';
import { ErrorState, IconButton, PressableScale, SectionHeader, Txt } from '@/components/ui';
import { TrustStrip } from '@/components/TrustStrip';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useOrderUpdates } from '@/hooks/useNotifications';
import { useWishlist } from '@/hooks/useWishlist';
import { greeting } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useHome, useProducts } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { C } from '@/lib/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const { unread } = useOrderUpdates();
  const home = useHome();
  const [refreshing, setRefreshing] = useState(false);
  const data = home.data;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptic.light();
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['catalog'] }), queryClient.invalidateQueries({ queryKey: ['me'] })]);
    setRefreshing(false);
  }, []);

  const firstName = profile?.full_name?.split(' ')[0];
  const hero = (data?.banners ?? []).filter((b) => b.placement === 'home_hero');
  const strip = (data?.banners ?? []).filter((b) => b.placement === 'home_strip');
  const cardW = (width - 40 - 12) / 2;

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottom + 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.forest} colors={[C.forest]} />}
        stickyHeaderIndices={[1]}
      >
        {/* Header */}
        <View className="px-5 pb-3 pt-2.5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Txt className="text-[13px] text-muted">{greeting()}{firstName ? ',' : ''}</Txt>
              <Txt className="font-display text-[28px] leading-[34px] text-ink" numberOfLines={1}>
                {firstName ?? 'Namaste'}
              </Txt>
              <View className="mt-2">
                <DeliveryLocation />
              </View>
            </View>
            <IconButton icon={Bell} label="Notifications" tone="white" badge={unread} onPress={() => router.push('/notifications')} />
          </View>
        </View>

        {/* Sticky search */}
        <View className="bg-cream px-5 pb-3 pt-1">
          <PressableScale onPress={() => router.push('/search')} scaleTo={0.985} hapticOnPress accessibilityRole="search" accessibilityLabel="Search products" className="h-[52px] flex-row items-center gap-3 rounded-2xl border border-line bg-white px-4">
            <Search size={19} color={C.muted} />
            <Txt className="flex-1 text-[15px] text-muted">Search mangoes, spices, sarees…</Txt>
          </PressableScale>
        </View>

        {home.error && !data ? (
          <ErrorState error={home.error} onRetry={() => void home.refetch()} title="We couldn't load the store" />
        ) : (
          <View className="gap-11 pt-2">
            <HeroCarousel banners={hero} loading={home.isPending} tagline={data?.settings.store_tagline} />
            <CategoryGrid categories={data?.categories ?? []} loading={home.isPending} />
            <ProductRail eyebrow="Popular right now" title="Trending" products={data?.trending} loading={home.isPending} onViewAll={() => router.push({ pathname: '/products', params: { sort: 'popular', title: 'Trending' } })} />
            <ProductRail eyebrow="Customer favourites" title="Best sellers" products={data?.best_sellers} loading={home.isPending} onViewAll={() => router.push({ pathname: '/products', params: { sort: 'popular', title: 'Best sellers' } })} />
            {data ? <CollectionCards categories={data.categories} /> : null}
            <StoryCard />
            {data && data.featured.length > 0 ? (
              <View>
                <SectionHeader eyebrow="Handpicked" title="Featured this season" action="See all" onAction={() => router.push({ pathname: '/products', params: { featured: 'true', title: 'Featured' } })} />
                <View className="flex-row flex-wrap gap-3 px-5">
                  {data.featured.slice(0, 6).map((p) => (
                    <ProductCard key={p.id} product={p} width={cardW} />
                  ))}
                </View>
              </View>
            ) : null}
            <StripBanners banners={strip} />
            <ProductRail eyebrow="Just landed" title="New arrivals" products={data?.new_arrivals} loading={home.isPending} onViewAll={() => router.push({ pathname: '/products', params: { sort: 'newest', title: 'New arrivals' } })} />
            <Recommended />
            <TrustStrip settings={data?.settings} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/** "Recommended for you": products from the categories in the customer's cart and wishlist. */
function Recommended() {
  const { summary } = useCart();
  const { items: saved } = useWishlist();
  const seed = useMemo(() => {
    const pool = [...(summary?.lines.map((l) => l.product) ?? []), ...(saved ?? [])];
    const counts = new Map<string, number>();
    for (const p of pool) if (p.category_slug) counts.set(p.category_slug, (counts.get(p.category_slug) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return { category: top, exclude: new Set(pool.map((p) => p.id)) };
  }, [summary, saved]);
  const q = useProducts({ category: seed.category, sort: 'popular' }, 12, Boolean(seed.category));
  const items = q.data?.items.filter((p) => !seed.exclude.has(p.id) && p.in_stock);
  if (!seed.category || !items?.length) return null;
  return <ProductRail eyebrow="Picked for you" title="Recommended" products={items} />;
}
