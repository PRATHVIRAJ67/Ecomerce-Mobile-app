import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Thin wrapper so haptics are a no-op on web and never throw. */
const safe = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => undefined);
};

export const haptic = {
  tap: () => safe(() => Haptics.selectionAsync()),
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
