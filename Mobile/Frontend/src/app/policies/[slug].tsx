import { router, useLocalSearchParams } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Display, EmptyState, ScreenHeader, Txt } from '@/components/ui';
import { policy, POLICY_SLUGS, type PolicySlug } from '@/lib/content';
import { useSettings } from '@/lib/queries';

export default function PolicyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { data: s } = useSettings();
  if (!POLICY_SLUGS.includes(slug as PolicySlug)) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader />
        <EmptyState icon={FileText} title="Policy not found" action={<Button title="All policies" onPress={() => router.replace('/policies')} />} />
      </View>
    );
  }
  const doc = policy(slug as PolicySlug, s);
  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={doc.title} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}>
        <Display className="text-[30px] leading-[36px]">{doc.title}</Display>
        <Txt className="mt-1 text-muted">{doc.summary}</Txt>
        {doc.sections.map((sec) => (
          <View key={sec.heading} className="mt-7">
            <Txt weight="semibold" className="text-[16px]">
              {sec.heading}
            </Txt>
            {sec.body.map((p, i) => (
              <Txt key={i} className="mt-2 text-[15px] leading-[24px] text-ink-soft">
                {p}
              </Txt>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
