import { discountPercent, type ProductCard as Product } from '@ecommerce/shared';
import { router } from 'expo-router';
import { Check, MapPin, Plus } from 'lucide-react-native';
import { memo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { cart, useCartQuantity } from '@/hooks/useCart';
import { formatINR } from '@/lib/format';
import { C, shadow } from '@/lib/theme';
import { Badge, PressableScale, Txt } from '../ui';
import { ProductImage } from './ProductImage';
import { WishlistHeart } from './WishlistHeart';

interface Props {
  product: Product;
  width: number;
  priority?: 'normal' | 'high';
}

/** Editorial product card: 4:5 image, origin, name, price, discount, stock state, wishlist + quick add. */
export const ProductCard = memo(function ProductCard({ product, width, priority }: Props) {
  const inCart = useCartQuantity(product.id);
  const [adding, setAdding] = useState(false);
  const off = discountPercent(product.price, product.mrp);
  const maxed = inCart >= product.max_order_quantity;

  const quickAdd = async () => {
    setAdding(true);
    await cart.add(product, 1);
    setAdding(false);
  };

  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: product.slug } })}
      scaleTo={0.98}
      accessibilityLabel={`${product.name}, ${formatINR(product.price)}${off ? `, ${off}% off` : ''}${!product.in_stock ? ', out of stock' : product.low_stock ? ', only a few left' : ''}`}
      accessibilityHint="Opens product details"
      className="overflow-hidden rounded-[22px] border border-line/60 bg-white"
      style={[{ width }, shadow.card]}
    >
      <View style={{ width: '100%', aspectRatio: 4 / 5 }}>
        <ProductImage uri={product.images[0]?.url} seed={product.category_slug ?? product.slug} hints={[product.category_name, product.name]} style={{ flex: 1, opacity: product.in_stock ? 1 : 0.6 }} priority={priority} />
        <View className="absolute left-2.5 right-2.5 top-2.5 flex-row items-start justify-between">
          <View className="gap-1">
            {!product.in_stock ? <Badge tone="dark">Sold out</Badge> : off >= 5 ? <Badge tone="terracotta">{`${off}% off`}</Badge> : null}
            {product.in_stock && product.low_stock ? <Badge tone="warning">Few left</Badge> : null}
          </View>
          <WishlistHeart product={product} size={34} />
        </View>
      </View>

      <View className="px-3.5 pb-3.5 pt-3">
        {product.origin ? (
          <View className="mb-1 flex-row items-center gap-1">
            <MapPin size={11} color={C.muted} />
            <Txt className="flex-1 text-[11px] text-muted" numberOfLines={1}>
              {product.origin}
            </Txt>
          </View>
        ) : null}
        <Txt weight="semibold" className="text-[14.5px] leading-[19px]" numberOfLines={2} style={{ minHeight: 38 }}>
          {product.name}
        </Txt>
        {product.unit ? <Txt className="mt-0.5 text-[12px] text-muted">{product.unit}</Txt> : null}

        <View className="mt-2.5 flex-row items-end justify-between">
          <View className="flex-1 pr-2">
            <Txt weight="bold" className="text-[16px]">
              {formatINR(product.price)}
            </Txt>
            {off > 0 && product.mrp ? <Txt className="text-[11.5px] text-muted line-through">{formatINR(product.mrp)}</Txt> : null}
          </View>
          {product.in_stock ? (
            <PressableScale
              onPress={quickAdd}
              disabled={adding || maxed}
              scaleTo={0.9}
              accessibilityLabel={inCart ? `Add another ${product.name}, ${inCart} in cart` : `Add ${product.name} to cart`}
              className={`h-9 min-w-9 flex-row items-center justify-center gap-1 rounded-full px-2.5 ${inCart ? 'bg-forest-100' : 'bg-forest-700'} ${maxed ? 'opacity-50' : ''}`}
            >
              {adding ? (
                <ActivityIndicator size="small" color={inCart ? C.forest : C.cream} />
              ) : inCart ? (
                <>
                  <Check size={14} color={C.forest} strokeWidth={2.6} />
                  <Txt weight="bold" className="text-[13px] text-forest-800">
                    {inCart}
                  </Txt>
                </>
              ) : (
                <Plus size={17} color={C.cream} strokeWidth={2.4} />
              )}
            </PressableScale>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
});

export function ProductCardSkeleton({ width }: { width: number }) {
  return (
    <View style={{ width }} className="overflow-hidden rounded-[22px] border border-line/60 bg-white">
      <View style={{ width: '100%', aspectRatio: 4 / 5 }} className="bg-cream-dark" />
      <View className="gap-2 p-3.5">
        <View className="h-2.5 w-1/2 rounded bg-cream-dark" />
        <View className="h-4 w-4/5 rounded bg-cream-dark" />
        <View className="h-4 w-1/3 rounded bg-cream-dark" />
      </View>
    </View>
  );
}
