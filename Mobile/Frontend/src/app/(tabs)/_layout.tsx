import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/components/layout/TabBar';
import { usePrefs } from '@/store';

export default function TabsLayout() {
  const onboarded = usePrefs((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, animation: 'shift' }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Saved' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
      <Tabs.Screen name="account" options={{ title: 'You' }} />
    </Tabs>
  );
}
