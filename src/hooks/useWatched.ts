import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface WatchedEpisode {
  season_number: number;
  episode_number: number;
}

function key(tvId: number, userId?: string) {
  return ['watched', tvId, userId];
}

/** Clave estable para un episodio dentro del set de vistos. */
export const epKey = (season: number, episode: number) => `${season}x${episode}`;

/** Episodios vistos por el usuario de una serie. */
export function useWatchedEpisodes(tvId: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: key(tvId, session?.user.id),
    enabled: !!session && Number.isFinite(tvId) && tvId > 0,
    queryFn: async (): Promise<WatchedEpisode[]> => {
      const { data, error } = await supabase
        .from('watched_episodes')
        .select('season_number, episode_number')
        .eq('tv_id', tvId);
      if (error) throw error;
      return data as WatchedEpisode[];
    },
  });
}

/** Marca/desmarca un episodio como visto. */
export function useToggleWatched(tvId: number) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async ({
      season,
      episode,
      watched,
    }: {
      season: number;
      episode: number;
      watched: boolean;
    }) => {
      if (!session) throw new Error('Debes iniciar sesión');
      if (watched) {
        const { error } = await supabase.from('watched_episodes').upsert(
          {
            user_id: session.user.id,
            tv_id: tvId,
            season_number: season,
            episode_number: episode,
          },
          { onConflict: 'user_id,tv_id,season_number,episode_number' },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('watched_episodes')
          .delete()
          .match({ tv_id: tvId, season_number: season, episode_number: episode });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watched', tvId] }),
  });
}

/** Marca/desmarca en bloque todos los episodios de una temporada. */
export function useSetSeasonWatched(tvId: number) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async ({
      season,
      episodes,
      watched,
    }: {
      season: number;
      episodes: number[];
      watched: boolean;
    }) => {
      if (!session) throw new Error('Debes iniciar sesión');
      if (watched) {
        const rows = episodes.map((e) => ({
          user_id: session.user.id,
          tv_id: tvId,
          season_number: season,
          episode_number: e,
        }));
        const { error } = await supabase
          .from('watched_episodes')
          .upsert(rows, { onConflict: 'user_id,tv_id,season_number,episode_number' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('watched_episodes')
          .delete()
          .match({ tv_id: tvId, season_number: season });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watched', tvId] }),
  });
}
