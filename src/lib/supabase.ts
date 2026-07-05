import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { ENV, hasSupabase } from '@/config/env';

/**
 * Cliente de Supabase. La sesión se persiste en AsyncStorage para que el
 * usuario siga logueado entre reinicios de la app. `detectSessionInUrl` va en
 * false porque en móvil no hay redirección por URL como en web.
 *
 * Si aún no has configurado Supabase (.env vacío), el cliente se crea igual
 * con valores placeholder; usa `isSupabaseConfigured` para no llamar sin config.
 */
export const isSupabaseConfigured = hasSupabase();

export const supabase = createClient(
  ENV.supabaseUrl || 'https://placeholder.supabase.co',
  ENV.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
