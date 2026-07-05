import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  deletePushToken,
  getExpoPushToken,
  savePushToken,
} from '@/lib/push';
import { useAuth } from '@/providers/AuthProvider';

const PREF_KEY = 'reeltime_push_pref'; // 'on' | 'off' (a nivel de dispositivo)

interface PushContextValue {
  /** Si el usuario ha activado los avisos en este dispositivo. */
  enabled: boolean;
  /** Hay una operación en curso (registrar/borrar token). */
  busy: boolean;
  /** Activa o desactiva los avisos de nuevos episodios. */
  toggle: (value: boolean) => Promise<void>;
}

const PushContext = createContext<PushContextValue | null>(null);

export function PushProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef<string | null>(null);

  // Lee la preferencia guardada al arrancar.
  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY).then((v) => setEnabled(v === 'on'));
  }, []);

  // Si hay sesión y los avisos están activados, refresca el token (puede cambiar
  // entre reinstalaciones/actualizaciones) y lo vuelve a guardar.
  useEffect(() => {
    if (!session || !enabled) return;
    let cancelled = false;
    (async () => {
      const token = await getExpoPushToken();
      if (cancelled || !token) return;
      tokenRef.current = token;
      try {
        await savePushToken(session.user.id, token);
      } catch {
        // silencioso: si falla el guardado, se reintenta en el próximo arranque
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, enabled]);

  // Al tocar una notificación, navega al título correspondiente.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as {
        tvId?: number;
        type?: string;
      };
      if (data?.tvId) {
        router.push(`/title/tv/${data.tvId}`);
      }
    });
    return () => sub.remove();
  }, []);

  const toggle = useCallback(
    async (value: boolean) => {
      if (!session) return;
      setBusy(true);
      try {
        if (value) {
          const token = await getExpoPushToken();
          if (!token) {
            // Permiso denegado o sin projectId: no activamos.
            setEnabled(false);
            await AsyncStorage.setItem(PREF_KEY, 'off');
            return;
          }
          tokenRef.current = token;
          await savePushToken(session.user.id, token);
          setEnabled(true);
          await AsyncStorage.setItem(PREF_KEY, 'on');
        } else {
          if (tokenRef.current) {
            await deletePushToken(tokenRef.current).catch(() => {});
          }
          setEnabled(false);
          await AsyncStorage.setItem(PREF_KEY, 'off');
        }
      } finally {
        setBusy(false);
      }
    },
    [session],
  );

  return (
    <PushContext.Provider value={{ enabled, busy, toggle }}>
      {children}
    </PushContext.Provider>
  );
}

export function usePush() {
  const ctx = useContext(PushContext);
  if (!ctx) throw new Error('usePush debe usarse dentro de <PushProvider>');
  return ctx;
}
