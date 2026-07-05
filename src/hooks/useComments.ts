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

function key(tmdbId: number, mediaType: MediaType) {
  return ['comments', mediaType, tmdbId];
}

/**
 * Comentarios a nivel de título (season/episode = null). El autor se incrusta
 * desde profiles gracias a la FK comments.user_id -> profiles.id.
 */
export function useComments(tmdbId: number, mediaType: MediaType) {
  return useQuery({
    queryKey: key(tmdbId, mediaType),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
    queryFn: async (): Promise<CommentRow[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select(
          'id, body, created_at, user_id, season_number, episode_number, author:profiles(username, avatar_url)',
        )
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .is('season_number', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // PostgREST devuelve el autor como objeto (relación muchos-a-uno).
      return (data ?? []) as unknown as CommentRow[];
    },
  });
}

export function useAddComment(tmdbId: number, mediaType: MediaType) {
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
        body: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tmdbId, mediaType) }),
  });
}

export function useDeleteComment(tmdbId: number, mediaType: MediaType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tmdbId, mediaType) }),
  });
}
