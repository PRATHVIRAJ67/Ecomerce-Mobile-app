# Ecomerce-Mobile-app — URU for Android & iOS

Expo SDK 58 · React Native 0.88 · Expo Router · NativeWind · TanStack Query · Zustand.
Uses the live Commerce API (https://uru-api.prathviholla67.workers.dev) and the same Supabase project as the website.

```bash
cd Mobile/Frontend
npm install
cp .env.example .env     # EXPO_PUBLIC_* values (publishable only)
npx expo start           # scan the QR code with Expo Go
```

`Shared/` (types, zod validation, design tokens) is resolved by `Mobile/Frontend/metro.config.js`.
See [Mobile/Frontend/README.md](Mobile/Frontend/README.md) and [Mobile/Frontend/TODO.md](Mobile/Frontend/TODO.md).
