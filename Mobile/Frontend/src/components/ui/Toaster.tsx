import { router } from 'expo-router';
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/lib/theme';
import { useToastStore } from '@/store';
import { AView } from './animated';
import { Txt } from './Text';

/** Global toasts (top of screen, under the status bar). Announced to screen readers. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 z-50 items-center gap-2 px-4" style={{ top: insets.top + 8 }}>
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CircleCheck : t.tone === 'error' ? TriangleAlert : Info;
        return (
          <AView
            key={t.id}
            entering={FadeInUp.springify().damping(18)}
            exiting={FadeOutUp.duration(180)}
            layout={LinearTransition}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            className={`w-full max-w-md flex-row items-center gap-3 rounded-2xl px-4 py-3 ${t.tone === 'error' ? 'bg-danger' : 'bg-forest-800'}`}
            style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
          >
            <Icon size={18} color={t.tone === 'success' ? C.terracotta200 : C.cream} />
            <Txt weight="medium" className="flex-1 text-[14px] leading-5 text-cream">
              {t.message}
            </Txt>
            {t.action ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  dismiss(t.id);
                  router.push(t.action!.href as never);
                }}
              >
                <Txt weight="bold" className="text-[13px] text-terracotta-200">
                  {t.action.label}
                </Txt>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8} onPress={() => dismiss(t.id)}>
                <X size={16} color={C.cream} />
              </Pressable>
            )}
          </AView>
        );
      })}
    </View>
  );
}
