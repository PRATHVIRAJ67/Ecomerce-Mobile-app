import type { Banner } from '@ecommerce/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Linking, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { C } from '@/lib/theme';
import { Display, PressableScale, Skeleton, Txt } from '../ui';

function openLink(url: string | null) {
  if (!url) return;
  if (/^https?:\/\//i.test(url)) void Linking.openURL(url);
  else router.push(url.replace(/^\/category\//, '/category/') as Href);
}

const HEIGHT = 420;

/** Brand hero when the merchant hasn't scheduled home banners yet — no fake offers. */
function BrandHero({ width, tagline }: { width: number; tagline?: string }) {
  return (
    <View style={{ width, height: HEIGHT }} className="overflow-hidden rounded-[30px]">
      <LinearGradient colors={[C.forest, C.forestDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
      <Svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} style={{ position: 'absolute' }}>
        <Circle cx={width - 70} cy={HEIGHT - 190} r={58} fill={C.terracotta} />
        <Circle cx={width - 70} cy={HEIGHT - 190} r={84} fill="none" stroke={C.terracotta} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="3 8" />
        <Path d={`M0 ${HEIGHT} C ${width * 0.3} ${HEIGHT - 120}, ${width * 0.6} ${HEIGHT - 110}, ${width} ${HEIGHT - 150} V${HEIGHT}Z`} fill="#0F3526" />
        <Path d={`M${width * 0.25} ${HEIGHT} C ${width * 0.55} ${HEIGHT - 70}, ${width * 0.8} ${HEIGHT - 80}, ${width} ${HEIGHT - 60} V${HEIGHT}Z`} fill="#0A2A1D" />
      </Svg>
      <View className="flex-1 justify-between p-6">
        <View>
          <View className="self-start rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
            <Txt weight="semibold" className="text-[10.5px] uppercase tracking-[2px] text-terracotta-200">
              Sourced from Indian villages
            </Txt>
          </View>
          <Display className="mt-5 text-[38px] leading-[42px] text-cream">The taste of home,</Display>
          <Display italic className="text-[38px] leading-[44px] text-terracotta-300">
            delivered.
          </Display>
          <Txt className="mt-3 max-w-[78%] text-[14.5px] leading-[21px] text-cream/80">{tagline ?? 'Your Village. Your City. Your URU.'} Heirloom spices, farm produce, handloom and craft.</Txt>
        </View>
        <PressableScale onPress={() => router.push('/products')} hapticOnPress className="h-12 flex-row items-center gap-2 self-start rounded-2xl bg-terracotta-500 px-5" accessibilityLabel="Start shopping">
          <Txt weight="semibold" className="text-[15px] text-white">
            Start shopping
          </Txt>
          <ArrowRight size={18} color={C.white} />
        </PressableScale>
      </View>
    </View>
  );
}

export function HeroCarousel({ banners, loading, tagline }: { banners: Banner[]; loading?: boolean; tagline?: string }) {
  const { width: screen } = useWindowDimensions();
  const width = screen - 40;
  const reduced = useReducedMotion();
  const ref = useRef<FlatList<Banner>>(null);
  const [index, setIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || reduced || interacting) return;
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % count;
        ref.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(t);
  }, [count, reduced, interacting]);

  if (loading) return <Skeleton style={{ marginHorizontal: 20, height: HEIGHT, borderRadius: 30 }} />;
  if (!count) {
    return (
      <View className="px-5">
        <BrandHero width={width} tagline={tagline} />
      </View>
    );
  }

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / (width + 12)));
    setInteracting(false);
  };

  return (
    <View accessibilityLabel="Featured offers">
      <FlatList
        ref={ref}
        data={banners}
        horizontal
        keyExtractor={(b) => b.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={width + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        onScrollBeginDrag={() => setInteracting(true)}
        onMomentumScrollEnd={onEnd}
        getItemLayout={(_, i) => ({ length: width + 12, offset: (width + 12) * i, index: i })}
        renderItem={({ item, index: i }) => (
          <PressableScale
            onPress={() => openLink(item.link_url)}
            disabled={!item.link_url}
            scaleTo={0.985}
            accessibilityLabel={`${item.title}${item.subtitle ? `. ${item.subtitle}` : ''}`}
            accessibilityRole={item.link_url ? 'link' : 'image'}
            style={{ width, height: HEIGHT }}
            className="overflow-hidden rounded-[30px] bg-forest-800"
          >
            <Image source={{ uri: item.mobile_image_url || item.image_url }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" transition={300} priority={i === 0 ? 'high' : 'normal'} cachePolicy="memory-disk" />
            <LinearGradient colors={['transparent', 'rgba(10,42,29,0.35)', 'rgba(10,42,29,0.9)']} style={{ position: 'absolute', inset: 0 }} />
            <View className="flex-1 justify-end p-6">
              <Display className="text-[32px] leading-[36px] text-cream">{item.title}</Display>
              {item.subtitle ? <Txt className="mt-2 text-[14.5px] leading-[20px] text-cream/85">{item.subtitle}</Txt> : null}
              {item.link_url ? (
                <View className="mt-5 h-11 flex-row items-center gap-2 self-start rounded-2xl bg-terracotta-500 px-5">
                  <Txt weight="semibold" className="text-[14px] text-white">
                    {item.cta_label || 'Shop now'}
                  </Txt>
                  <ArrowRight size={16} color={C.white} />
                </View>
              ) : null}
            </View>
          </PressableScale>
        )}
      />
      {count > 1 && (
        <View className="mt-3 flex-row justify-center gap-1.5" accessibilityLabel={`Slide ${index + 1} of ${count}`}>
          {banners.map((b, i) => (
            <View key={b.id} className={`h-1.5 rounded-full ${i === index ? 'w-6 bg-forest-700' : 'w-1.5 bg-forest-700/25'}`} />
          ))}
        </View>
      )}
    </View>
  );
}

/** Secondary promo banners (placement = home_strip). */
export function StripBanners({ banners }: { banners: Banner[] }) {
  const { width: screen } = useWindowDimensions();
  if (!banners.length) return null;
  return (
    <View className="gap-3 px-5">
      {banners.slice(0, 3).map((b) => (
        <PressableScale key={b.id} onPress={() => openLink(b.link_url)} disabled={!b.link_url} accessibilityLabel={b.title} className="overflow-hidden rounded-3xl bg-forest-800" style={{ height: (screen - 40) * 0.5 }}>
          <Image source={{ uri: b.mobile_image_url || b.image_url }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" transition={300} cachePolicy="memory-disk" />
          <LinearGradient colors={['transparent', 'rgba(10,42,29,0.85)']} style={{ position: 'absolute', inset: 0 }} />
          <View className="flex-1 justify-end p-5">
            <Display className="text-[22px] text-cream">{b.title}</Display>
            {b.subtitle ? <Txt className="mt-1 text-[13px] text-cream/80">{b.subtitle}</Txt> : null}
          </View>
        </PressableScale>
      ))}
    </View>
  );
}
