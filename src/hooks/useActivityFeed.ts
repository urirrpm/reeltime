import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { MediaType } from '@/types/tmdb';

export type FeedType =
  | 'rating'
  | 'comment'
  | 'character_vote'
  | 'watched'
  | 'reaction'
  | 'episode_rating';

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

/**
 * Filtro del feed:
 *  - sin filtro           -> feed global (Descubrir).
 *  - actorId              -> actividad de un usuario (su ficha).
 *  - actorIn: string[]    -> actividad de a quién sigues (Siguiendo). Si va como
 *                            array vacío, no se consulta (no sigues a nadie).
 */
export interface FeedFilter {
  actorId?: string;
  actorIn?: string[];
}

/** Feed de actividad reciente (paginado), opcionalmente filtrado. */
export function useActivityFeed(filter: FeedFilter = {}) {
  const { actorId, actorIn } = filter;
  // En modo "Siguiendo" sin nadie a quien seguir, no lanzamos consulta.
  const disabled = actorIn !== undefined && actorIn.length === 0;

  return useInfiniteQuery({
    queryKey: ['activity_feed', actorId ?? null, actorIn ?? null],
    enabled: !disabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<FeedRow[]> => {
      const from = pageParam * PAGE;
      let q = supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (actorId) q = q.eq('actor_id', actorId);
      if (actorIn) q = q.in('actor_id', actorIn);

      const { data, error } = await q;
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
