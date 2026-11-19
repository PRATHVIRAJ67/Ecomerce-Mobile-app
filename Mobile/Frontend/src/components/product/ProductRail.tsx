import type { ProductCard as Product } from '@ecommerce/shared';
import { FlatList, View } from 'react-native';
import { SectionHeader, Skeleton } from '../ui';
import { ProductCard } from './ProductCard';

const CARD = 172;

/** Horizontal product carousel with snap. Hidden when empty (never shows fake items). */
export function ProductRail({ eyebrow, title, products, loading, onViewAll }: { eyebrow?: string; title: string; products?: Product[]; loading?: boolean; onViewAll?: () => void }) {
  if (!loading && (!products || products.length === 0)) return null;
  return (
    <View accessibilityLabel={title}>
      <SectionHeader eyebrow={eyebrow} title={title} action={onViewAll ? 'See all' : undefined} onAction={onViewAll} />
      {loading || !products ? (
        <View className="flex-row gap-3 px-5">
          {[0, 1].map((i) => (
            <Skeleton key={i} style={{ width: CARD, height: CARD * 1.25 + 110, borderRadius: 22 }} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProductCard product={item} width={CARD} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14, gap: 12 }}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD + 12}
          decelerationRate="fast"
          initialNumToRender={3}
          windowSize={5}
        />
      )}
    </View>
  );
}
