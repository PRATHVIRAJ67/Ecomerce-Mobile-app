import type { ProductCard as Product } from '@ecommerce/shared';
import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, useWindowDimensions, View } from 'react-native';
import { C } from '@/lib/theme';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

interface Props {
  products?: Product[];
  loading?: boolean;
  header?: ReactElement | null;
  empty?: ReactElement | null;
  onEndReached?: () => void;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  bottomInset?: number;
}

/** Virtualised 2-column product grid with infinite scroll + pull-to-refresh. */
export function ProductGrid({ products, loading, header, empty, onEndReached, loadingMore, refreshing = false, onRefresh, bottomInset = 24 }: Props) {
  const { width } = useWindowDimensions();
  const cardW = (width - 40 - 12) / 2;
  const data: (Product | null)[] = loading || !products ? Array.from({ length: 6 }, () => null) : products;
  return (
    <FlatList
      data={data}
      numColumns={2}
      keyExtractor={(p, i) => (p ? p.id : `s-${i}`)}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
      contentContainerStyle={{ gap: 12, paddingBottom: bottomInset }}
      renderItem={({ item, index }) => (item ? <ProductCard product={item} width={cardW} priority={index < 4 ? 'high' : 'normal'} /> : <ProductCardSkeleton width={cardW} />)}
      ListHeaderComponent={header ?? undefined}
      ListEmptyComponent={!loading ? (empty ?? undefined) : undefined}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={C.forest} style={{ marginVertical: 20 }} /> : <View />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.forest} colors={[C.forest]} /> : undefined}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
      maxToRenderPerBatch={8}
      windowSize={9}
      removeClippedSubviews
      keyboardDismissMode="on-drag"
    />
  );
}
