import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { C } from '@/lib/theme';
import { Txt } from '../ui';
import { AView } from '../ui/animated';

export function LogoMark({ size = 64, color = C.cream, dot = C.terracotta }: { size?: number; color?: string; dot?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M18 20v14a14 14 0 0 0 28 0V20" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={46} cy={47} r={5} fill={dot} />
    </Svg>
  );
}

/**
 * Continues the native splash (same forest background + mark) into a short branded reveal,
 * then fades away once the app is ready. Instant when reduced motion is on.
 */
export function BrandSplash({ ready }: { ready: boolean }) {
  const reduced = useReducedMotion();
  const [gone, setGone] = useState(false);
  const mark = useSharedValue(1);
  const word = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    word.set(withDelay(150, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) })));
  }, [reduced, word]);

  useEffect(() => {
    if (!ready || reduced) return;
    mark.set(withDelay(350, withTiming(1.08, { duration: 300 })));
    fade.set(withDelay(450, withTiming(0, { duration: 380 }, (done) => {
      if (done) runOnJS(setGone)(true);
    })));
  }, [ready, reduced, mark, fade]);

  const container = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: mark.get() }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.get(), transform: [{ translateY: (1 - word.get()) * 8 }] }));

  if (gone || (ready && reduced)) return null;
  return (
    <AView style={[StyleSheet.absoluteFill, { backgroundColor: C.forest, zIndex: 100 }, container]} pointerEvents={ready ? 'none' : 'auto'}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AView style={markStyle}>
          <LogoMark size={120} />
        </AView>
        <AView style={[{ marginTop: 18, alignItems: 'center' }, wordStyle]}>
          <Txt className="font-display text-[34px] text-cream">uru</Txt>
          <Txt className="mt-1 text-[13px] tracking-[1px] text-cream/70">Your Village. Your City. Your URU.</Txt>
        </AView>
      </View>
    </AView>
  );
}
