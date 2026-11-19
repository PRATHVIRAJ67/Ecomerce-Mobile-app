import type { ProductImage as Img } from '@ecommerce/shared';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/lib/theme';
import { Txt } from '../ui';
import { AView } from '../ui/animated';

const MAX = 4;

/** Pinch to zoom, double-tap to toggle 2.5×, drag to pan while zoomed. */
function ZoomableImage({ uri, alt }: { uri: string; alt: string }) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);

  useEffect(() => {
    scale.set(1);
    saved.set(1);
    tx.set(0);
    ty.set(0);
  }, [uri, scale, saved, tx, ty]);

  const pinch = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      scale.set(Math.min(MAX, Math.max(1, saved.get() * e.scale)));
    },
    onDeactivate: () => {
      'worklet';
      saved.set(scale.get());
      if (scale.get() <= 1.01) {
        tx.set(withTiming(0));
        ty.set(withTiming(0));
      }
    },
  });

  const pan = usePanGesture({
    minPointers: 1,
    onBegin: () => {
      'worklet';
      sx.set(tx.get());
      sy.set(ty.get());
    },
    onUpdate: (e) => {
      'worklet';
      if (scale.get() <= 1) return;
      const limX = (width * (scale.get() - 1)) / 2;
      const limY = (height * 0.6 * (scale.get() - 1)) / 2;
      tx.set(Math.max(-limX, Math.min(limX, sx.get() + e.translationX)));
      ty.set(Math.max(-limY, Math.min(limY, sy.get() + e.translationY)));
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onDeactivate: () => {
      'worklet';
      const next = scale.get() > 1 ? 1 : 2.5;
      scale.set(withTiming(next));
      saved.set(next);
      if (next === 1) {
        tx.set(withTiming(0));
        ty.set(withTiming(0));
      }
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: scale.get() }] }));

  return (
    <GestureDetector gesture={gesture}>
      <AView style={[{ width, height: height * 0.62 }, style]}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="contain" accessibilityLabel={alt} cachePolicy="memory-disk" />
      </AView>
    </GestureDetector>
  );
}

export function ZoomViewer(props: { images: Img[]; start: number; open: boolean; onClose: () => void; name: string }) {
  if (!props.open || !props.images.length) return null;
  return <ViewerBody key={props.start} {...props} />;
}

function ViewerBody({ images, start, onClose, name }: { images: Img[]; start: number; onClose: () => void; name: string }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(start);
  const current = images[index];
  if (!current) return null;
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0F0C' }}>
        <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4">
          <Txt className="text-[13px] text-cream/70">
            {index + 1} / {images.length}
          </Txt>
          <Pressable accessibilityRole="button" accessibilityLabel="Close photo viewer" onPress={onClose} hitSlop={10} className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <X size={20} color={C.cream} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center overflow-hidden">
          <ZoomableImage uri={current.url} alt={current.alt || name} />
        </View>
        <Txt className="mb-2 text-center text-[12px] text-cream/50">Pinch or double-tap to zoom</Txt>
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 12 }}>
            {images.map((img, i) => (
              <Pressable key={img.id} accessibilityRole="button" accessibilityLabel={`Photo ${i + 1}`} accessibilityState={{ selected: i === index }} onPress={() => setIndex(i)} style={{ borderWidth: 2, borderColor: i === index ? C.terracotta : 'transparent', borderRadius: 12, overflow: 'hidden' }}>
                <Image source={{ uri: img.url }} style={{ width: 56, height: 56 }} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}
