import { router } from 'expo-router';
import { HeartHandshake, Leaf, Tractor } from 'lucide-react-native';
import { View } from 'react-native';
import { C } from '@/lib/theme';
import { Display, Eyebrow, PressableScale, Txt } from '../ui';

/** Editorial brand storytelling block. */
export function StoryCard() {
  const points = [
    { icon: Tractor, title: 'Straight from the source', text: 'Bought from farmers, weavers and makers — not middlemen.' },
    { icon: Leaf, title: 'Small batch, honest', text: 'Stone-ground, sun-cured, wood-pressed. No shortcuts.' },
    { icon: HeartHandshake, title: 'Fair to the village', text: 'Every order puts a fair price in a family’s hands.' },
  ];
  return (
    <View className="mx-5 overflow-hidden rounded-[30px] border border-terracotta-200/70 bg-terracotta-50">
      <View className="p-6">
        <Eyebrow>The URU promise</Eyebrow>
        <Display className="mt-2 text-[30px] leading-[34px]">Your village.</Display>
        <Display className="text-[30px] leading-[34px]">Your city.</Display>
        <Display italic className="text-[30px] leading-[36px] text-forest-700">
          Your URU.
        </Display>
        <Txt className="mt-3 text-[14.5px] leading-[22px] text-ink-soft">“Uru” means hometown. We bring the food and craft that make home feel like home to wherever you live now.</Txt>
      </View>
      {points.map(({ icon: Icon, title, text }) => (
        <View key={title} className="flex-row items-start gap-4 border-t border-terracotta-200/60 px-6 py-4">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            <Icon size={20} color={C.terracotta600} strokeWidth={1.7} />
          </View>
          <View className="flex-1">
            <Txt weight="semibold" className="text-[14.5px]">
              {title}
            </Txt>
            <Txt className="mt-0.5 text-[13px] leading-[18px] text-ink-soft">{text}</Txt>
          </View>
        </View>
      ))}
      <PressableScale onPress={() => router.push('/about')} className="mx-6 mb-6 mt-2 h-12 items-center justify-center rounded-2xl bg-forest-700" accessibilityLabel="Read our story">
        <Txt weight="semibold" className="text-cream">
          Read our story
        </Txt>
      </PressableScale>
    </View>
  );
}
