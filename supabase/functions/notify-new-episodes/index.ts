// ============================================================================
// notify-new-episodes · Edge Function (Deno)
// ----------------------------------------------------------------------------
// Cron autónomo: se ejecuta una vez al día y avisa a cada usuario cuando se
// estrena (HOY, hora de Madrid) un nuevo episodio de una serie que sigue.
//
// Flujo:
//   1. Lee todas las series ('tv') seguidas (tracked_items) y sus seguidores.
//   2. Consulta TMDB `next_episode_to_air` de cada serie (una vez por serie).
//   3. Si el episodio se estrena hoy, para cada seguidor con push token:
//      reclama el aviso en `notified_episodes` (dedupe) y lo envía por Expo Push.
//
// Seguridad: no verifica JWT (se despliega con --no-verify-jwt) pero exige la
// cabecera `x-cron-secret`. Usa la service_role key (salta RLS) para leer todos
// los tokens y escribir los avisos.
//
// Variables de entorno (supabase secrets set ...):
//   TMDB_ACCESS_TOKEN  · token v4 de TMDB (Bearer)
//   CRON_SECRET        · secreto compartido con el cron que la invoca
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY · inyectadas por la plataforma
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TMDB_TOKEN = Deno.env.get('TMDB_ACCESS_TOKEN')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria de Madrid. */
function todayInMadrid(): string {
  // en-CA da formato ISO (YYYY-MM-DD).
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
  }).format(new Date());
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
}

Deno.serve(async (req) => {
  // --- Autenticación del cron -------------------------------------------------
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('No autorizado', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = todayInMadrid();

  // --- 1. Series seguidas + seguidores ---------------------------------------
  const { data: tracked, error: trackedErr } = await supabase
    .from('tracked_items')
    .select('user_id, tmdb_id, title')
    .eq('media_type', 'tv');
  if (trackedErr) {
    return Response.json({ error: trackedErr.message }, { status: 500 });
  }

  // tmdb_id -> Set<user_id>
  const followersByShow = new Map<number, Set<string>>();
  for (const t of tracked ?? []) {
    if (!followersByShow.has(t.tmdb_id)) followersByShow.set(t.tmdb_id, new Set());
    followersByShow.get(t.tmdb_id)!.add(t.user_id);
  }

  // --- 2. Tokens por usuario --------------------------------------------------
  const { data: tokenRows, error: tokenErr } = await supabase
    .from('push_tokens')
    .select('user_id, token');
  if (tokenErr) {
    return Response.json({ error: tokenErr.message }, { status: 500 });
  }
  const tokensByUser = new Map<string, string[]>();
  for (const r of tokenRows ?? []) {
    if (!tokensByUser.has(r.user_id)) tokensByUser.set(r.user_id, []);
    tokensByUser.get(r.user_id)!.push(r.token);
  }

  // --- 3. Para cada serie: ¿estrena hoy? -------------------------------------
  // candidatos: un aviso pendiente por (usuario, episodio) con texto asociado.
  interface Candidate {
    user_id: string;
    tv_id: number;
    season_number: number;
    episode_number: number;
    title: string;
    body: string;
  }
  const candidates: Candidate[] = [];

  for (const [tmdbId, followers] of followersByShow) {
    // Nadie con token siguiendo esta serie -> ni consultamos TMDB.
    const withTokens = [...followers].filter((u) => tokensByUser.has(u));
    if (withTokens.length === 0) continue;

    let detail: any;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbId}?language=es-ES`,
        { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } },
      );
      if (!res.ok) continue;
      detail = await res.json();
    } catch {
      continue;
    }

    const next = detail?.next_episode_to_air;
    if (!next?.air_date || next.air_date !== today) continue;

    const seriesName = detail?.name ?? 'una serie que sigues';
    const epLabel = `T${next.season_number}E${next.episode_number}`;
    const epName = next.name ? ` · ${next.name}` : '';

    for (const userId of withTokens) {
      candidates.push({
        user_id: userId,
        tv_id: tmdbId,
        season_number: next.season_number,
        episode_number: next.episode_number,
        title: `Nuevo episodio de ${seriesName}`,
        body: `Ya disponible: ${epLabel}${epName}`,
      });
    }
  }

  if (candidates.length === 0) {
    return Response.json({ date: today, sent: 0, note: 'sin estrenos hoy' });
  }

  // --- 4. Dedupe: reclamar avisos en notified_episodes -----------------------
  // upsert con ignoreDuplicates -> select() devuelve SOLO las filas nuevas.
  const { data: claimed, error: claimErr } = await supabase
    .from('notified_episodes')
    .upsert(
      candidates.map((c) => ({
        user_id: c.user_id,
        tv_id: c.tv_id,
        season_number: c.season_number,
        episode_number: c.episode_number,
      })),
      {
        onConflict: 'user_id,tv_id,season_number,episode_number',
        ignoreDuplicates: true,
      },
    )
    .select('user_id, tv_id, season_number, episode_number');
  if (claimErr) {
    return Response.json({ error: claimErr.message }, { status: 500 });
  }

  // Índice de candidatos por clave, para recuperar el texto de los recién reclamados.
  const key = (c: {
    user_id: string;
    tv_id: number;
    season_number: number;
    episode_number: number;
  }) => `${c.user_id}|${c.tv_id}|${c.season_number}|${c.episode_number}`;
  const byKey = new Map(candidates.map((c) => [key(c), c]));

  // --- 5. Construir mensajes Expo (uno por token) ----------------------------
  const messages: ExpoMessage[] = [];
  const tokenOfMessage: string[] = []; // paralelo a messages, para limpiar bajas
  for (const row of claimed ?? []) {
    const c = byKey.get(key(row));
    if (!c) continue;
    for (const token of tokensByUser.get(c.user_id) ?? []) {
      messages.push({
        to: token,
        title: c.title,
        body: c.body,
        data: { type: 'new_episode', tvId: c.tv_id },
        sound: 'default',
      });
      tokenOfMessage.push(token);
    }
  }

  // --- 6. Enviar en lotes de 100 y limpiar tokens dados de baja ---------------
  const deadTokens: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const batchTokens = tokenOfMessage.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(batch),
      });
      const json = await res.json();
      const tickets = json?.data ?? [];
      tickets.forEach((t: any, idx: number) => {
        if (t?.status === 'error' && t?.details?.error === 'DeviceNotRegistered') {
          deadTokens.push(batchTokens[idx]);
        }
      });
    } catch (e) {
      console.error('[push] error enviando lote:', e);
    }
  }

  if (deadTokens.length > 0) {
    await supabase.from('push_tokens').delete().in('token', deadTokens);
  }

  return Response.json({
    date: today,
    candidates: candidates.length,
    claimed: claimed?.length ?? 0,
    pushes: messages.length,
    removedTokens: deadTokens.length,
  });
});
