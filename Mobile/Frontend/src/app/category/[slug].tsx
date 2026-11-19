import { router, useLocalSearchParams } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { View } from 'react-native';
import { ProductListing } from '@/components/ProductListing';
import { Button, EmptyState, Loading, ScreenHeader } from '@/components/ui';
import { useCategories } from '@/lib/queries';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isPending } = useCategories();
  const category = data?.find((c) => c.slug === slug);

  if (isPending) return <Loading />;
  if (!category) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader />
        <EmptyState icon={Compass} title="Category not found" message="It may have been renamed or is no longer available." action={<Button title="Explore categories" onPress={() => router.replace('/explore')} />} />
      </View>
    );
  }
  return <ProductListing key={slug} initial={{ category: slug }} title={category.name} description={category.description} categorySlug={slug} />;
}
