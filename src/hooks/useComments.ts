import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { containsBannedWord, POLICY_MESSAGE } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { MediaType } from '@/types/tmdb';

export interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  season_number: number | null;
  episode_number: number | null;
  author: { username: string | null; avatar_url: string | null } | null;
  likeCount: number;
  liked: boolean;
  hidden: boolean;
}

/** Ámbito del hilo de comentarios: título (por defecto) o episodio concreto. */
export interface CommentScope {
  season?: number | null;
  episode?: number | null;
}

function key(tmdbId: number, mediaType: MediaType, scope: CommentScope) {
  return ['comments', mediaType, tmdbId, scope.season ?? null, scope.episode ?? null];
}

/**
 * Comentarios de un título (season/episode = null) o de un episodio concreto.
 * El autor se incrusta desde profiles vía la FK comments.user_id -> profiles.id.
 */
export function useComments(
  tmdbId: number,
  mediaType: MediaType,
  scope: CommentScope = {},
) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [...key(tmdbId, mediaType, scope), session?.user.id],
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
    queryFn: async (): Promise<CommentRow[]> => {
      // El contador de likes viene incrustado por PostgREST: comment_likes(count).
      let q = supabase
        .from('comments')
        .select(
          'id, body, created_at, user_id, season_number, episode_number, hidden, author:profiles(username, avatar_url), likes:comment_likes(count)',
        )
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType);

      if (scope.season == null) {
        q = q.is('season_number', null);
      } else {
        q = q
          .eq('season_number', scope.season)
          .eq('episode_number', scope.episode ?? 0);
      }

      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as any[];

      // Qué comentarios he marcado yo con "me gusta".
      let mine = new Set<string>();
      if (session && rows.length) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', session.user.id)
          .in(
            'comment_id',
            rows.map((r) => r.id),
          );
        mine = new Set((likes ?? []).map((l) => l.comment_id as string));
      }

      return rows.map((r) => ({
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        user_id: r.user_id,
        season_number: r.season_number,
        episode_number: r.episode_number,
        author: r.author,
        likeCount: r.likes?.[0]?.count ?? 0,
        liked: mine.has(r.id),
        hidden: r.hidden ?? false,
      }));
    },
  });
}

/** Da o quita "me gusta" a un comentario. Refresca los hilos de comentarios. */
export function useToggleCommentLike() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async ({ id, liked }: { id: string; liked: boolean }) => {
      if (!session) throw new Error('Debes iniciar sesión');
      if (liked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .match({ comment_id: id, user_id: session.user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({ comment_id: id, user_id: session.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  });
}

/** Reporta un comentario (base de moderación). */
export function useReportComment() {
  const { session } = useAuth();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (!session) throw new Error('Debes iniciar sesión');
      const { error } = await supabase
        .from('comment_reports')
        .insert({ comment_id: id, user_id: session.user.id, reason });
      if (error && error.code !== '23505') throw error; // 23505 = ya reportado
    },
  });
}

export function useAddComment(
  tmdbId: number,
  mediaType: MediaType,
  scope: CommentScope = {},
) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!session) throw new Error('Debes iniciar sesión para comentar');
      const trimmed = body.trim();
      if (!trimmed) throw new Error('El comentario está vacío');
      // Aviso inmediato en el cliente; el servidor lo vuelve a comprobar.
      if (containsBannedWord(trimmed)) throw new Error(POLICY_MESSAGE);
      const { error } = await supabase.from('comments').insert({
        user_id: session.user.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        season_number: scope.season ?? null,
        episode_number: scope.season == null ? null : scope.episode ?? 0,
        body: trimmed,
      });
      if (error) {
        // El trigger del servidor rechaza el contenido con este mensaje.
        if (error.message?.includes('comment_policy_violation')) {
          throw new Error(POLICY_MESSAGE);
        }
        throw error;
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: key(tmdbId, mediaType, scope) }),
  });
}

export function useDeleteComment(
  tmdbId: number,
  mediaType: MediaType,
  scope: CommentScope = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: key(tmdbId, mediaType, scope) }),
  });
}
