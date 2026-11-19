import type { Category } from '@ecommerce/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { plural } from '@/lib/format';
import { C } from '@/lib/theme';
import { ImageFallback } from '../product/ProductImage';
import { Display, PressableScale, SectionHeader, Skeleton, Txt } from '../ui';

const open = (slug: string) => router.push({ pathname: '/category/[slug]', params: { slug } });

/** 4-column visual category grid (top-level categories from the API). */
export function CategoryGrid({ categories, loading, limit = 8 }: { categories: Category[]; loading?: boolean; limit?: number }) {
  const { width } = useWindowDimensions();
  const tile = (width - 40 - 3 * 12) / 4;
  const top = categories.filter((c) => !c.parent_id).slice(0, limit);
  if (!loading && !top.length) return null;
  return (
    <View>
      <SectionHeader eyebrow="Explore" title="Shop by category" action="All" onAction={() => router.push('/explore')} />
      <View className="flex-row flex-wrap gap-3 px-5">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} style={{ width: tile, height: tile + 34, borderRadius: 22 }} />)
          : top.map((c) => (
              <PressableScale key={c.id} onPress={() => open(c.slug)} style={{ width: tile }} accessibilityLabel={`${c.name}${typeof c.product_count === 'number' ? `, ${plural(c.product_count, 'product')}` : ''}`}>
                <View style={{ width: tile, height: tile }} className="overflow-hidden rounded-[22px] border border-line/60">
                  {c.image_url ? (
                    <Image source={{ uri: c.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                  ) : (
                    <ImageFallback seed={c.slug} hints={[c.name, c.slug]} style={{ flex: 1 }} iconScale={0.2} />
                  )}
                </View>
                <Txt weight="semibold" className="mt-2 text-center text-[11.5px] leading-[14px]" numberOfLines={2}>
                  {c.name}
                </Txt>
              </PressableScale>
            ))}
      </View>
    </View>
  );
}

/** Large editorial cards for the biggest categories ("Featured collections"). */
export function CollectionCards({ categories }: { categories: Category[] }) {
  const { width } = useWindowDimensions();
  const cardW = width * 0.72;
  const picks = categories
    .filter((c) => !c.parent_id && (c.product_count ?? 0) > 0)
    .sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0))
    .slice(0, 5);
  if (!picks.length) return null;
  return (
    <View>
      <SectionHeader eyebrow="Collections" title="Featured collections" />
      <FlatList
        horizontal
        data={picks}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item }) => (
          <PressableScale onPress={() => open(item.slug)} style={{ width: cardW, height: cardW * 1.05 }} className="overflow-hidden rounded-[28px]" accessibilityLabel={`${item.name} collection`}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <ImageFallback seed={`${item.slug}-collection`} hints={[item.name]} style={{ position: 'absolute', inset: 0 }} iconScale={0.16} />
            )}
            <LinearGradient colors={['transparent', 'rgba(10,42,29,0.15)', 'rgba(10,42,29,0.88)']} style={{ position: 'absolute', inset: 0 }} />
            <View className="flex-1 justify-end p-5">
              <Txt weight="semibold" className="text-[11px] uppercase tracking-[2px] text-terracotta-200">
                {plural(item.product_count ?? 0, 'product')}
              </Txt>
              <Display className="mt-1 text-[26px] leading-[30px] text-cream">{item.name}</Display>
              {item.description ? (
                <Txt className="mt-1 text-[13px] leading-[18px] text-cream/80" numberOfLines={2}>
                  {item.description}
                </Txt>
              ) : null}
            </View>
            <View className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white/90">
              <ArrowUpRight size={18} color={C.forestDeep} />
            </View>
          </PressableScale>
        )}
      />
    </View>
  );
}
