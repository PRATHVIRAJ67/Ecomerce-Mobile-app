import { router } from 'expo-router';
import { ArrowUpRight, ChevronLeft, Clock, Search, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, TextInput, View } from 'react-native';
import { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductImage } from '@/components/product/ProductImage';
import { IconButton, Txt } from '@/components/ui';
import { AView } from '@/components/ui/animated';
import { formatINR } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useCategories, useProducts } from '@/lib/queries';
import { C } from '@/lib/theme';
import { usePrefs } from '@/store';

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const term = useDebounced(text.trim());
  const enabled = term.length >= 2;
  const { data, isFetching } = useProducts({ q: term }, 8, enabled);
  const categories = useCategories();
  const recent = usePrefs((s) => s.recentSearches);
  const addRecent = usePrefs((s) => s.addRecentSearch);
  const clearRecent = usePrefs((s) => s.clearRecentSearches);
  const results = enabled ? (data?.items ?? []) : [];

  const submit = (q: string) => {
    const t = q.trim();
    if (!t) return;
    haptic.tap();
    addRecent(t);
    Keyboard.dismiss();
    router.push({ pathname: '/products', params: { q: t, title: `“${t}”` } });
  };

  return (
    <View className="flex-1 bg-cream" style={{ paddingTop: insets.top + 6 }}>
      <View className="flex-row items-center gap-2 px-3 pb-3">
        <IconButton icon={ChevronLeft} label="Close search" onPress={() => router.back()} />
        <View className="h-[50px] flex-1 flex-row items-center gap-2.5 rounded-2xl border border-forest-600 bg-white px-4">
          <Search size={18} color={C.muted} />
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            placeholder="Search products, origins, tags"
            placeholderTextColor={C.muted}
            returnKeyType="search"
            onSubmitEditing={() => submit(text)}
            autoCorrect={false}
            autoCapitalize="none"
            maxLength={100}
            accessibilityLabel="Search products"
            selectionColor={C.terracotta}
            className="flex-1 font-sans text-[15.5px] text-ink"
          />
          {isFetching && enabled ? (
            <ActivityIndicator size="small" color={C.muted} />
          ) : text ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setText('')} hitSlop={10}>
              <X size={17} color={C.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!enabled ? (
        <AView entering={FadeIn.duration(200)} className="px-5 pt-3">
          {recent.length > 0 && (
            <View className="mb-7">
              <View className="mb-3 flex-row items-center justify-between">
                <Txt weight="semibold" className="text-[12px] uppercase tracking-[1.8px] text-muted">
                  Recent searches
                </Txt>
                <Pressable accessibilityRole="button" onPress={clearRecent} hitSlop={8}>
                  <Txt weight="medium" className="text-[12.5px] text-terracotta-600">
                    Clear
                  </Txt>
                </Pressable>
              </View>
              {recent.map((r) => (
                <Pressable key={r} accessibilityRole="button" accessibilityLabel={`Search ${r}`} onPress={() => submit(r)} className="flex-row items-center gap-3 py-2.5">
                  <Clock size={16} color={C.muted} />
                  <Txt className="flex-1 text-[15px]">{r}</Txt>
                  <ArrowUpRight size={16} color={C.muted} />
                </Pressable>
              ))}
            </View>
          )}
          <Txt weight="semibold" className="mb-3 text-[12px] uppercase tracking-[1.8px] text-muted">
            Browse categories
          </Txt>
          <View className="flex-row flex-wrap gap-2">
            {(categories.data ?? [])
              .filter((c) => !c.parent_id)
              .map((c) => (
                <Pressable key={c.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: c.slug } })} className="rounded-full border border-line bg-white px-4 py-2.5">
                  <Txt weight="medium" className="text-[13.5px]">
                    {c.name}
                  </Txt>
                </Pressable>
              ))}
          </View>
        </AView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={
            !isFetching && data ? (
              <View className="items-center py-14">
                <Txt className="font-display text-[22px] text-ink">No matches</Txt>
                <Txt className="mt-2 text-center text-ink-soft">Nothing found for “{term}”. Try a simpler word.</Txt>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${formatINR(item.price)}${item.in_stock ? '' : ', out of stock'}`}
              onPress={() => {
                addRecent(term);
                router.push({ pathname: '/product/[slug]', params: { slug: item.slug } });
              }}
              className="flex-row items-center gap-3.5 border-b border-line/70 py-3"
            >
              <ProductImage uri={item.images[0]?.url} seed={item.category_slug ?? item.slug} hints={[item.category_name, item.name]} style={{ width: 56, height: 56, borderRadius: 14 }} />
              <View className="flex-1">
                <Txt weight="semibold" className="text-[14.5px]" numberOfLines={1}>
                  {item.name}
                </Txt>
                <Txt className="text-[12.5px] text-muted" numberOfLines={1}>
                  {[item.category_name, item.unit].filter(Boolean).join(' · ')}
                  {!item.in_stock ? ' · Sold out' : ''}
                </Txt>
              </View>
              <Txt weight="bold" className="text-[14.5px]">
                {formatINR(item.price)}
              </Txt>
            </Pressable>
          )}
          ListFooterComponent={
            results.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => submit(term)} className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-forest-700 py-3.5">
                <Txt weight="semibold" className="text-cream">
                  See all results for “{term}”
                </Txt>
                <ArrowUpRight size={16} color={C.cream} />
              </Pressable>
            ) : undefined
          }
        />
      )}
    </View>
  );
}
