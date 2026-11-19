import { X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AView } from './animated';
import { IconButton } from './index';
import { Display } from './Text';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Max height as a fraction of the screen (default 0.88). */
  maxHeight?: number;
  scroll?: boolean;
}

/** Native-feeling bottom sheet: slides up, dims the background, drag the handle down to dismiss. */
export function Sheet({ open, onClose, title, children, footer, maxHeight = 0.88, scroll = true }: SheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const y = useSharedValue(height);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (open) {
      backdrop.set(withTiming(1, { duration: reduced ? 0 : 220 }));
      y.set(reduced ? 0 : withSpring(0, { damping: 22, stiffness: 220, mass: 0.9 }));
    } else if (mounted) {
      backdrop.set(withTiming(0, { duration: reduced ? 0 : 180 }));
      y.set(withTiming(height, { duration: reduced ? 0 : 220 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      }));
    }
  }, [open, mounted, height, reduced, y, backdrop]);

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      y.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > 120 || e.velocityY > 900) runOnJS(onClose)();
      else y.set(withSpring(0, { damping: 20, stiffness: 240 }));
    },
  });

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  if (!mounted) return null;
  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AView className="absolute inset-0 bg-forest-900/45" style={backdropStyle}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        </AView>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <AView accessibilityViewIsModal className="rounded-t-[28px] bg-cream" style={[{ maxHeight: height * maxHeight, paddingBottom: footer ? 0 : insets.bottom + 12 }, panelStyle]}>
            <GestureDetector gesture={pan}>
              <View className="px-5 pb-2 pt-3">
                <View className="mb-2 h-1.5 w-11 self-center rounded-full bg-line" accessibilityLabel="Drag down to close" />
                {title ? (
                  <View className="flex-row items-center justify-between">
                    <Display className="flex-1 text-[22px]">{title}</Display>
                    <IconButton icon={X} label="Close" onPress={onClose} size={40} tone="white" />
                  </View>
                ) : null}
              </View>
            </GestureDetector>
            <Body {...(scroll ? { keyboardShouldPersistTaps: 'handled' as const, contentContainerStyle: { paddingHorizontal: 20, paddingBottom: 16 } } : { style: { paddingHorizontal: 20, paddingBottom: 16 } })}>{children}</Body>
            {footer ? (
              <View className="border-t border-line bg-white px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
                {footer}
              </View>
            ) : null}
          </AView>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
