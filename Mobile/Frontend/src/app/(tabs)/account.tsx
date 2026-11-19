import { router, type Href } from 'expo-router';
import { Bell, ChevronRight, FileText, Headphones, Heart, Info, LogOut, MapPin, Package, Pencil, type LucideIcon } from 'lucide-react-native';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '@/components/layout/BrandSplash';
import { useTabBarSpace } from '@/components/layout/TabBar';
import { Button, Display, Eyebrow, PressableScale, Skeleton, Txt } from '@/components/ui';
import { auth, useAuth } from '@/hooks/useAuth';
import { useOrderUpdates } from '@/hooks/useNotifications';
import { useWishlistCount } from '@/hooks/useWishlist';
import { formatDate } from '@/lib/format';
import { useOrderList } from '@/lib/queries';
import { C } from '@/lib/theme';
import { toast } from '@/store';

function MenuRow({ icon: Icon, label, hint, href, badge, last }: { icon: LucideIcon; label: string; hint?: string; href: Href; badge?: number; last?: boolean }) {
  return (
    <PressableScale onPress={() => router.push(href)} scaleTo={0.99} accessibilityLabel={`${label}${badge ? `, ${badge} new` : ''}`} className={`flex-row items-center gap-3.5 px-4 py-3.5 ${last ? '' : 'border-b border-line/60'}`}>
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-forest-50">
        <Icon size={18} color={C.forest} />
      </View>
      <View className="flex-1">
        <Txt weight="medium" className="text-[15px]">
          {label}
        </Txt>
        {hint ? <Txt className="text-[12px] text-muted">{hint}</Txt> : null}
      </View>
      {badge ? (
        <View className="h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5">
          <Txt weight="bold" className="text-[11px] text-white">
            {badge}
          </Txt>
        </View>
      ) : null}
      <ChevronRight size={18} color={C.muted} />
    </PressableScale>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mx-5 mt-6">
      <Txt weight="semibold" className="mb-2 ml-1 text-[11px] uppercase tracking-[2px] text-muted">
        {title}
      </Txt>
      <View className="overflow-hidden rounded-3xl border border-line/70 bg-white">{children}</View>
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const { isSignedIn, profile, email, ready } = useAuth();
  const orders = useOrderList(isSignedIn);
  const { unread } = useOrderUpdates();
  const saved = useWishlistCount();
  const name = profile?.full_name || email?.split('@')[0] || '';

  const help = (
    <Group title="Help & information">
      <MenuRow icon={Headphones} label="Customer support" hint="FAQs, email and phone" href="/support" />
      <MenuRow icon={Info} label="About URU" href="/about" />
      <MenuRow icon={FileText} label="Policies" hint="Shipping, returns, privacy, terms" href="/policies" last />
    </Group>
  );

  if (!ready) return <Skeleton style={{ margin: 20, marginTop: insets.top + 20, height: 220, borderRadius: 30 }} />;

  if (!isSignedIn) {
    return (
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom + 8 }}>
        <View className="mx-5 overflow-hidden rounded-[30px] bg-forest-700 p-6">
          <View className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-terracotta-500/25" />
          <LogoMark size={48} />
          <Display className="mt-6 text-[30px] leading-[36px] text-cream">Bring a little of home to every meal.</Display>
          <Txt className="mt-3 text-[14px] leading-[21px] text-cream/75">Sign in to check out, track orders, save addresses and keep your cart on every device.</Txt>
          <View className="mt-6 gap-3">
            <Button title="Sign in" variant="accent" onPress={() => router.push('/login')} />
            <Button title="Create an account" variant="light" onPress={() => router.push('/register')} />
          </View>
        </View>
        {help}
      </ScrollView>
    );
  }

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'Your cart and wishlist stay saved in your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await auth.signOut();
          toast.info('Signed out');
        },
      },
    ]);

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom + 8 }}>
      <View className="px-5">
        <Eyebrow>Your account</Eyebrow>
        <View className="mt-3 flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-forest-700">
            <Txt className="font-display text-[28px] text-cream">{(name || '?').charAt(0).toUpperCase()}</Txt>
          </View>
          <View className="flex-1">
            <Display className="text-[26px] leading-[30px]" numberOfLines={1}>
              {name || 'Welcome'}
            </Display>
            <Txt className="text-[13px] text-muted" numberOfLines={1}>
              {email}
            </Txt>
          </View>
          <PressableScale onPress={() => router.push('/profile')} accessibilityLabel="Edit profile" className="h-10 w-10 items-center justify-center rounded-full border border-line bg-white">
            <Pencil size={16} color={C.forestDeep} />
          </PressableScale>
        </View>

        <View className="mt-5 flex-row gap-3">
          <Stat label="Orders" value={orders.data ? String(orders.data.pages[0]?.total ?? 0) : undefined} onPress={() => router.push('/orders')} />
          <Stat label="Saved" value={String(saved)} onPress={() => router.push('/wishlist')} />
          <Stat label="Member since" value={profile ? formatDate(profile.created_at).split(' ').slice(1).join(' ') : undefined} />
        </View>
      </View>

      <Group title="Shopping">
        <MenuRow icon={Package} label="Your orders" hint="Track, cancel or pay" href="/orders" />
        <MenuRow icon={Bell} label="Notifications" hint="Order updates" href="/notifications" badge={unread} />
        <MenuRow icon={Heart} label="Wishlist" href="/wishlist" />
        <MenuRow icon={MapPin} label="Addresses" hint="Manage delivery addresses" href="/addresses" last />
      </Group>
      {help}
      <View className="mx-5 mt-6">
        <Button title="Sign out" icon={LogOut} variant="danger" onPress={confirmSignOut} />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} disabled={!onPress} accessibilityLabel={`${label}: ${value ?? 'loading'}`} className="flex-1 rounded-2xl border border-line/70 bg-white p-3.5">
      {value === undefined ? <Skeleton style={{ height: 22, width: 40, borderRadius: 6 }} /> : <Txt weight="bold" className="text-[18px]" numberOfLines={1}>{value}</Txt>}
      <Txt className="mt-0.5 text-[11.5px] text-muted">{label}</Txt>
    </PressableScale>
  );
}
