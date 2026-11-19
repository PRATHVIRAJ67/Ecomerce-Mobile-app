import { router } from 'expo-router';
import { Check, PackageSearch, Search, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { plural } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useCategories, useProductList, type ProductFilters, type SortKey } from '@/lib/queries';
import { C } from '@/lib/theme';
import { ProductGrid } from './product/ProductGrid';
import { Button, Display, EmptyState, ErrorState, IconButton, ScreenHeader, Txt } from './ui';
import { Sheet } from './ui/Sheet';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'popular', label: 'Best selling' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A–Z' },
];
const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: 'Under ₹250', max: 250 },
  { label: '₹250 – 500', min: 250, max: 500 },
  { label: '₹500 – 1,000', min: 500, max: 1000 },
  { label: 'Over ₹1,000', min: 1000 },
];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      className={`rounded-full border px-4 py-2.5 ${active ? 'border-forest-700 bg-forest-700' : 'border-line bg-white'}`}
    >
      <Txt weight="medium" className={`text-[13.5px] ${active ? 'text-cream' : 'text-ink'}`}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Product listing used by /products (all, search, featured…) and /category/[slug]. */
export function ProductListing({ initial, title, description, categorySlug }: { initial: ProductFilters; title: string; description?: string | null; categorySlug?: string }) {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<ProductFilters>(initial);
  const [draft, setDraft] = useState<ProductFilters>(initial);
  const [open, setOpen] = useState(false);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const categories = useCategories();
  const q = useProductList(filters);
  const products = useMemo(() => q.data?.pages.flatMap((p) => p.items), [q.data]);
  const total = q.data?.pages[0]?.total;
  const children = (categories.data ?? []).filter((c) => categorySlug && c.parent_id && categories.data?.find((p) => p.id === c.parent_id)?.slug === categorySlug);

  const activeCount = [filters.sort && filters.sort !== 'relevance', filters.min_price != null || filters.max_price != null, filters.in_stock, filters.featured && !initial.featured].filter(Boolean).length;

  const openFilters = () => {
    setDraft(filters);
    setMinText(filters.min_price?.toString() ?? '');
    setMaxText(filters.max_price?.toString() ?? '');
    setPriceError(null);
    setOpen(true);
  };

  const apply = () => {
    const min = minText.trim() ? Number(minText) : undefined;
    const max = maxText.trim() ? Number(maxText) : undefined;
    if ((min != null && (!Number.isFinite(min) || min < 0)) || (max != null && (!Number.isFinite(max) || max < 0))) return setPriceError('Enter a valid amount');
    if (min != null && max != null && min > max) return setPriceError('Minimum must be less than maximum');
    haptic.success();
    setFilters({ ...draft, min_price: min, max_price: max });
    setOpen(false);
  };

  const header = (
    <View className="px-5 pb-4">
      <Display className="text-[32px] leading-[38px]">{title}</Display>
      {description ? <Txt className="mt-1.5 text-[14px] leading-[20px] text-ink-soft">{description}</Txt> : null}
      {children.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 mt-4" contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {children.map((c) => (
            <Chip key={c.id} label={c.name} active={false} onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: c.slug } })} />
          ))}
        </ScrollView>
      )}
      <View className="mt-4 flex-row items-center justify-between">
        <Txt className="text-[13px] text-muted" accessibilityLiveRegion="polite">
          {total != null ? plural(total, 'product') : 'Loading…'}
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel={`Sort and filter${activeCount ? `, ${activeCount} active` : ''}`} onPress={openFilters} className={`flex-row items-center gap-2 rounded-full border px-4 py-2 ${activeCount ? 'border-forest-700 bg-forest-50' : 'border-line bg-white'}`}>
          <SlidersHorizontal size={15} color={C.forestDeep} />
          <Txt weight="semibold" className="text-[13px] text-forest-800">
            Sort & filter{activeCount ? ` · ${activeCount}` : ''}
          </Txt>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader right={<IconButton icon={Search} label="Search" onPress={() => router.push('/search')} />} />
      {q.error && !products ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <ProductGrid
          products={products}
          loading={q.isPending}
          header={header}
          bottomInset={insets.bottom + 24}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
          loadingMore={q.isFetchingNextPage}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await q.refetch();
            setRefreshing(false);
          }}
          empty={
            <EmptyState
              icon={PackageSearch}
              title={filters.q ? 'No matches found' : 'Nothing here yet'}
              message={filters.q ? `We couldn't find products for “${filters.q}”. Try a simpler word.` : 'No products match these filters right now.'}
              action={activeCount ? <Button title="Clear filters" onPress={() => setFilters(initial)} /> : <Button title="Browse everything" variant="outline" onPress={() => router.push('/explore')} />}
            />
          }
        />
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Sort & filter"
        footer={
          <View className="flex-row gap-3">
            <Button
              title="Reset"
              variant="outline"
              className="flex-1"
              onPress={() => {
                setDraft(initial);
                setMinText('');
                setMaxText('');
                setPriceError(null);
              }}
            />
            <Button title="Show results" className="flex-[2]" onPress={apply} />
          </View>
        }
      >
        <Txt weight="semibold" className="mb-3 mt-2 text-[12px] uppercase tracking-[1.8px] text-muted">
          Sort by
        </Txt>
        <View accessibilityRole="radiogroup" className="overflow-hidden rounded-2xl border border-line bg-white">
          {SORTS.map((s, i) => {
            const active = (draft.sort ?? 'relevance') === s.value;
            return (
              <Pressable key={s.value} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => setDraft({ ...draft, sort: s.value })} className={`flex-row items-center justify-between px-4 py-3.5 ${i ? 'border-t border-line/70' : ''}`}>
                <Txt weight={active ? 'semibold' : 'regular'} className="text-[15px]">
                  {s.label}
                </Txt>
                {active ? <Check size={18} color={C.forest} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Txt weight="semibold" className="mb-3 mt-6 text-[12px] uppercase tracking-[1.8px] text-muted">
          Price (₹)
        </Txt>
        <View className="flex-row flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => (
            <Chip
              key={p.label}
              label={p.label}
              active={minText === (p.min?.toString() ?? '') && maxText === (p.max?.toString() ?? '')}
              onPress={() => {
                setMinText(p.min?.toString() ?? '');
                setMaxText(p.max?.toString() ?? '');
              }}
            />
          ))}
        </View>
        <View className="mt-3 flex-row items-center gap-3">
          <TextInput value={minText} onChangeText={(t) => setMinText(t.replace(/[^\d]/g, ''))} placeholder="Min" keyboardType="number-pad" accessibilityLabel="Minimum price" placeholderTextColor={C.muted} className="h-12 flex-1 rounded-2xl border border-line bg-white px-4 font-sans text-[15px] text-ink" />
          <Txt className="text-muted">–</Txt>
          <TextInput value={maxText} onChangeText={(t) => setMaxText(t.replace(/[^\d]/g, ''))} placeholder="Max" keyboardType="number-pad" accessibilityLabel="Maximum price" placeholderTextColor={C.muted} className="h-12 flex-1 rounded-2xl border border-line bg-white px-4 font-sans text-[15px] text-ink" />
        </View>
        {priceError ? <Txt className="mt-2 text-[12.5px] text-danger">{priceError}</Txt> : null}

        <Txt weight="semibold" className="mb-3 mt-6 text-[12px] uppercase tracking-[1.8px] text-muted">
          Availability
        </Txt>
        <View className="flex-row flex-wrap gap-2">
          <Chip label="In stock only" active={Boolean(draft.in_stock)} onPress={() => setDraft({ ...draft, in_stock: !draft.in_stock })} />
          <Chip label="Featured" active={Boolean(draft.featured)} onPress={() => setDraft({ ...draft, featured: !draft.featured })} />
        </View>
      </Sheet>
    </View>
  );
}
