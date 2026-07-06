import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface EpisodeRatingResult {
  score: number;
  votes: number;
  pct: number;
}

function resultsKey(tvId: number, s: number, e: number) {
  return ['episode-rating-results', tvId, s, e];
}
function mineKey(tvId: number, s: number, e: number, userId?: string) {
  return ['episode-rating-mine', tvId, s, e, userId];
}

/** Distribución (1-5) de la comunidad para el episodio. Pública. */
export function useEpisodeRatingResults(tvId: number, s: number, e: number) {
  return useQuery({
    queryKey: resultsKey(tvId, s, e),
    enabled: Number.isFinite(tvId),
    queryFn: async (): Promise<EpisodeRatingResult[]> => {
      const { data, error } = await supabase.rpc('episode_rating_results', {
        p_tv_id: tvId,
        p_season: s,
        p_episode: e,
      });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        score: Number(r.score),
        votes: Number(r.votes),
        pct: Number(r.pct),
      }));
    },
  });
}

/** La valoración (1-5) del usuario actual para el episodio, o null. */
export function useMyEpisodeRating(tvId: number, s: number, e: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: mineKey(tvId, s, e, session?.user.id),
    enabled: !!session && Number.isFinite(tvId),
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from('episode_ratings')
        .select('score')
        .eq('tv_id', tvId)
        .eq('season_number', s)
        .eq('episode_number', e)
        .maybeSingle();
      if (error) throw error;
      return data?.score ?? null;
    },
  });
}

/** Fija/cambia la valoración del usuario para el episodio. */
export function useSetEpisodeRating(tvId: number, s: number, e: number) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (score: number) => {
      if (!session) throw new Error('Debes iniciar sesión');
      const { error } = await supabase.from('episode_ratings').upsert(
        {
          user_id: session.user.id,
          tv_id: tvId,
          season_number: s,
          episode_number: e,
          score,
        },
        { onConflict: 'user_id,tv_id,season_number,episode_number' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resultsKey(tvId, s, e) });
      qc.invalidateQueries({ queryKey: mineKey(tvId, s, e, session?.user.id) });
    },
  });
}
