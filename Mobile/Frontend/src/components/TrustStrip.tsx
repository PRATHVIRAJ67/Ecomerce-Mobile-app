import { HandCoins, ShieldCheck, Truck, Undo2 } from 'lucide-react-native';
import { View } from 'react-native';
import { formatINR } from '@/lib/format';
import type { StoreSettings } from '@/lib/queries';
import { C } from '@/lib/theme';
import { Txt } from './ui';

export function TrustStrip({ settings: s }: { settings?: StoreSettings }) {
  const items = [
    { icon: Truck, title: s?.free_shipping_threshold ? `Free delivery over ${formatINR(s.free_shipping_threshold)}` : 'Home delivery', text: 'Packed fresh, shipped with care' },
    { icon: ShieldCheck, title: 'Secure checkout', text: s?.online_payments_available ? 'UPI, cards & netbanking' : 'Prices verified at checkout' },
    { icon: HandCoins, title: s?.cod_enabled === false ? 'Pay online' : 'Cash on Delivery', text: s?.cod_max_order_value ? `Up to ${formatINR(s.cod_max_order_value)}` : 'Pay when it arrives' },
    { icon: Undo2, title: 'Easy cancellation', text: 'Before your order is packed' },
  ];
  return (
    <View className="mx-5 flex-row flex-wrap rounded-3xl border border-line/70 bg-white p-2">
      {items.map(({ icon: Icon, title, text }) => (
        <View key={title} className="w-1/2 flex-row items-start gap-2.5 p-3">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-forest-50">
            <Icon size={17} color={C.forest} />
          </View>
          <View className="flex-1">
            <Txt weight="semibold" className="text-[12.5px] leading-[16px]">
              {title}
            </Txt>
            <Txt className="mt-0.5 text-[11.5px] leading-[15px] text-muted">{text}</Txt>
          </View>
        </View>
      ))}
    </View>
  );
}
