import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

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
  return useQuery({
    queryKey: key(tmdbId, mediaType, scope),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
    queryFn: async (): Promise<CommentRow[]> => {
      let q = supabase
        .from('comments')
        .select(
          'id, body, created_at, user_id, season_number, episode_number, author:profiles(username, avatar_url)',
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
      return (data ?? []) as unknown as CommentRow[];
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
      const { error } = await supabase.from('comments').insert({
        user_id: session.user.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        season_number: scope.season ?? null,
        episode_number: scope.season == null ? null : scope.episode ?? 0,
        body: trimmed,
      });
      if (error) throw error;
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
