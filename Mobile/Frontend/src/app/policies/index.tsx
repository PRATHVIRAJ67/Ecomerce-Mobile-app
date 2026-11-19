import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { Display, PressableScale, ScreenHeader, Txt } from '@/components/ui';
import { policy, POLICY_SLUGS } from '@/lib/content';
import { useSettings } from '@/lib/queries';
import { C } from '@/lib/theme';

export default function PoliciesScreen() {
  const { data: s } = useSettings();
  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Policies" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Display className="mb-2 text-[28px]">Policies</Display>
        {POLICY_SLUGS.map((slug) => {
          const doc = policy(slug, s);
          return (
            <PressableScale key={slug} onPress={() => router.push({ pathname: '/policies/[slug]', params: { slug } })} accessibilityLabel={doc.title} className="flex-row items-center gap-3 rounded-3xl border border-line/70 bg-white p-5">
              <View className="flex-1">
                <Txt weight="semibold" className="text-[15.5px]">
                  {doc.title}
                </Txt>
                <Txt className="mt-0.5 text-[13px] text-muted">{doc.summary}</Txt>
              </View>
              <ChevronRight size={18} color={C.muted} />
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}
