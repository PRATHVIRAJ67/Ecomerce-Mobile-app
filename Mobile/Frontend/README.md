# URU Mobile (Android + iOS)

Customer shopping app for URU. Expo SDK 58 · React Native 0.88 · Expo Router · NativeWind 4 · TanStack Query · Zustand · Reanimated 4.

It uses the **same backend and database** as the website: `Admin/Backend` (`/api/v1/catalog/*`, `/api/v1/me/*`) on the shared Supabase project. Types and zod validation come from `Shared/` (`@ecommerce/shared`).

## Run

```bash
# 1. Start the API (from the repo root)
npm run dev:admin-api

# 2. Start the app (from Mobile/Frontend — this is a standalone npm project, not a root workspace)
cd Mobile/Frontend
npm install
npx expo start          # scan the QR code with Expo Go, or press a / i for an emulator
```

In development the app reaches the API at `http://<your computer's LAN IP>:4000/api/v1` automatically (derived from the Expo dev server host), so a real phone on the same Wi‑Fi works without config. Set `EXPO_PUBLIC_API_URL` for staging/production.

| Command | |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (expo config, React Compiler rules) |
| `npm run doctor` | `expo-doctor` |
| `npm run export:android` / `export:ios` | Production JS bundle (Metro) |
| `npx eas-cli@latest build --profile development` | Dev build (needed for native modules not in Expo Go) |

## Why it's not a root npm workspace
Expo pins exact React / React Native versions (`react@19.3.0`, `react-native@0.88.1`), while the web apps float on `react@^19`. Keeping mobile standalone avoids changing hoisting for the Website/Admin/Super Admin apps. `metro.config.js` watches `../../Shared` and resolves Shared's bare imports (e.g. `zod`) from this app's `node_modules`, so there's one copy of every dependency in the bundle. `tsconfig.json` maps `@ecommerce/shared` → `../../Shared/index.ts`.

## Structure
```
src/app/                 Expo Router routes
  (tabs)/                Home · Explore · Saved · Cart · You  (custom animated tab bar)
  (auth)/                login · register · otp · forgot-password · new-password  (modal stack)
  product/[slug]  category/[slug]  products  search
  checkout  payment/[id]  order-confirmed/[id]  orders/  addresses/
  notifications  profile  support  about  policies/  onboarding
src/components/          ui/ (Txt, Button, Sheet, Toaster, Skeleton…), product/, home/, layout/
src/hooks/               useAuth, useCart, useWishlist, useNotifications
src/lib/                 api, supabase (SecureStore session), queries, razorpayHtml, theme, haptics
src/store/               Zustand: prefs, guest cart/wishlist, session, toasts
```

## Security
- Only the **publishable** Supabase key is in the app. The session is stored in the iOS Keychain / Android Keystore via `expo-secure-store` (chunked, because sessions exceed SecureStore's 2 KB value limit).
- Prices, stock, totals and shipping are always computed by the API. The guest cart is priced by `POST /catalog/cart-preview`; checkout re-prices and locks stock in a DB transaction.
- Razorpay runs Standard Checkout inside a WebView with only the per-order public `key_id`; the payment signature is verified by `POST /me/orders/:id/verify-payment` before the order is marked paid (the webhook is the backstop).
