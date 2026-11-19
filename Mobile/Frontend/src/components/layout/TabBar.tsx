import type { BottomTabBarProps } from 'expo-router/tabs';
import { Heart, House, LayoutGrid, ShoppingBag, User, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartCount } from '@/hooks/useCart';
import { useWishlistCount } from '@/hooks/useWishlist';
import { haptic } from '@/lib/haptics';
import { C, shadow } from '@/lib/theme';
import { Txt } from '../ui';
import { AView } from '../ui/animated';

const META: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Home', icon: House },
  explore: { label: 'Explore', icon: LayoutGrid },
  wishlist: { label: 'Saved', icon: Heart },
  cart: { label: 'Cart', icon: ShoppingBag },
  account: { label: 'You', icon: User },
};

/** Floating pill tab bar with a spring-animated active indicator and live cart/wishlist badges. */
export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const safe = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const cartCount = useCartCount();
  const savedCount = useWishlistCount();
  const [width, setWidth] = useState(0);
  const routes = state.routes.filter((r) => META[r.name]);
  const slot = routes.length ? width / routes.length : 0;
  const activeIndex = Math.max(0, routes.findIndex((r) => r.key === state.routes[state.index]?.key));
  const x = useSharedValue(0);

  useEffect(() => {
    const target = activeIndex * slot;
    x.set(reduced ? target : withSpring(target, { damping: 18, stiffness: 190, mass: 0.8 }));
  }, [activeIndex, slot, reduced, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const bottom = Math.max(safe.bottom, insets.bottom, 10);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: bottom, paddingHorizontal: 16 }}>
      <View
        accessibilityRole="tablist"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width - 12)}
        className="flex-row rounded-[30px] border border-white/10 bg-forest-800 p-1.5"
        style={shadow.lift}
      >
        {slot > 0 && <AView className="absolute bottom-1.5 left-1.5 top-1.5 rounded-[24px] bg-forest-600" style={[{ width: slot }, indicator]} />}
        {routes.map((route) => {
          const meta = META[route.name]!;
          const focused = route.key === state.routes[state.index]?.key;
          const Icon = meta.icon;
          const count = route.name === 'cart' ? cartCount : route.name === 'wishlist' ? savedCount : 0;
          const onPress = () => {
            haptic.tap();
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={`${meta.label}${count ? `, ${count} items` : ''}`}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              className="h-[52px] flex-1 items-center justify-center"
            >
              <View>
                <Icon size={21} color={focused ? C.cream : 'rgba(250,247,240,0.62)'} strokeWidth={focused ? 2.2 : 1.8} fill={focused && route.name === 'wishlist' ? C.cream : 'transparent'} />
                {count > 0 && (
                  <View className="absolute -right-2.5 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1">
                    <Txt weight="bold" className="text-[9.5px] text-white">
                      {count > 99 ? '99+' : count}
                    </Txt>
                  </View>
                )}
              </View>
              <Txt weight={focused ? 'semibold' : 'medium'} className={`mt-1 text-[10.5px] ${focused ? 'text-cream' : 'text-cream/60'}`}>
                {meta.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Space to leave at the bottom of tab screens so content clears the floating bar. */
export function useTabBarSpace() {
  const safe = useSafeAreaInsets();
  return Math.max(safe.bottom, 10) + 64 + 16;
}
