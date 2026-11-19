import type { Address } from '@ecommerce/shared';
import { router } from 'expo-router';
import { Check, ChevronDown, MapPin, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';
import { useAddresses } from '@/lib/queries';
import { C } from '@/lib/theme';
import { usePrefs } from '@/store';
import { Badge, Button, PressableScale, Txt } from './ui';
import { Sheet } from './ui/Sheet';

/** The address the customer is shopping for: their chosen one, else the default, else the newest. */
export function useDeliveryAddress(): { address: Address | null; addresses: Address[] | undefined; loading: boolean } {
  const { isSignedIn } = useAuth();
  const chosen = usePrefs((s) => s.deliveryAddressId);
  const q = useAddresses(isSignedIn);
  const list = q.data;
  const address = list?.find((a) => a.id === chosen) ?? list?.find((a) => a.is_default) ?? list?.[0] ?? null;
  return { address, addresses: list, loading: isSignedIn && q.isPending };
}

/** "Deliver to …" pill + address picker sheet. */
export function DeliveryLocation({ light }: { light?: boolean }) {
  const { isSignedIn } = useAuth();
  const { address, addresses } = useDeliveryAddress();
  const setChosen = usePrefs((s) => s.setDeliveryAddressId);
  const [open, setOpen] = useState(false);

  const label = address ? `${address.city} ${address.pincode}` : isSignedIn ? 'Add a delivery address' : 'Sign in to set location';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Deliver to ${label}. Change delivery location`}
        onPress={() => {
          haptic.tap();
          if (!isSignedIn) router.push('/login');
          else setOpen(true);
        }}
        className="flex-row items-center gap-1.5"
        hitSlop={8}
      >
        <MapPin size={15} color={light ? C.terracotta200 : C.terracotta} strokeWidth={2.2} />
        <Txt className={`text-[12px] ${light ? 'text-cream/70' : 'text-muted'}`}>Deliver to</Txt>
        <Txt weight="semibold" className={`max-w-[170px] text-[13px] ${light ? 'text-cream' : 'text-ink'}`} numberOfLines={1}>
          {label}
        </Txt>
        <ChevronDown size={14} color={light ? C.cream : C.ink} />
      </Pressable>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Where should we deliver?"
        footer={
          <Button
            title="Add a new address"
            icon={Plus}
            variant="outline"
            onPress={() => {
              setOpen(false);
              router.push('/addresses/form');
            }}
          />
        }
      >
        <View className="gap-3 pb-2">
          {(addresses ?? []).map((a) => {
            const selected = a.id === address?.id;
            return (
              <PressableScale
                key={a.id}
                onPress={() => {
                  haptic.success();
                  setChosen(a.id);
                  setOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                className={`flex-row items-start gap-3 rounded-2xl border-2 bg-white p-4 ${selected ? 'border-forest-700' : 'border-line'}`}
              >
                <View className={`mt-0.5 h-5 w-5 items-center justify-center rounded-full ${selected ? 'bg-forest-700' : 'border border-line'}`}>{selected ? <Check size={12} color={C.cream} strokeWidth={3} /> : null}</View>
                <View className="flex-1">
                  <View className="mb-1 flex-row flex-wrap gap-1.5">
                    {a.label ? <Badge tone="forest">{a.label}</Badge> : null}
                    {a.is_default ? <Badge>Default</Badge> : null}
                  </View>
                  <Txt weight="semibold">{a.full_name}</Txt>
                  <Txt className="mt-0.5 text-[13px] leading-[18px] text-ink-soft">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} – {a.pincode}
                  </Txt>
                </View>
              </PressableScale>
            );
          })}
          {addresses && addresses.length === 0 ? <Txt className="py-4 text-center text-ink-soft">You have’ saved any addresses yet.</Txt> : null}
        </View>
      </Sheet>
    </>
  );
}
