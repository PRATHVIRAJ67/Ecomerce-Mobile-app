import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
      staleTime: 30_000,
    },
  },
});

// Refetch stale data when the app returns to the foreground (React Native has no window focus).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
  onlineManager.setOnline(true);
}
