import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressForm } from '@/components/AddressForm';
import { RequireAuth } from '@/components/RequireAuth';
import { Display, Loading, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useAddresses } from '@/lib/queries';
import { usePrefs } from '@/store';

/** Add (no id) or edit (?id=) an address. `?select=1` makes a new address the delivery address (checkout). */
export default function AddressFormScreen() {
  return (
    <RequireAuth title="Address">
      <FormScreen />
    </RequireAuth>
  );
}

function FormScreen() {
  const { id, select } = useLocalSearchParams<{ id?: string; select?: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const q = useAddresses();
  const setChosen = usePrefs((s) => s.setDeliveryAddressId);
  const address = id ? q.data?.find((a) => a.id === id) : null;
  if (id && q.isPending) return <Loading />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} className="bg-cream">
      <ScreenHeader title={address ? 'Edit address' : 'New address'} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <Display className="mb-5 text-[28px]">{address ? 'Update address' : 'Where should we deliver?'}</Display>
        <AddressForm
          address={address}
          defaultName={profile?.full_name ?? ''}
          submitLabel={select ? 'Save & deliver here' : undefined}
          onSaved={(a) => {
            if (select || !address) setChosen(a.id);
            router.back();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
