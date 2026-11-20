import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CircleCheck, HandCoins, MapPin, PackageX, Share2, ShieldCheck, ShoppingBag, Truck, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Share, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeliveryAddress } from '@/components/DeliveryLocation';
import { Price } from '@/components/product/Price';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductRail } from '@/components/product/ProductRail';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { WishlistHeart } from '@/components/product/WishlistHeart';
import { ZoomViewer } from '@/components/product/ZoomViewer';
import { Badge, Button, Display, EmptyState, ErrorState, Eyebrow, IconButton, ScreenHeader, Skeleton, Txt } from '@/components/ui';
import { AView } from '@/components/ui/animated';
import { cart, useCartQuantity } from '@/hooks/useCart';
import { isNotFound } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { useProduct, useSettings } from '@/lib/queries';
import { C } from '@/lib/theme';

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data: product, isPending, error, refetch } = useProduct(slug);
  const { data: settings } = useSettings();
  const { address } = useDeliveryAddress();
  const inCart = useCartQuantity(product?.id ?? '');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<'add' | 'buy' | null>(null);
  const [page, setPage] = useState(0);
  const [viewer, setViewer] = useState(false);
  const galleryH = width * 1.12;

  if (isPending) {
    return (
      <View className="flex-1 bg-cream">
        <Skeleton style={{ height: galleryH, borderRadius: 0 }} />
        <View className="gap-3 p-5">
          <Skeleton style={{ height: 14, width: 110 }} />
          <Skeleton style={{ height: 34, width: '80%' }} />
          <Skeleton style={{ height: 120 }} />
        </View>
      </View>
    );
  }
  if (isNotFound(error)) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader />
        <EmptyState icon={PackageX} title="This product isn't available" message="It may have been removed or the link is incorrect." action={<Button title="Browse the store" onPress={() => router.replace('/explore')} />} />
      </View>
    );
  }
  if (error || !product) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </View>
    );
  }

  const remaining = Math.max(0, product.max_order_quantity - inCart);
  const canBuy = product.in_stock && remaining > 0;
  const threshold = settings?.free_shipping_threshold;
  const images = product.images;

  const add = async (then?: 'buy') => {
    setBusy(then ?? 'add');
    const ok = await cart.add(product, Math.min(qty, remaining));
    setBusy(null);
    if (ok) setQty(1);
    if (ok && then === 'buy') router.push('/cart');
  };

  const share = () => void Share.share({ message: `${product.name} on URU — ${formatINR(product.price)}`, title: product.name }).catch(() => undefined);
  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View className="flex-1 bg-cream">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        {/* Gallery */}
        <View style={{ height: galleryH }}>
          {images.length ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(i) => i.id}
              onMomentumScrollEnd={onGalleryScroll}
              renderItem={({ item, index }) => (
                <Pressable accessibilityRole="imagebutton" accessibilityLabel={`${product.name}, photo ${index + 1} of ${images.length}. Double tap to zoom`} onPress={() => setViewer(true)}>
                  <ProductImage uri={item.url} seed={product.slug} hints={[product.category_name, product.name]} style={{ width, height: galleryH }} priority={index === 0 ? 'high' : 'normal'} />
                </Pressable>
              )}
            />
          ) : (
            <ProductImage seed={product.category_slug ?? product.slug} hints={[product.category_name, product.name]} style={{ width, height: galleryH }} />
          )}
          {images.length > 1 && (
            <View className="absolute bottom-10 left-0 right-0 flex-row justify-center gap-1.5">
              {images.map((img, i) => (
                <View key={img.id} className={`h-1.5 rounded-full ${i === page ? 'w-6 bg-white' : 'w-1.5 bg-white/55'}`} />
              ))}
            </View>
          )}
          <View style={{ top: insets.top + 6 }} className="absolute left-3 right-3 flex-row items-center justify-between">
            <IconButton icon={ChevronLeft} label="Go back" tone="glass" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <View className="flex-row gap-2">
              <IconButton icon={Share2} label="Share" tone="glass" onPress={share} />
              <WishlistHeart product={product} size={44} />
            </View>
          </View>
        </View>

        {/* Details sheet */}
        <AView entering={FadeInDown.duration(380)} style={{ marginTop: -28, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: C.cream, paddingHorizontal: 20, paddingTop: 24 }}>
          {product.category_name ? (
            <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: product.category_slug! } })}>
              <Eyebrow>{product.category_name}</Eyebrow>
            </Pressable>
          ) : null}
          <Display className="mt-2 text-[30px] leading-[35px]">{product.name}</Display>
          <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {product.unit ? <Txt className="text-[13.5px] text-muted">{product.unit}</Txt> : null}
            {product.origin ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color={C.muted} />
                <Txt className="text-[13.5px] text-muted">{product.origin}</Txt>
              </View>
            ) : null}
          </View>
          {product.short_description ? <Txt className="mt-4 text-[16px] leading-[24px] text-ink-soft">{product.short_description}</Txt> : null}

          <View className="mt-5 rounded-3xl border border-line/70 bg-white p-5">
            <Price price={product.price} mrp={product.mrp} size="lg" />
            <Txt className="mt-0.5 text-[12px] text-muted">Inclusive of all taxes</Txt>
            <View className="mt-4 flex-row items-center gap-2" accessibilityLiveRegion="polite">
              {!product.in_stock ? (
                <>
                  <PackageX size={18} color={C.danger} />
                  <Txt weight="semibold" className="text-danger">
                    Currently out of stock
                  </Txt>
                </>
              ) : product.low_stock ? (
                <>
                  <Zap size={18} color={C.warning} />
                  <Txt weight="semibold" className="text-warning">
                    Only a few left — order soon
                  </Txt>
                </>
              ) : (
                <>
                  <CircleCheck size={18} color={C.success} />
                  <Txt weight="semibold" className="text-success">
                    In stock
                  </Txt>
                </>
              )}
            </View>
            {product.in_stock ? (
              <View className="mt-4 flex-row items-center gap-3">
                <QuantityStepper value={Math.min(qty, Math.max(1, remaining))} max={Math.max(1, remaining)} onChange={setQty} label="Quantity" />
                <Txt className="flex-1 text-[12.5px] leading-[17px] text-muted">
                  {inCart > 0 ? `${inCart} in your cart${remaining === 0 ? ' · limit reached' : ''}` : product.max_order_quantity < (settings?.max_quantity_per_item ?? 99) ? `Up to ${product.max_order_quantity} per order` : ''}
                </Txt>
              </View>
            ) : null}
          </View>

          {/* Delivery */}
          <View className="mt-4 gap-3 rounded-3xl bg-forest-50 p-5">
            <InfoRow icon={MapPin} text={address ? `Delivering to ${address.city} – ${address.pincode}` : 'Add an address at checkout to see delivery details'} />
            <InfoRow icon={Truck} text={threshold ? (product.price >= threshold ? 'Free delivery on this item' : `Free delivery on orders over ${formatINR(threshold)}`) : 'Home delivery'} />
            {settings?.cod_enabled !== false ? <InfoRow icon={HandCoins} text="Cash on Delivery available" /> : null}
            <InfoRow icon={ShieldCheck} text="Secure checkout — price and stock verified by our server" />
          </View>

          {/* About */}
          <View className="mt-7">
            <Display className="text-[22px]">About this product</Display>
            <Txt className="mt-2 text-[15px] leading-[24px] text-ink-soft">{product.description ?? product.short_description ?? 'More details coming soon.'}</Txt>
            <View className="mt-5 overflow-hidden rounded-2xl border border-line/70 bg-white">
              {[
                ['Origin', product.origin],
                ['Pack size', product.unit],
                ['SKU', product.sku],
              ]
                .filter(([, v]) => v)
                .map(([k, v], i) => (
                  <View key={k} className={`flex-row justify-between px-4 py-3 ${i ? 'border-t border-line/70' : ''}`}>
                    <Txt className="text-[13.5px] text-muted">{k}</Txt>
                    <Txt weight="medium" className="text-[13.5px]">
                      {v}
                    </Txt>
                  </View>
                ))}
            </View>
            {product.tags.length > 0 ? (
              <View className="mt-4 flex-row flex-wrap gap-2">
                {product.tags.map((t) => (
                  <Pressable key={t} accessibilityRole="button" onPress={() => router.push({ pathname: '/products', params: { q: t, title: `#${t}` } })}>
                    <Badge>{`#${t}`}</Badge>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </AView>

        {product.related.length > 0 ? (
          <View className="mt-10">
            <ProductRail eyebrow="More to love" title="You may also like" products={product.related} />
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky purchase bar */}
      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-white px-4 pt-3" style={{ paddingBottom: insets.bottom + 10 }}>
        {canBuy ? (
          <View className="flex-row gap-3">
            <Button title="Add to cart" icon={ShoppingBag} variant="primary" size="lg" className="flex-1" loading={busy === 'add'} onPress={() => void add()} />
            <Button title="Buy now" variant="accent" size="lg" className="flex-1" loading={busy === 'buy'} onPress={() => void add('buy')} />
          </View>
        ) : (
          <Button title={product.in_stock ? 'Maximum quantity in cart' : 'Sold out'} size="lg" disabled variant="outline" />
        )}
      </View>

      <ZoomViewer images={images} start={page} open={viewer} onClose={() => setViewer(false)} name={product.name} />
    </View>
  );
}

function InfoRow({ icon: Icon, text }: { icon: typeof Truck; text: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <Icon size={18} color={C.forest} />
      <Txt className="flex-1 text-[13.5px] leading-[19px] text-forest-800">{text}</Txt>
    </View>
  );
}
