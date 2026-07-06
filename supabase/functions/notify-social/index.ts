// ============================================================================
// notify-social · Edge Function (Deno)
// ----------------------------------------------------------------------------
// Envía por push las notificaciones sociales pendientes (pushed = false):
// nuevos seguidores y "me gusta" en comentarios. La invoca pg_cron cada pocos
// minutos. Las notificaciones in-app las crean triggers en la BD; aquí solo se
// entrega la push y se marca pushed = true.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CRON_SECRET = Deno.env.get('CRON_SECRET')!;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
}

function messageFor(n: any): { title: string; body: string } {
  const user = `@${n.actor?.username ?? 'alguien'}`;
  if (n.type === 'follow') {
    return { title: 'Nuevo seguidor', body: `${user} empezó a seguirte` };
  }
  return { title: 'Nuevo me gusta', body: `A ${user} le gustó tu comentario` };
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('No autorizado', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: notifs, error } = await supabase
    .from('notifications')
    .select(
      'id, recipient_id, actor_id, type, tmdb_id, media_type, season_number, episode_number, actor:profiles!actor_id(username)',
    )
    .eq('pushed', false)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (!notifs || notifs.length === 0) {
    return Response.json({ pending: 0 });
  }

  // Tokens de los destinatarios.
  const recipientIds = [...new Set(notifs.map((n) => n.recipient_id))];
  const { data: tokenRows } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', recipientIds);
  const tokensByUser = new Map<string, string[]>();
  for (const r of tokenRows ?? []) {
    if (!tokensByUser.has(r.user_id)) tokensByUser.set(r.user_id, []);
    tokensByUser.get(r.user_id)!.push(r.token);
  }

  const messages: ExpoMessage[] = [];
  const tokenOfMessage: string[] = [];
  for (const n of notifs) {
    const tokens = tokensByUser.get(n.recipient_id) ?? [];
    if (tokens.length === 0) continue;
    const { title, body } = messageFor(n);
    const data =
      n.type === 'follow'
        ? { type: 'follow', userId: n.actor_id }
        : {
            type: 'comment_like',
            tvId: n.tmdb_id,
            mediaType: n.media_type,
            season: n.season_number,
            episode: n.episode_number,
          };
    for (const token of tokens) {
      messages.push({ to: token, title, body, data, sound: 'default' });
      tokenOfMessage.push(token);
    }
  }

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
      (json?.data ?? []).forEach((t: any, idx: number) => {
        if (t?.status === 'error' && t?.details?.error === 'DeviceNotRegistered') {
          deadTokens.push(batchTokens[idx]);
        }
      });
    } catch (e) {
      console.error('[social] error enviando lote:', e);
    }
  }

  // Marca como enviadas TODAS (aunque el destinatario no tuviera token) para no
  // reintentar indefinidamente.
  await supabase
    .from('notifications')
    .update({ pushed: true })
    .in(
      'id',
      notifs.map((n) => n.id),
    );

  if (deadTokens.length > 0) {
    await supabase.from('push_tokens').delete().in('token', deadTokens);
  }

  return Response.json({
    pending: notifs.length,
    pushes: messages.length,
    removedTokens: deadTokens.length,
  });
});
