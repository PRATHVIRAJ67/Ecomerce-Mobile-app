import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { HeartHandshake, MapPinned, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Pressable, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LogoMark } from '@/components/layout/BrandSplash';
import { Button, Display, Txt } from '@/components/ui';
import { AView } from '@/components/ui/animated';
import { haptic } from '@/lib/haptics';
import { C } from '@/lib/theme';
import { usePrefs } from '@/store';

const SLIDES: { icon: LucideIcon; eyebrow: string; title: string; italic: string; body: string }[] = [
  { icon: MapPinned, eyebrow: 'Rooted in place', title: 'Every product has', italic: 'a hometown.', body: 'Ratnagiri mangoes, Byadgi chillies, Ilkal sarees — each one comes with the village it was made in.' },
  { icon: HeartHandshake, eyebrow: 'Made by families', title: 'Small batches,', italic: 'fair prices.', body: 'We buy directly from farmers, home cooks and weavers, so more of what you pay reaches them.' },
  { icon: ShieldCheck, eyebrow: 'Shop with ease', title: 'Delivered to', italic: 'your doorstep.', body: 'Secure UPI & card payments or Cash on Delivery, with live tracking from packing to delivery.' },
];

export default function Onboarding() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const finish = usePrefs((s) => s.setOnboarded);
  const list = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const done = (to: '/' | '/login' = '/') => {
    haptic.success();
    finish();
    router.replace('/');
    if (to === '/login') setTimeout(() => router.push('/login'), 50);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  const artH = height * 0.48;

  return (
    <View className="flex-1 bg-cream">
      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(s) => s.title}
        renderItem={({ item, index: i }) => {
          const Icon = item.icon;
          return (
            <View style={{ width }}>
              <View style={{ height: artH }} className="overflow-hidden rounded-b-[44px]">
                <LinearGradient colors={i === 1 ? [C.terracotta600, C.terracotta] : [C.forest, C.forestDeep]} style={{ position: 'absolute', inset: 0 }} />
                <Svg width={width} height={artH} style={{ position: 'absolute' }}>
                  <Circle cx={width * 0.78} cy={artH * 0.38} r={width * 0.17} fill={i === 1 ? C.cream : C.terracotta} opacity={0.9} />
                  <Path d={`M0 ${artH} C ${width * 0.3} ${artH - 110}, ${width * 0.65} ${artH - 90}, ${width} ${artH - 140} V${artH}Z`} fill={i === 1 ? '#97491F' : '#0F3526'} />
                  <Path d={`M${width * 0.2} ${artH} C ${width * 0.5} ${artH - 60}, ${width * 0.8} ${artH - 70}, ${width} ${artH - 40} V${artH}Z`} fill={i === 1 ? '#7a3a18' : '#0A2A1D'} />
                </Svg>
                <View style={{ paddingTop: insets.top + 20 }} className="px-7">
                  <LogoMark size={44} color={C.cream} dot={i === 1 ? C.forest : C.terracotta} />
                </View>
                <View className="absolute bottom-16 left-7 h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                  <Icon size={30} color={C.cream} strokeWidth={1.5} />
                </View>
              </View>
              <AView key={`t-${index === i}`} entering={FadeInDown.duration(450)} style={{ paddingHorizontal: 28, paddingTop: 32 }}>
                <Txt weight="semibold" className="text-[11px] uppercase tracking-[2.5px] text-terracotta-600">
                  {item.eyebrow}
                </Txt>
                <Display className="mt-3 text-[36px] leading-[40px]">{item.title}</Display>
                <Display italic className="text-[36px] leading-[42px] text-forest-700">
                  {item.italic}
                </Display>
                <Txt className="mt-4 text-[15.5px] leading-[23px] text-ink-soft">{item.body}</Txt>
              </AView>
            </View>
          );
        }}
      />

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-7">
        <View className="mb-6 flex-row gap-1.5" accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View key={s.title} className={`h-1.5 rounded-full ${i === index ? 'w-7 bg-forest-700' : 'w-1.5 bg-forest-700/25'}`} />
          ))}
        </View>
        {last ? (
          <View className="gap-3">
            <Button title="Start exploring" size="lg" variant="accent" onPress={() => done('/')} />
            <Button title="I already have an account" size="lg" variant="ghost" onPress={() => done('/login')} />
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <Pressable accessibilityRole="button" onPress={() => done('/')} hitSlop={10}>
              <Txt weight="medium" className="text-muted">
                Skip
              </Txt>
            </Pressable>
            <Button
              title="Next"
              size="lg"
              onPress={() => {
                list.current?.scrollToIndex({ index: index + 1, animated: true });
                setIndex(index + 1);
              }}
              className="px-10"
            />
          </View>
        )}
      </View>
    </View>
  );
}
