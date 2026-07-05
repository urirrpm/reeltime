import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Capa de notificaciones push (Expo). El flujo es:
 *   1. Pedimos permiso al SO y obtenemos el "Expo push token" del dispositivo.
 *   2. Guardamos ese token en la tabla `push_tokens` (upsert por token).
 *   3. Un cron en el servidor cruza TMDB y envía a esos tokens vía Expo Push.
 *
 * Nota Expo Go: en iOS (SDK 54) las push remotas funcionan en Expo Go; en
 * Android hacen falta builds de desarrollo. Por eso todo esto degrada con
 * elegancia (devuelve null) si no hay dispositivo/permiso/projectId.
 */

// Cómo se muestran las notificaciones con la app en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** El projectId de EAS es obligatorio para pedir un token. Lo escribe `eas init`. */
function getProjectId(): string | undefined {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId
  );
}

/**
 * Pide permiso (si hace falta) y devuelve el Expo push token, o null si no se
 * puede (simulador, permiso denegado, falta projectId, red...).
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // los simuladores no reciben push remotas

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Nuevos episodios',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId = getProjectId();
  if (!projectId) {
    console.warn(
      '[push] Falta projectId de EAS. Ejecuta `eas init` para poder registrar el token.',
    );
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (e) {
    console.warn('[push] No se pudo obtener el token:', e);
    return null;
  }
}

/** Guarda (upsert) el token del dispositivo para el usuario actual. */
export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  if (error) throw error;
}

/** Elimina el token de este dispositivo (al desactivar avisos o cerrar sesión). */
export async function deletePushToken(token: string) {
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);
  if (error) throw error;
}

/** Permiso del SO ya concedido (sin volver a preguntar). */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
