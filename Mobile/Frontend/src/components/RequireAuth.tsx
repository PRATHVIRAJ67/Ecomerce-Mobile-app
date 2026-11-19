import { router, usePathname } from 'expo-router';
import { Lock } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button, EmptyState, Loading, ScreenHeader } from './ui';

/** Gate for account-only screens. Guests get a friendly sign-in prompt that returns them here. */
export function RequireAuth({ children, title }: { children: ReactNode; title?: string }) {
  const { ready, isSignedIn } = useAuth();
  const pathname = usePathname();
  if (!ready) return <Loading />;
  if (!isSignedIn) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title={title} />
        <EmptyState icon={Lock} title="Please sign in" message="Sign in to see this page. Your cart and wishlist come with you." action={<Button title="Sign in" onPress={() => router.push({ pathname: '/login', params: { next: pathname } })} />} />
      </View>
    );
  }
  return <>{children}</>;
}
