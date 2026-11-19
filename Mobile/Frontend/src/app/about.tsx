import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { HeartHandshake, Leaf, Sprout, Tractor } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '@/components/layout/BrandSplash';
import { Button, Display, Eyebrow, ScreenHeader, Txt } from '@/components/ui';
import { C } from '@/lib/theme';

const VALUES = [
  { icon: Tractor, title: 'Direct from makers', text: 'We work with farmers, home cooks, weavers and potters, and buy from them directly.' },
  { icon: Leaf, title: 'Made the old way', text: 'Stone-ground, sun-dried, hand-woven, wood-pressed — traditional methods, small batches.' },
  { icon: HeartHandshake, title: 'Fair, every time', text: 'Makers set fair prices. You get honest products with clear origins.' },
  { icon: Sprout, title: 'Rooted in place', text: 'Every product carries the name of the village or region it comes from.' },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Our story" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <View className="mx-5 mt-4 overflow-hidden rounded-[30px] p-7">
          <LinearGradient colors={[C.forest, C.forestDeep]} style={{ position: 'absolute', inset: 0 }} />
          <View className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-terracotta-500/30" />
          <LogoMark size={48} />
          <Display className="mt-6 text-[32px] leading-[37px] text-cream">Your village. Your city.</Display>
          <Display italic className="text-[32px] leading-[38px] text-terracotta-300">
            Your URU.
          </Display>
          <Txt className="mt-3 text-[14.5px] leading-[21px] text-cream/80">“Uru” is the word for hometown in Kannada. URU exists so that wherever you live, the flavours and crafts of home are never far away.</Txt>
        </View>

        <View className="px-5 pt-8">
          <Eyebrow>Why we started</Eyebrow>
          <Txt className="mt-3 text-[15.5px] leading-[25px] text-ink-soft">
            Millions of us have moved from our villages and towns to the city. We brought our habits with us — but not the pickle our grandmother made every summer, the red rice from the paddy behind the house, or the handloom towel that only got softer with time.
          </Txt>
          <Txt className="mt-4 text-[15.5px] leading-[25px] text-ink-soft">
            The people who still make these things often struggle to reach buyers beyond the weekly market. URU is the bridge: a careful, honest store that brings village goods to city homes, and a fair income back to the village.
          </Txt>
        </View>

        <View className="mt-8 gap-3 px-5">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <View key={title} className="flex-row gap-4 rounded-3xl border border-line/70 bg-white p-5">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-terracotta-50">
                <Icon size={22} color={C.terracotta600} strokeWidth={1.7} />
              </View>
              <View className="flex-1">
                <Txt weight="semibold" className="text-[15px]">
                  {title}
                </Txt>
                <Txt className="mt-1 text-[13.5px] leading-[19px] text-ink-soft">{text}</Txt>
              </View>
            </View>
          ))}
        </View>
        <View className="px-5 pt-8">
          <Button title="Explore the collection" variant="accent" size="lg" onPress={() => router.navigate('/explore')} />
        </View>
      </ScrollView>
    </View>
  );
}
