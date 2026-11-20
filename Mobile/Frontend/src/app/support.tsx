import { router } from 'expo-router';
import { ChevronDown, Mail, MessageCircle, Package, Phone, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Display, Eyebrow, PressableScale, ScreenHeader, Txt } from '@/components/ui';
import { AView } from '@/components/ui/animated';
import { faqs } from '@/lib/content';
import { haptic } from '@/lib/haptics';
import { useSettings } from '@/lib/queries';
import { C } from '@/lib/theme';
import { toast } from '@/store';

function Channel({ icon: Icon, title, value, onPress }: { icon: LucideIcon; title: string; value: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${title}: ${value}`} className="flex-row items-center gap-4 rounded-3xl border border-line/70 bg-white p-4">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-forest-50">
        <Icon size={20} color={C.forest} />
      </View>
      <View className="flex-1">
        <Txt className="text-[12px] text-muted">{title}</Txt>
        <Txt weight="semibold" className="text-[15px]" numberOfLines={1}>
          {value}
        </Txt>
      </View>
    </PressableScale>
  );
}

const open = (url: string) => Linking.openURL(url).catch(() => toast.error('No app available to open this link'));

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const { data: s } = useSettings();
  const [expanded, setExpanded] = useState<number | null>(0);
  const phone = s?.support_phone?.replace(/[^\d+]/g, '');
  const whatsapp = phone?.replace(/^\+/, '').replace(/^0/, '91');

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Support" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}>
        <Eyebrow>W’e here to help</Eyebrow>
        <Display className="mt-1 text-[32px] leading-[38px]">How can we help?</Display>

        <View className="mt-6 gap-3">
          <Channel icon={Package} title="Order help" value="Track, cancel or pay for an order" onPress={() => router.push('/orders')} />
          {s?.support_email ? <Channel icon={Mail} title="Email us" value={s.support_email} onPress={() => void open(`mailto:${s.support_email}?subject=${encodeURIComponent('Help with my URU order')}`)} /> : null}
          {phone ? <Channel icon={Phone} title="Call us" value={s!.support_phone!} onPress={() => void open(`tel:${phone}`)} /> : null}
          {whatsapp && whatsapp.length >= 10 ? <Channel icon={MessageCircle} title="WhatsApp" value="Chat with our team" onPress={() => void open(`https://wa.me/${whatsapp}`)} /> : null}
          {s && !s.support_email && !phone ? <Txt className="px-1 text-[13px] leading-[19px] text-ink-soft">Our support inbox is being set up. In the meantime the answers below and your order page should help.</Txt> : null}
        </View>

        <Display className="mb-3 mt-9 text-[24px]">Frequently asked</Display>
        <View className="overflow-hidden rounded-3xl border border-line/70 bg-white">
          {faqs(s).map((f, i) => {
            const isOpen = expanded === i;
            return (
              <View key={f.q} className={i ? 'border-t border-line/70' : ''}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => {
                    haptic.tap();
                    setExpanded(isOpen ? null : i);
                  }}
                  className="flex-row items-center gap-3 px-4 py-4"
                >
                  <Txt weight="semibold" className="flex-1 text-[14.5px]">
                    {f.q}
                  </Txt>
                  <ChevronDown size={18} color={C.muted} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
                </Pressable>
                {isOpen ? (
                  <AView entering={FadeIn.duration(200)} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <Txt className="text-[14px] leading-[21px] text-ink-soft">{f.a}</Txt>
                  </AView>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
