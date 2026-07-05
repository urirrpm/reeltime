/**
 * Variables de entorno. En Expo, cualquier variable con el prefijo
 * `EXPO_PUBLIC_` se inyecta en el bundle en tiempo de compilación y es
 * accesible vía `process.env`. Se definen en el fichero `.env` (ver `.env.example`).
 */
export const ENV = {
  /** TMDB "API Read Access Token" (v4, se usa como Bearer). */
  tmdbAccessToken: process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN ?? '',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export const hasTmdb = () => ENV.tmdbAccessToken.length > 0;
export const hasSupabase = () =>
  ENV.supabaseUrl.length > 0 && ENV.supabaseAnonKey.length > 0;
