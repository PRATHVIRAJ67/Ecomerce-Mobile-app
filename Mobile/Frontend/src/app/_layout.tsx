import '../global.css';
import { Fraunces_500Medium, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBootstrap } from '@/components/layout/AppBootstrap';
import { BrandSplash } from '@/components/layout/BrandSplash';
import { Toaster } from '@/components/ui/Toaster';
import { queryClient } from '@/lib/queryClient';
import { C } from '@/lib/theme';
import { useAuthStore, usePrefs } from '@/store';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = { initialRouteName: '(tabs)' };

function usePrefsHydrated() {
  const [hydrated, setHydrated] = useState(() => usePrefs.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    return usePrefs.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrated = usePrefsHydrated();
  const authReady = useAuthStore((s) => s.initialised);
  const [timedOut, setTimedOut] = useState(false);

  // Never keep the user on the splash for long, even if storage is slow.
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const shellReady = (fontsLoaded || Boolean(fontError)) && hydrated;
  const ready = shellReady && (authReady || timedOut);

  useEffect(() => {
    if (shellReady) void SplashScreen.hideAsync().catch(() => undefined);
  }, [shellReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.cream }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AppBootstrap />
          {shellReady ? (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: C.cream },
                animation: 'slide_from_right',
                gestureEnabled: true,
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="search" options={{ animation: 'fade_from_bottom' }} />
              <Stack.Screen name="(auth)" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="payment/[id]" options={{ gestureEnabled: false }} />
              <Stack.Screen name="order-confirmed/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
            </Stack>
          ) : (
            <View style={{ flex: 1, backgroundColor: C.forest }} />
          )}
          <Toaster />
          <BrandSplash ready={ready} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
