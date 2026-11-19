import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, Citrus, Cookie, CookingPot, Droplets, Flame, Palette, Shirt, Sprout, Wheat, type LucideIcon } from 'lucide-react-native';
import { memo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { C } from '@/lib/theme';

const ICONS: [RegExp, LucideIcon][] = [
  [/fruit|produce|vegetable|fresh/i, Apple],
  [/spice|masala|chilli|pepper/i, Flame],
  [/pickle|preserve|chutney/i, Citrus],
  [/snack|sweet|namkeen/i, Cookie],
  [/oil|ghee/i, Droplets],
  [/staple|rice|millet|grain|pulse|flour|organic/i, Wheat],
  [/handloom|textile|saree|fabric|towel|cloth/i, Shirt],
  [/home|kitchen|cook|clay|brass/i, CookingPot],
  [/craft|toy|gift|decor|art/i, Palette],
];

const PALETTES: { colors: [string, string, string]; icon: string }[] = [
  { colors: ['#E7EFEA', '#FAF7F0', '#C7DACF'], icon: C.forest },
  { colors: ['#FBEDE4', '#FAF7F0', '#F4CFB6'], icon: C.terracotta600 },
  { colors: ['#F1EBDD', '#FAF7F0', '#E9DFCA'], icon: C.forest },
  { colors: ['#C7DACF', '#E7EFEA', '#FAF7F0'], icon: C.forestDeep },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function iconFor(...hints: (string | null | undefined)[]): LucideIcon {
  const text = hints.filter(Boolean).join(' ');
  return ICONS.find(([re]) => re.test(text))?.[1] ?? Sprout;
}

/** Branded placeholder until the merchant uploads photos (seed products have none). */
export const ImageFallback = memo(function ImageFallback({ seed, hints, style, iconScale = 0.22 }: { seed: string; hints: (string | null | undefined)[]; style?: StyleProp<ViewStyle>; iconScale?: number }) {
  const Icon = iconFor(...hints);
  const p = PALETTES[hash(seed) % PALETTES.length]!;
  const flat = StyleSheet.flatten(style) ?? {};
  const known = typeof flat.width === 'number' && typeof flat.height === 'number' ? Math.min(flat.width, flat.height) : 0;
  const [measured, setMeasured] = useState(0);
  const size = measured || known;
  return (
    <View style={[{ overflow: 'hidden' }, style]} onLayout={(e) => {
        const m = Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height);
        if (m > 0) setMeasured(m);
      }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={p.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
      {/* soft sun / halo motif */}
      <View style={{ position: 'absolute', right: -size * 0.18, top: -size * 0.18, width: size * 0.62, height: size * 0.62, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {size > 0 && (
          <View style={{ width: size * 0.44, height: size * 0.44, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={Math.max(18, size * iconScale)} color={p.icon} strokeWidth={1.3} />
          </View>
        )}
      </View>
    </View>
  );
});

interface Props {
  uri?: string | null;
  seed: string;
  hints: (string | null | undefined)[];
  style?: StyleProp<ViewStyle>;
  priority?: 'low' | 'normal' | 'high';
  alt?: string;
}

/** expo-image (disk + memory cache, fade-in) with the branded fallback when there is no photo or it fails. */
export const ProductImage = memo(function ProductImage({ uri, seed, hints, style, priority = 'normal', alt }: Props) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) return <ImageFallback seed={seed} hints={hints} style={style} />;
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: C.creamDark }, style]}>
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        priority={priority}
        recyclingKey={uri}
        accessibilityLabel={alt}
        accessible={Boolean(alt)}
        onError={() => setFailed(true)}
      />
    </View>
  );
});
