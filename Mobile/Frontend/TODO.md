# URU Mobile — status & TODO

_Last updated: 2026-11-19_

## ✅ Built and verified
- All 23 requested screens: splash (native + animated brand reveal), onboarding, login, registration, OTP verification, home, categories (Explore), product listing (+ filters/sort sheet, infinite scroll), product detail (gallery + pinch/double‑tap zoom viewer), search + live suggestions + recent searches, wishlist, cart, addresses (list/add/edit/default/delete), checkout, payment (Razorpay), order confirmation, order tracking, order history, profile (+ change password), notifications (order updates), support (FAQs, email, phone, WhatsApp), about, policies.
- Home: greeting header, delivery‑location selector (saved addresses), sticky search, hero carousel (`home_hero` banners, branded fallback), category grid, Trending, Best sellers, Featured collections, editorial story, Featured grid, promo strips (`home_strip`), New arrivals, Recommended (from cart/wishlist categories), trust strip, pull‑to‑refresh.
- Native feel: custom animated floating tab bar with badges, press‑scale on every tappable, wishlist heart pop, bottom sheets with drag‑to‑dismiss, toasts, skeletons, haptics, layout animations; all motion respects **Reduce Motion**.
- Guest cart/wishlist persisted on device and merged into the account on sign‑in (same API as the website).
- `npx tsc --noEmit` ✅ · `npx eslint src` ✅ · `expo-doctor` 20/20 ✅ · `expo export` Android ✅ iOS ✅ Web ✅.
- Rendered (web build in headless Chrome, against the real DB): onboarding, home, explore, category listing, product detail, guest cart with an out‑of‑stock line (checkout correctly blocked, server total excludes it), search, login, account.

## 🔴 Needs you
1. **Test on a real device**: `npm run dev:admin-api` (root) → `cd Mobile/Frontend && npx expo start` → open in Expo Go. Signed‑in flows (addresses, COD checkout, Razorpay, cancel, notifications) were **not** exercised end‑to‑end — they need a real customer account.
2. **Supabase email templates** (Auth → Email templates): add `{{ .Token }}` to *Confirm signup*, *Magic Link* and *Reset password* so customers receive the 6‑digit code the OTP screen expects (links alone don't return to the app).
3. **Razorpay**: add keys to `Admin/Backend/.env`; then run a sandbox payment on a phone (UPI intent links are handed to the OS from the WebView).
4. **Before release**: set `EXPO_PUBLIC_API_URL` to the production HTTPS API, create an EAS project (`npx eas-cli@latest init`), set bundle id/package (`in.uru.app` placeholder in `app.json`), add store screenshots, privacy policy URL.
5. Fill `support_email` / `support_phone` in Super Admin → Settings (Support screen hides empty channels).

## ⏭ Not built (backend support missing — no fake UI was added)
- **Coupons** — no coupons table/API yet (`orders.discount` exists). Add API, then a coupon field in checkout.
- **Product variants** and **customer reviews** — no tables/APIs.
- **Push notifications** — needs `device_tokens` table + `expo-notifications` registration + sender on order status change. The in‑app Notifications screen already shows real order updates.
- **Phone (SMS) OTP** — needs an SMS provider in Supabase Auth; email OTP is implemented.
- Deep links for auth emails (`uru://`) and universal links; image upload for profile avatar.
- Automated tests (Jest + React Native Testing Library, Maestro E2E for checkout).

## Dev notes
- `Admin/Backend/.env` `CORS_ORIGINS` now also allows `http://localhost:8081` (Expo web preview only — native apps send no Origin).
- Reanimated shared values use `.get()/.set()` (required with the React Compiler, enabled in `app.json`).
