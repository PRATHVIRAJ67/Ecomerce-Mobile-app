import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Address, Banner, Category, Order, Paginated, ProductCard, ProductDetail } from '@ecommerce/shared';
import { api } from './api';

/** Same public settings the website reads (GET /catalog/settings). */
export interface StoreSettings {
  store_name?: string;
  store_tagline?: string;
  support_email?: string;
  support_phone?: string;
  shipping_fee?: number;
  free_shipping_threshold?: number;
  cod_enabled?: boolean;
  cod_max_order_value?: number;
  online_payments_enabled?: boolean;
  online_payments_available?: boolean;
  max_quantity_per_item?: number;
  maintenance_mode?: boolean;
}

export interface HomeFeed {
  banners: Banner[];
  categories: Category[];
  featured: ProductCard[];
  trending: ProductCard[];
  best_sellers: ProductCard[];
  new_arrivals: ProductCard[];
  settings: StoreSettings;
}

export type SortKey = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'name' | 'popular';

export interface ProductFilters {
  q?: string;
  category?: string;
  sort?: SortKey;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  featured?: boolean;
}

export const keys = {
  home: ['catalog', 'home'] as const,
  settings: ['catalog', 'settings'] as const,
  categories: ['catalog', 'categories'] as const,
  products: (f: ProductFilters, limit: number) => ['catalog', 'products', f, limit] as const,
  product: (slug: string) => ['catalog', 'product', slug] as const,
  lookup: (ids: string[]) => ['catalog', 'lookup', ids] as const,
  orders: ['me', 'orders'] as const,
  order: (id: string) => ['me', 'order', id] as const,
  addresses: ['me', 'addresses'] as const,
  cart: ['me', 'cart'] as const,
  wishlist: ['me', 'wishlist'] as const,
  profile: ['me', 'profile'] as const,
};

const CATALOG_STALE = 60_000;
const filterQuery = (f: ProductFilters) => ({
  q: f.q,
  category: f.category,
  sort: f.sort,
  min_price: f.min_price,
  max_price: f.max_price,
  in_stock: f.in_stock ? 'true' : undefined,
  featured: f.featured ? 'true' : undefined,
});

export const useHome = () => useQuery({ queryKey: keys.home, queryFn: () => api.get<HomeFeed>('/catalog/home'), staleTime: CATALOG_STALE });

export const useSettings = () =>
  useQuery({ queryKey: keys.settings, queryFn: () => api.get<StoreSettings>('/catalog/settings'), staleTime: 5 * 60_000 });

export const useCategories = () =>
  useQuery({ queryKey: keys.categories, queryFn: () => api.get<Category[]>('/catalog/categories'), staleTime: 5 * 60_000 });

/** A single page — used for search suggestions and small rails. */
export function useProducts(f: ProductFilters, limit = 12, enabled = true) {
  return useQuery({
    queryKey: keys.products(f, limit),
    queryFn: () => api.get<Paginated<ProductCard>>('/catalog/products', { ...filterQuery(f), page: 1, limit }),
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE,
    enabled,
  });
}

/** Infinite scrolling product list. */
export function useProductList(f: ProductFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: ['catalog', 'product-list', f, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Paginated<ProductCard>>('/catalog/products', { ...filterQuery(f), page: pageParam, limit }),
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    staleTime: CATALOG_STALE,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: keys.product(slug ?? ''),
    queryFn: () => api.get<ProductDetail>(`/catalog/products/${encodeURIComponent(slug!)}`),
    enabled: Boolean(slug),
    staleTime: 30_000,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}

export type OrderListItem = Order & { items?: { product_name: string; image_url: string | null; quantity: number }[] };

export function useOrderList(enabled = true) {
  return useInfiniteQuery({
    queryKey: keys.orders,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Paginated<OrderListItem>>('/me/orders', { page: pageParam, limit: 10 }),
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    enabled,
  });
}

export function useOrder(id: string | undefined, poll = false) {
  return useQuery({
    queryKey: keys.order(id ?? ''),
    queryFn: () => api.get<Order>(`/me/orders/${id}`),
    enabled: Boolean(id),
    refetchInterval: poll ? 30_000 : false,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}

export function useAddresses(enabled = true) {
  return useQuery({ queryKey: keys.addresses, queryFn: () => api.get<Address[]>('/me/addresses'), enabled });
}
