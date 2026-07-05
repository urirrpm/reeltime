import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { MediaType } from '@/types/tmdb';

export type FeedType = 'rating' | 'comment' | 'character_vote' | 'watched';

/** Una fila cruda de la vista activity_feed. */
export interface FeedRow {
  id: string;
  actor_id: string;
  username: string | null;
  avatar_url: string | null;
  type: FeedType;
  tmdb_id: number;
  media_type: MediaType;
  season_number: number | null;
  episode_number: number | null;
  created_at: string;
  payload: Record<string, any>;
}

/**
 * Item ya listo para pintar. Los "vistos" seguidos de la misma serie por el
 * mismo usuario se colapsan en uno solo (`watchedCount`) para que el feed no
 * se llene de líneas repetidas al marcar una temporada entera.
 */
export interface FeedItem extends FeedRow {
  watchedCount?: number; // >1 si es un grupo de episodios vistos
}

const PAGE = 25;

/** Feed global de actividad reciente de la comunidad (paginado). */
export function useActivityFeed() {
  return useInfiniteQuery({
    queryKey: ['activity_feed'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<FeedRow[]> => {
      const from = pageParam * PAGE;
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      return (data ?? []) as FeedRow[];
    },
    getNextPageParam: (last, pages) =>
      last.length === PAGE ? pages.length : undefined,
  });
}

/** Aplana las páginas y agrupa "vistos" consecutivos de la misma serie/usuario. */
export function groupFeed(rows: FeedRow[]): FeedItem[] {
  const items: FeedItem[] = [];
  for (const row of rows) {
    const prev = items[items.length - 1];
    if (
      row.type === 'watched' &&
      prev &&
      prev.type === 'watched' &&
      prev.actor_id === row.actor_id &&
      prev.tmdb_id === row.tmdb_id
    ) {
      prev.watchedCount = (prev.watchedCount ?? 1) + 1;
      continue;
    }
    items.push({ ...row, watchedCount: row.type === 'watched' ? 1 : undefined });
  }
  return items;
}
