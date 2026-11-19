import type { ProductCard } from '@ecommerce/shared';
import { Heart } from 'lucide-react-native';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useIsWishlisted, wishlist } from '@/hooks/useWishlist';
import { C } from '@/lib/theme';
import { AView } from '../ui/animated';
import { PressableScale } from '../ui';

/** Heart that pops when saved. */
export function WishlistHeart({ product, size = 36, tone = 'glass' }: { product: Pick<ProductCard, 'id' | 'name'> & Partial<ProductCard>; size?: number; tone?: 'glass' | 'white' }) {
  const saved = useIsWishlisted(product.id);
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const onPress = async () => {
    const next = await wishlist.toggle(product);
    if (next && !reduced) scale.set(withSequence(withTiming(1.35, { duration: 120 }), withSpring(1, { damping: 8, stiffness: 300 })));
  };

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.88}
      hitSlop={8}
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: saved }}
      accessibilityLabel={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`items-center justify-center rounded-full ${tone === 'white' ? 'border border-line bg-white' : 'bg-white/90'}`}
      style={{ width: size, height: size }}
    >
      <AView style={style}>
        <Heart size={size * 0.5} color={saved ? C.terracotta : C.forestDeep} fill={saved ? C.terracotta : 'transparent'} strokeWidth={2} />
      </AView>
    </PressableScale>
  );
}
