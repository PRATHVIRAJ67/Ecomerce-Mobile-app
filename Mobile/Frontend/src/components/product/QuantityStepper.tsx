import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { haptic } from '@/lib/haptics';
import { C } from '@/lib/theme';
import { Txt } from '../ui';

interface Props {
  value: number;
  max: number;
  min?: number;
  onChange: (n: number) => void;
  busy?: boolean;
  size?: 'sm' | 'md';
  label: string;
  /** Show a bin at the minimum (cart lines). */
  removable?: boolean;
}

export function QuantityStepper({ value, max, min = 1, onChange, busy, size = 'md', label, removable }: Props) {
  const h = size === 'sm' ? 36 : 48;
  const atMin = value <= min;
  const atMax = value >= max;
  const btn = (disabled: boolean) => ({ width: h, height: h, alignItems: 'center' as const, justifyContent: 'center' as const, opacity: disabled ? 0.3 : 1 });
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment' && !atMax) onChange(value + 1);
        if (e.nativeEvent.actionName === 'decrement' && (!atMin || removable)) onChange(value - 1);
      }}
      className="flex-row items-center rounded-2xl border border-line bg-white"
      style={{ height: h }}
    >
      <Pressable
        accessibilityElementsHidden
        disabled={busy || (atMin && !removable)}
        onPress={() => {
          haptic.tap();
          onChange(value - 1);
        }}
        style={btn(Boolean(busy) || (atMin && !removable))}
        hitSlop={4}
      >
        {atMin && removable ? <Trash2 size={16} color={C.danger} /> : <Minus size={16} color={C.forestDeep} />}
      </Pressable>
      <View style={{ minWidth: size === 'sm' ? 26 : 34 }} className="items-center">
        {busy ? <ActivityIndicator size="small" color={C.muted} /> : <Txt weight="bold" className={size === 'sm' ? 'text-[14px]' : 'text-base'}>{value}</Txt>}
      </View>
      <Pressable
        accessibilityElementsHidden
        disabled={busy || atMax}
        onPress={() => {
          haptic.tap();
          onChange(value + 1);
        }}
        style={btn(Boolean(busy) || atMax)}
        hitSlop={4}
      >
        <Plus size={16} color={C.forestDeep} />
      </Pressable>
    </View>
  );
}
