import { router } from 'expo-router';
import { ChevronLeft, RotateCw, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage } from '@/lib/api';
import { C } from '@/lib/theme';
import { AView } from './animated';
import { PressableScale } from './Pressable';
import { Display, Txt } from './Text';

export { PressableScale } from './Pressable';
export { Display, Eyebrow, Txt } from './Text';

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'light' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BG: Record<Variant, string> = {
  primary: 'bg-forest-700',
  accent: 'bg-terracotta-500',
  outline: 'bg-white border border-line',
  ghost: 'bg-transparent',
  light: 'bg-cream',
  danger: 'bg-white border border-danger/30',
};
const FG: Record<Variant, string> = {
  primary: C.cream,
  accent: C.white,
  outline: C.forestDeep,
  ghost: C.forestDeep,
  light: C.forestDeep,
  danger: C.danger,
};
const SIZE: Record<Size, { box: string; text: string; icon: number }> = {
  sm: { box: 'h-10 px-4 rounded-xl', text: 'text-[13px]', icon: 16 },
  md: { box: 'h-12 px-5 rounded-2xl', text: 'text-[15px]', icon: 18 },
  lg: { box: 'h-14 px-6 rounded-2xl', text: 'text-base', icon: 20 },
};

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  accessibilityLabel?: string;
  haptic?: boolean;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, disabled, className = '', accessibilityLabel, haptic = true }: ButtonProps) {
  const s = SIZE[size];
  const off = disabled || loading;
  return (
    <PressableScale
      onPress={onPress}
      disabled={off}
      hapticOnPress={haptic}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(off), busy: Boolean(loading) }}
      className={`flex-row items-center justify-center gap-2 ${BG[variant]} ${s.box} ${off ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator size="small" color={FG[variant]} /> : Icon ? <Icon size={s.icon} color={FG[variant]} strokeWidth={2} /> : null}
      <Txt weight="semibold" className={s.text} style={{ color: FG[variant] }} numberOfLines={1}>
        {title}
      </Txt>
      {IconRight && !loading && <IconRight size={s.icon} color={FG[variant]} strokeWidth={2} />}
    </PressableScale>
  );
}

export function IconButton({ icon: Icon, label, onPress, tone = 'plain', size = 44, color, badge, className = '' }: { icon: LucideIcon; label: string; onPress?: () => void; tone?: 'plain' | 'white' | 'cream' | 'glass'; size?: number; color?: string; badge?: number; className?: string }) {
  const bg = tone === 'white' ? 'bg-white border border-line/70' : tone === 'cream' ? 'bg-cream' : tone === 'glass' ? 'bg-white/90' : '';
  return (
    <PressableScale
      onPress={onPress}
      hapticOnPress
      scaleTo={0.92}
      accessibilityLabel={badge ? `${label}, ${badge} items` : label}
      hitSlop={6}
      className={`items-center justify-center rounded-full ${bg} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.47)} color={color ?? C.forestDeep} strokeWidth={1.9} />
      {badge ? (
        <View className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-terracotta-500 px-1" pointerEvents="none">
          <Txt weight="bold" className="text-[10px] text-white">
            {badge > 99 ? '99+' : badge}
          </Txt>
        </View>
      ) : null}
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  right?: ReactNode;
  containerClassName?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function Input({ label, error, hint, optional, right, containerClassName = '', onFocus, onBlur, ref, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const border = error ? 'border-danger' : focused ? 'border-forest-600' : 'border-line';
  return (
    <View className={`gap-1.5 ${containerClassName}`}>
      <Txt weight="medium" className="text-[13px] text-ink-soft">
        {label}
        {optional ? <Txt className="text-[13px] text-muted"> (optional)</Txt> : null}
      </Txt>
      <View className={`min-h-[52px] flex-row items-center rounded-2xl border bg-white px-4 ${border}`}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={C.muted}
          selectionColor={C.terracotta}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className="flex-1 py-3 font-sans text-[15px] text-ink"
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Txt accessibilityLiveRegion="polite" className="text-[12.5px] text-danger">
          {error}
        </Txt>
      ) : hint ? (
        <Txt className="text-[12.5px] text-muted">{hint}</Txt>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Loading, empty & error states
// ---------------------------------------------------------------------------
export function Skeleton({ className = '', style }: { className?: string; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(0.55);
  useEffect(() => {
    if (!reduced) o.set(withRepeat(withTiming(1, { duration: 850 }), -1, true));
  }, [o, reduced]);
  const a = useAnimatedStyle(() => ({ opacity: o.get() }));
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className={`overflow-hidden rounded-2xl ${className}`} style={style}>
      <AView style={[StyleSheet.absoluteFill, { backgroundColor: C.creamDark }, a]} />
    </View>
  );
}

export function EmptyState({ icon: Icon, title, message, action }: { icon: LucideIcon; title: string; message?: string; action?: ReactNode }) {
  return (
    <View className="items-center px-8 py-14">
      <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-forest-100">
        <Icon size={40} color={C.forest} strokeWidth={1.4} />
      </View>
      <Display className="text-center text-2xl">{title}</Display>
      {message ? <Txt className="mt-2 text-center text-[15px] leading-6 text-ink-soft">{message}</Txt> : null}
      {action ? <View className="mt-6 w-full max-w-xs gap-3">{action}</View> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry, title = "Something didn't load" }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <View accessibilityRole="alert" className="mx-5 my-8 items-center rounded-3xl border border-danger/15 bg-danger-tint/50 px-6 py-8">
      <Display className="text-center text-xl">{title}</Display>
      <Txt className="mt-2 text-center text-sm text-ink-soft">{errorMessage(error)}</Txt>
      {onRetry ? <Button title="Try again" icon={RotateCw} variant="outline" size="sm" onPress={onRetry} className="mt-5" /> : null}
    </View>
  );
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'forest' | 'terracotta' | 'neutral' | 'success' | 'warning' | 'danger' | 'dark'; className?: string }) {
  const map = {
    forest: ['bg-forest-100', 'text-forest-800'],
    terracotta: ['bg-terracotta-500', 'text-white'],
    neutral: ['bg-cream-dark', 'text-ink-soft'],
    success: ['bg-success-tint', 'text-success'],
    warning: ['bg-warning-tint', 'text-warning'],
    danger: ['bg-danger-tint', 'text-danger'],
    dark: ['bg-ink/85', 'text-white'],
  }[tone];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${map[0]} ${className}`}>
      <Txt weight="semibold" className={`text-[11px] ${map[1]}`}>
        {children}
      </Txt>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Headers & layout
// ---------------------------------------------------------------------------
export function ScreenHeader({ title, right, back = true, transparent, onBack }: { title?: string; right?: ReactNode; back?: boolean; transparent?: boolean; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 4 }} className={`px-3 pb-2 ${transparent ? '' : 'border-b border-line/60 bg-cream'}`}>
      <View className="h-12 flex-row items-center">
        <View className="w-14 items-start">
          {back ? <IconButton icon={ChevronLeft} label="Go back" tone={transparent ? 'glass' : 'plain'} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} /> : null}
        </View>
        <View className="flex-1 items-center">
          {title ? (
            <Txt weight="semibold" className="text-[16px]" numberOfLines={1} accessibilityRole="header">
              {title}
            </Txt>
          ) : null}
        </View>
        <View className="min-w-14 flex-row items-center justify-end">{right}</View>
      </View>
    </View>
  );
}

export function SectionHeader({ eyebrow, title, action, onAction, className = '' }: { eyebrow?: string; title: string; action?: string; onAction?: () => void; className?: string }) {
  return (
    <View className={`mb-4 flex-row items-end justify-between px-5 ${className}`}>
      <View className="flex-1 pr-3">
        {eyebrow ? <Txt weight="semibold" className="mb-1 text-[11px] uppercase tracking-[2px] text-terracotta-600">{eyebrow}</Txt> : null}
        <Display className="text-[24px] leading-[30px]">{title}</Display>
      </View>
      {action && onAction ? (
        <PressableScale onPress={onAction} hitSlop={8} accessibilityLabel={`${action}: ${title}`}>
          <Txt weight="semibold" className="text-[13px] text-forest-700">
            {action} →
          </Txt>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: ViewStyle }) {
  return (
    <View className={`rounded-3xl border border-line/70 bg-white p-5 ${className}`} style={style}>
      {children}
    </View>
  );
}

export function Row({ label, value, strong, valueClassName = '' }: { label: string; value: ReactNode; strong?: boolean; valueClassName?: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Txt weight={strong ? 'semibold' : 'regular'} className={strong ? 'text-base' : 'text-[14px] text-ink-soft'}>
        {label}
      </Txt>
      {typeof value === 'string' ? (
        <Txt weight={strong ? 'bold' : 'medium'} className={`${strong ? 'text-base' : 'text-[14px]'} ${valueClassName}`}>
          {value}
        </Txt>
      ) : (
        value
      )}
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center py-20" accessibilityLabel="Loading">
      <ActivityIndicator color={C.forest} />
    </View>
  );
}
