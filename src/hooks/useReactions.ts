import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface ReactionResult {
  emotion: string;
  votes: number;
  pct: number;
}

function resultsKey(tvId: number, s: number, e: number) {
  return ['episode-reactions', tvId, s, e];
}
function mineKey(tvId: number, s: number, e: number, userId?: string) {
  return ['episode-reaction-mine', tvId, s, e, userId];
}

/** Resultados agregados (% por emoción) del episodio. Público. */
export function useReactionResults(tvId: number, s: number, e: number) {
  return useQuery({
    queryKey: resultsKey(tvId, s, e),
    enabled: Number.isFinite(tvId),
    queryFn: async (): Promise<ReactionResult[]> => {
      const { data, error } = await supabase.rpc('episode_reaction_results', {
        p_tv_id: tvId,
        p_season: s,
        p_episode: e,
      });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        emotion: r.emotion as string,
        votes: Number(r.votes),
        pct: Number(r.pct),
      }));
    },
  });
}

/** La emoción elegida por el usuario actual en este episodio (o null). */
export function useMyReaction(tvId: number, s: number, e: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: mineKey(tvId, s, e, session?.user.id),
    enabled: !!session && Number.isFinite(tvId),
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from('episode_reactions')
        .select('emotion')
        .eq('tv_id', tvId)
        .eq('season_number', s)
        .eq('episode_number', e)
        .maybeSingle();
      if (error) throw error;
      return data?.emotion ?? null;
    },
  });
}

/** Fija (o cambia) la reacción del usuario en el episodio. */
export function useSetReaction(tvId: number, s: number, e: number) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (emotion: string) => {
      if (!session) throw new Error('Debes iniciar sesión');
      const { error } = await supabase.from('episode_reactions').upsert(
        {
          user_id: session.user.id,
          tv_id: tvId,
          season_number: s,
          episode_number: e,
          emotion,
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
