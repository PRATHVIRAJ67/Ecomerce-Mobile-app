import type { Address } from '@ecommerce/shared';
import { router } from 'expo-router';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addressLine } from '@/components/AddressForm';
import { RequireAuth } from '@/components/RequireAuth';
import { Badge, Button, Display, EmptyState, ErrorState, ScreenHeader, Skeleton, Txt } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { keys, useAddresses } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { C } from '@/lib/theme';
import { toast, usePrefs } from '@/store';

export default function AddressesScreen() {
  return (
    <RequireAuth title="Addresses">
      <Addresses />
    </RequireAuth>
  );
}

function Addresses() {
  const insets = useSafeAreaInsets();
  const q = useAddresses();
  const [busy, setBusy] = useState<string | null>(null);
  const chosen = usePrefs((s) => s.deliveryAddressId);
  const setChosen = usePrefs((s) => s.setDeliveryAddressId);

  const makeDefault = async (a: Address) => {
    setBusy(a.id);
    try {
      await api.patch(`/me/addresses/${a.id}`, { is_default: true });
      await queryClient.invalidateQueries({ queryKey: keys.addresses });
      haptic.success();
      toast.success('Default address updated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = (a: Address) =>
    Alert.alert('Delete this address?', addressLine(a), [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(a.id);
          try {
            await api.del(`/me/addresses/${a.id}`);
            if (chosen === a.id) setChosen(null);
            await queryClient.invalidateQueries({ queryKey: keys.addresses });
            toast.success('Address deleted');
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Addresses" />
      {q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: insets.bottom + 100 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={C.forest} />}
          ListHeaderComponent={<Display className="mb-2 text-[28px]">Saved addresses</Display>}
          ListEmptyComponent={
            q.isPending ? (
              <View className="gap-3">
                <Skeleton style={{ height: 150, borderRadius: 24 }} />
                <Skeleton style={{ height: 150, borderRadius: 24 }} />
              </View>
            ) : (
              <EmptyState icon={MapPin} title="No saved addresses" message="Save your home or work address for one-tap checkout." />
            )
          }
          renderItem={({ item: a }) => (
            <View className="rounded-3xl border border-line/70 bg-white p-5">
              <View className="mb-2 flex-row flex-wrap gap-1.5">
                {a.label ? <Badge tone="forest">{a.label}</Badge> : null}
                {a.is_default ? <Badge tone="success">Default</Badge> : null}
              </View>
              <Txt weight="semibold" className="text-[15px]">
                {a.full_name}
              </Txt>
              <Txt className="mt-1 text-[13.5px] leading-[20px] text-ink-soft">{addressLine(a)}</Txt>
              <Txt className="mt-1 text-[13.5px] text-ink-soft">Phone: {a.phone}</Txt>
              <View className="mt-4 flex-row flex-wrap gap-2">
                <Button title="Edit" icon={Pencil} size="sm" variant="outline" onPress={() => router.push({ pathname: '/addresses/form', params: { id: a.id } })} />
                {!a.is_default ? <Button title="Set default" icon={Star} size="sm" variant="ghost" loading={busy === a.id} onPress={() => void makeDefault(a)} /> : null}
                <Button title="Delete" icon={Trash2} size="sm" variant="ghost" onPress={() => remove(a)} accessibilityLabel={`Delete address ${a.label ?? a.line1}`} />
              </View>
            </View>
          )}
        />
      )}
      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-cream px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button title="Add a new address" icon={Plus} size="lg" onPress={() => router.push('/addresses/form')} />
      </View>
    </View>
  );
}
