import { addressInput, type Address } from '@ecommerce/shared';
import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { api, ApiError, errorMessage } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { keys } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { C } from '@/lib/theme';
import { toast } from '@/store';
import { Button, Input, Txt } from './ui';
import { Sheet } from './ui/Sheet';

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const LABELS = ['Home', 'Work', 'Other'];

type Form = { label: string; full_name: string; phone: string; line1: string; line2: string; landmark: string; city: string; state: string; pincode: string; is_default: boolean };

const from = (a?: Address | null, name = ''): Form => ({
  label: a?.label ?? 'Home',
  full_name: a?.full_name ?? name,
  phone: a?.phone ?? '',
  line1: a?.line1 ?? '',
  line2: a?.line2 ?? '',
  landmark: a?.landmark ?? '',
  city: a?.city ?? '',
  state: a?.state ?? '',
  pincode: a?.pincode ?? '',
  is_default: a?.is_default ?? false,
});

const FRIENDLY: Partial<Record<keyof Form, string>> = {
  full_name: 'Enter the recipient’s full name',
  line1: 'Enter house / flat and street',
  city: 'Enter your city or town',
  state: 'Choose your state',
};

/** Validated with the same zod schema the API uses (Shared/validation → addressInput). */
export function AddressForm({ address, defaultName, onSaved, submitLabel }: { address?: Address | null; defaultName?: string; onSaved: (a: Address) => void; submitLabel?: string }) {
  const [form, setForm] = useState<Form>(() => from(address, defaultName));
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [statesOpen, setStatesOpen] = useState(false);
  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const payload = {
      label: form.label.trim() || null,
      full_name: form.full_name,
      phone: form.phone.replace(/\s+/g, ' ').trim(),
      line1: form.line1,
      line2: form.line2.trim() || null,
      landmark: form.landmark.trim() || null,
      city: form.city,
      state: form.state,
      pincode: form.pincode.trim(),
      is_default: form.is_default,
    };
    const r = addressInput.safeParse(payload);
    if (!r.success) {
      const errs: typeof errors = {};
      for (const i of r.error.issues) {
        const k = i.path[0] as keyof Form;
        errs[k] ??= FRIENDLY[k] ?? i.message;
      }
      setErrors(errs);
      haptic.error();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const saved = address ? await api.patch<Address>(`/me/addresses/${address.id}`, r.data) : await api.post<Address>('/me/addresses', r.data);
      await queryClient.invalidateQueries({ queryKey: keys.addresses });
      haptic.success();
      toast.success(address ? 'Address updated' : 'Address saved');
      onSaved(saved);
    } catch (e) {
      if (e instanceof ApiError && Array.isArray(e.details)) {
        const errs: typeof errors = {};
        for (const d of e.details as { path: string; message: string }[]) errs[d.path as keyof Form] = d.message;
        setErrors(errs);
      }
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="flex-row gap-2" accessibilityRole="radiogroup" accessibilityLabel="Save address as">
        {LABELS.map((l) => (
          <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: form.label === l }} onPress={() => setForm((f) => ({ ...f, label: l }))} className={`rounded-full border px-4 py-2 ${form.label === l ? 'border-forest-700 bg-forest-700' : 'border-line bg-white'}`}>
            <Txt weight="medium" className={form.label === l ? 'text-cream' : 'text-ink'}>
              {l}
            </Txt>
          </Pressable>
        ))}
      </View>
      <Input label="Full name" value={form.full_name} onChangeText={set('full_name')} error={errors.full_name} autoComplete="name" textContentType="name" autoCapitalize="words" />
      <Input label="Mobile number" value={form.phone} onChangeText={set('phone')} error={errors.phone} hint="For delivery updates" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={16} />
      <Input label="House / flat, building, street" value={form.line1} onChangeText={set('line1')} error={errors.line1} autoComplete="address-line1" textContentType="streetAddressLine1" />
      <Input label="Area, colony, sector" optional value={form.line2} onChangeText={set('line2')} error={errors.line2} autoComplete="address-line2" textContentType="streetAddressLine2" />
      <Input label="Landmark" optional value={form.landmark} onChangeText={set('landmark')} error={errors.landmark} />
      <View className="flex-row gap-3">
        <Input containerClassName="flex-1" label="PIN code" value={form.pincode} onChangeText={(t) => setForm((f) => ({ ...f, pincode: t.replace(/\D/g, '').slice(0, 6) }))} error={errors.pincode} keyboardType="number-pad" autoComplete="postal-code" textContentType="postalCode" maxLength={6} />
        <Input containerClassName="flex-1" label="City / town" value={form.city} onChangeText={set('city')} error={errors.city} textContentType="addressCity" />
      </View>
      <View className="gap-1.5">
        <Txt weight="medium" className="text-[13px] text-ink-soft">
          State
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel={`State: ${form.state || 'not selected'}. Choose state`} onPress={() => setStatesOpen(true)} className={`h-[52px] flex-row items-center justify-between rounded-2xl border bg-white px-4 ${errors.state ? 'border-danger' : 'border-line'}`}>
          <Txt className={form.state ? 'text-[15px]' : 'text-[15px] text-muted'}>{form.state || 'Select state'}</Txt>
          <ChevronDown size={18} color={C.muted} />
        </Pressable>
        {errors.state ? <Txt className="text-[12.5px] text-danger">{errors.state}</Txt> : null}
      </View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: form.is_default }} onPress={() => setForm((f) => ({ ...f, is_default: !f.is_default }))} className="flex-row items-center gap-3 py-1">
        <View className={`h-5 w-5 items-center justify-center rounded-md ${form.is_default ? 'bg-forest-700' : 'border border-line bg-white'}`}>{form.is_default ? <Check size={13} color={C.cream} strokeWidth={3} /> : null}</View>
        <Txt className="text-[14.5px]">Make this my default address</Txt>
      </Pressable>
      <Button title={submitLabel ?? (address ? 'Save changes' : 'Save address')} size="lg" loading={busy} onPress={submit} />

      <Sheet open={statesOpen} onClose={() => setStatesOpen(false)} title="Choose state">
        {INDIAN_STATES.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="radio"
            accessibilityState={{ selected: form.state === s }}
            onPress={() => {
              haptic.tap();
              setForm((f) => ({ ...f, state: s }));
              setStatesOpen(false);
            }}
            className="flex-row items-center justify-between border-b border-line/60 py-3.5"
          >
            <Txt weight={form.state === s ? 'semibold' : 'regular'} className="text-[15px]">
              {s}
            </Txt>
            {form.state === s ? <Check size={18} color={C.forest} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

export function addressLine(a: Pick<Address, 'line1' | 'line2' | 'landmark' | 'city' | 'state' | 'pincode'>) {
  return `${a.line1}${a.line2 ? `, ${a.line2}` : ''}${a.landmark ? `, near ${a.landmark}` : ''}, ${a.city}, ${a.state} – ${a.pincode}`;
}
