import Animated from 'react-native-reanimated';

/**
 * Reanimated view for motion only. Do NOT pass `className` to it: NativeWind does not style
 * Reanimated components in Android release builds. Put classes on a plain View inside/outside.
 */
export const AView = Animated.View;
