import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface WatchedCounts {
  perShow: { tv_id: number; episodes: number }[];
  episodes: number;
  series: number;
}

/**
 * Conteo de episodios vistos (por serie y total) de un usuario. Datos públicos
 * (watched_episodes tiene lectura pública), así que sirve para cualquier perfil.
 * El "tiempo de series" se estima en el cliente multiplicando por la duración
 * media de cada serie (TMDB) — ver ProfileStats.
 */
export function useWatchedCounts(userId?: string) {
  return useQuery({
    queryKey: ['watched_counts', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WatchedCounts> => {
      const { data, error } = await supabase.rpc('watched_episode_counts', {
        p_user: userId,
      });
      if (error) throw error;
      const perShow = (data ?? []).map((r: any) => ({
        tv_id: r.tv_id as number,
        episodes: Number(r.episodes),
      }));
      return {
        perShow,
        episodes: perShow.reduce(
          (s: number, r: { episodes: number }) => s + r.episodes,
          0,
        ),
        series: perShow.length,
      };
    },
  });
}
