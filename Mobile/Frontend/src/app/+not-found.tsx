import { router } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { View } from 'react-native';
import { Button, EmptyState, ScreenHeader } from '@/components/ui';

export default function NotFound() {
  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader />
      <EmptyState icon={Compass} title="This path leads nowhere" message="The screen you're looking for doesn't exist or has moved." action={<Button title="Back to home" onPress={() => router.replace('/')} />} />
    </View>
  );
}
