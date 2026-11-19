import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { APressable } from './animated';

interface Props extends PressableProps {
  /** How far to scale down while pressed (0.97 default). */
  scaleTo?: number;
  hapticOnPress?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/** Pressable with a springy press-down scale (skipped when the user prefers reduced motion). */
export function PressableScale({ scaleTo = 0.97, hapticOnPress, onPress, onPressIn, onPressOut, style, disabled, ...rest }: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <APressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduced) scale.set(withTiming(scaleTo, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) scale.set(withSpring(1, { damping: 14, stiffness: 260 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (hapticOnPress) haptic.tap();
        onPress?.(e);
      }}
      style={[animated, style]}
      {...rest}
    />
  );
}
