import * as Haptics from 'expo-haptics';

/**
 * Feedback háptico sutil para las acciones clave (marcar visto, votar, valorar).
 * Envuelto en try/catch porque en web o simulador puede no estar disponible.
 */
export const haptics = {
  light: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  selection: () => Haptics.selectionAsync().catch(() => {}),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    ),
};
