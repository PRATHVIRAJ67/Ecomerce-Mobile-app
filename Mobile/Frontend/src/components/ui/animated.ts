import { cssInterop } from 'nativewind';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

/** Reanimated components that accept NativeWind `className` (merged into `style`). */
export const AView = Animated.View;
export const APressable = Animated.createAnimatedComponent(Pressable);

cssInterop(AView, { className: 'style' });
cssInterop(APressable, { className: 'style' });
