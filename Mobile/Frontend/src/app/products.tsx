import { useLocalSearchParams } from 'expo-router';
import { ProductListing } from '@/components/ProductListing';
import type { SortKey } from '@/lib/queries';

const SORTS: SortKey[] = ['relevance', 'newest', 'price_asc', 'price_desc', 'name', 'popular'];

/** /products?q=&sort=&featured=&title= — all products, search results, curated lists. */
export default function ProductsScreen() {
  const p = useLocalSearchParams<{ q?: string; sort?: string; featured?: string; in_stock?: string; title?: string }>();
  const sort = SORTS.includes(p.sort as SortKey) ? (p.sort as SortKey) : undefined;
  const q = p.q?.trim() || undefined;
  return (
    <ProductListing
      key={JSON.stringify(p)}
      initial={{ q, sort, featured: p.featured === 'true' || undefined, in_stock: p.in_stock === 'true' || undefined }}
      title={p.title ?? (q ? `“${q}”` : 'All products')}
    />
  );
}
