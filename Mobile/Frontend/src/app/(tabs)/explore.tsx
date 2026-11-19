import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, Search, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '@/components/layout/TabBar';
import { ImageFallback } from '@/components/product/ProductImage';
import { Display, ErrorState, Eyebrow, PressableScale, Skeleton, Txt } from '@/components/ui';
import { plural } from '@/lib/format';
import { useCategories } from '@/lib/queries';
import { C } from '@/lib/theme';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const q = useCategories();
  const [refreshing, setRefreshing] = useState(false);
  const all = q.data ?? [];
  const top = all.filter((c) => !c.parent_id);

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom + 8 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={C.forest}
          onRefresh={async () => {
            setRefreshing(true);
            await q.refetch();
            setRefreshing(false);
          }}
        />
      }
    >
      <View className="px-5">
        <Eyebrow>Explore</Eyebrow>
        <Display className="mt-1 text-[34px] leading-[40px]">Everything from home</Display>
        <PressableScale onPress={() => router.push('/search')} hapticOnPress accessibilityRole="search" accessibilityLabel="Search products" className="mt-5 h-[52px] flex-row items-center gap-3 rounded-2xl border border-line bg-white px-4">
          <Search size={19} color={C.muted} />
          <Txt className="text-[15px] text-muted">Search the whole store</Txt>
        </PressableScale>

        <PressableScale onPress={() => router.push({ pathname: '/products', params: { title: 'All products' } })} className="mt-4 flex-row items-center gap-4 rounded-3xl bg-forest-700 p-5" accessibilityLabel="Browse all products">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-forest-600">
            <Sparkles size={22} color={C.terracotta200} />
          </View>
          <View className="flex-1">
            <Txt weight="semibold" className="text-[16px] text-cream">
              Browse all products
            </Txt>
            <Txt className="mt-0.5 text-[12.5px] text-cream/70">Filter by price, availability and more</Txt>
          </View>
          <ChevronRight size={20} color={C.cream} />
        </PressableScale>
      </View>

      <View className="mt-8 gap-3 px-5">
        {q.error && !q.data ? (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        ) : q.isPending ? (
          Array.from({ length: 6 }, (_, i) => <Skeleton key={i} style={{ height: 112, borderRadius: 26 }} />)
        ) : (
          top.map((c) => {
            const children = all.filter((x) => x.parent_id === c.id);
            return (
              <PressableScale
                key={c.id}
                onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: c.slug } })}
                scaleTo={0.985}
                accessibilityLabel={`${c.name}${typeof c.product_count === 'number' ? `, ${plural(c.product_count, 'product')}` : ''}`}
                className="flex-row items-center gap-4 overflow-hidden rounded-[26px] border border-line/70 bg-white p-3"
              >
                <View className="h-[88px] w-[88px] overflow-hidden rounded-[20px]">
                  {c.image_url ? <Image source={{ uri: c.image_url }} style={{ flex: 1 }} contentFit="cover" cachePolicy="memory-disk" /> : <ImageFallback seed={c.slug} hints={[c.name, c.slug]} style={{ width: 88, height: 88 }} />}
                </View>
                <View className="flex-1">
                  <Txt className="font-display text-[19px] leading-[23px] text-ink">{c.name}</Txt>
                  {c.description ? (
                    <Txt className="mt-1 text-[12.5px] leading-[17px] text-ink-soft" numberOfLines={2}>
                      {c.description}
                    </Txt>
                  ) : null}
                  <Txt weight="semibold" className="mt-1.5 text-[11.5px] text-terracotta-600">
                    {plural(c.product_count ?? 0, 'product')}
                    {children.length ? ` · ${plural(children.length, 'collection')}` : ''}
                  </Txt>
                </View>
                <ChevronRight size={18} color={C.muted} />
              </PressableScale>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
