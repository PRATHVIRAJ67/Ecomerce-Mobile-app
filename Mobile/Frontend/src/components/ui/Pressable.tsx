import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';

/**
 * Press feedback via NativeWind `active:` variants on a plain Pressable.
 * (className is not applied to Reanimated components in Android release builds, so no Animated here.)
 * Class names must be complete static strings so Tailwind generates them.
 */
const SCALE: Record<string, string> = {
  '0.99': 'active:scale-[0.99]',
  '0.985': 'active:scale-[0.985]',
  '0.98': 'active:scale-[0.98]',
  '0.97': 'active:scale-[0.97]',
  '0.92': 'active:scale-[0.92]',
  '0.9': 'active:scale-90',
  '0.88': 'active:scale-[0.88]',
};

interface Props extends PressableProps {
  /** How far to scale down while pressed (0.97 default). */
  scaleTo?: number;
  hapticOnPress?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function PressableScale({ scaleTo = 0.97, hapticOnPress, onPress, className = '', ...rest }: Props) {
  const reduced = useReducedMotion();
  const feedback = reduced ? 'active:opacity-75' : `active:opacity-90 ${SCALE[String(scaleTo)] ?? 'active:scale-[0.97]'}`;
  return (
    <Pressable
      accessibilityRole="button"
      className={`${className} ${feedback}`}
      onPress={(e) => {
        if (hapticOnPress) haptic.tap();
        onPress?.(e);
      }}
      {...rest}
    />
  );
}
