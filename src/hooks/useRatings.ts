import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { MediaType } from '@/types/tmdb';

export interface RatingSummary {
  avg_score: number;
  votes: number;
}

function summaryKey(tmdbId: number, mediaType: MediaType) {
  return ['rating-summary', mediaType, tmdbId];
}
function mineKey(tmdbId: number, mediaType: MediaType, userId?: string) {
  return ['rating-mine', mediaType, tmdbId, userId];
}

/** Media y nº de votos de la comunidad (público). */
export function useRatingSummary(tmdbId: number, mediaType: MediaType) {
  return useQuery({
    queryKey: summaryKey(tmdbId, mediaType),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
    queryFn: async (): Promise<RatingSummary> => {
      const { data, error } = await supabase.rpc('rating_summary', {
        p_tmdb_id: tmdbId,
        p_media_type: mediaType,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        avg_score: Number(row?.avg_score ?? 0),
        votes: Number(row?.votes ?? 0),
      };
    },
  });
}

/** Nota del usuario actual (o null). */
export function useMyRating(tmdbId: number, mediaType: MediaType) {
  const { session } = useAuth();
  return useQuery({
    queryKey: mineKey(tmdbId, mediaType, session?.user.id),
    enabled: !!session && Number.isFinite(tmdbId) && tmdbId > 0,
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from('ratings')
        .select('score')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .maybeSingle();
      if (error) throw error;
      return data?.score ?? null;
    },
  });
}

export function useSetRating(tmdbId: number, mediaType: MediaType) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (score: number) => {
      if (!session) throw new Error('Debes iniciar sesión para valorar');
      const { error } = await supabase.from('ratings').upsert(
        {
          user_id: session.user.id,
          tmdb_id: tmdbId,
          media_type: mediaType,
          score,
        },
        { onConflict: 'user_id,tmdb_id,media_type' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: summaryKey(tmdbId, mediaType) });
      qc.invalidateQueries({
        queryKey: mineKey(tmdbId, mediaType, session?.user.id),
      });
    },
  });
}
