import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface CharacterResult {
  character_id: number;
  character_name: string;
  profile_path: string | null;
  votes: number;
  pct: number;
}

export interface CharacterVoteInput {
  character_id: number;
  character_name: string;
  profile_path: string | null;
}

function resultsKey(tvId: number, s: number, e: number) {
  return ['episode-results', tvId, s, e];
}
function mineKey(tvId: number, s: number, e: number, userId?: string) {
  return ['episode-vote-mine', tvId, s, e, userId];
}

/** Resultados agregados (votos y % por personaje) del episodio. Público. */
export function useEpisodeResults(tvId: number, s: number, e: number) {
  return useQuery({
    queryKey: resultsKey(tvId, s, e),
    enabled: Number.isFinite(tvId),
    queryFn: async (): Promise<CharacterResult[]> => {
      const { data, error } = await supabase.rpc('episode_character_results', {
        p_tv_id: tvId,
        p_season: s,
        p_episode: e,
      });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        character_id: r.character_id,
        character_name: r.character_name,
        profile_path: r.profile_path,
        votes: Number(r.votes),
        pct: Number(r.pct),
      }));
    },
  });
}

/** El personaje votado por el usuario actual en este episodio (o null). */
export function useMyCharacterVote(tvId: number, s: number, e: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: mineKey(tvId, s, e, session?.user.id),
    enabled: !!session && Number.isFinite(tvId),
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from('character_votes')
        .select('character_id')
        .eq('tv_id', tvId)
        .eq('season_number', s)
        .eq('episode_number', e)
        .maybeSingle();
      if (error) throw error;
      return data?.character_id ?? null;
    },
  });
}

export function useVoteCharacter(tvId: number, s: number, e: number) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: CharacterVoteInput) => {
      if (!session) throw new Error('Debes iniciar sesión para votar');
      const { error } = await supabase.from('character_votes').upsert(
        {
          user_id: session.user.id,
          tv_id: tvId,
          season_number: s,
          episode_number: e,
          ...input,
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
