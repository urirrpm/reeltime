import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { MediaType } from '@/types/tmdb';

export type TrackStatus = 'watchlist' | 'watching' | 'completed';

export interface TrackedItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  status: TrackStatus;
  created_at: string;
  updated_at: string;
}

export interface TrackInput {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  status: TrackStatus;
}

const KEY = ['tracked_items'];

/** Lista de items que el usuario sigue. */
export function useTrackedItems() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [...KEY, session?.user.id],
    enabled: !!session,
    queryFn: async (): Promise<TrackedItem[]> => {
      const { data, error } = await supabase
        .from('tracked_items')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as TrackedItem[];
    },
  });
}

/** Estado de tracking de un título concreto (o null si no se sigue). */
export function useTrackStatus(tmdbId: number, mediaType: MediaType) {
  const { data } = useTrackedItems();
  return (
    data?.find((i) => i.tmdb_id === tmdbId && i.media_type === mediaType) ?? null
  );
}

/** Crea/actualiza el estado (upsert) de un título. */
export function useSetTracking() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: TrackInput) => {
      if (!session) throw new Error('Debes iniciar sesión');
      const { error } = await supabase.from('tracked_items').upsert(
        {
          user_id: session.user.id,
          ...input,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,tmdb_id,media_type' },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Deja de seguir un título. */
export function useRemoveTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tmdb_id,
      media_type,
    }: {
      tmdb_id: number;
      media_type: MediaType;
    }) => {
      const { error } = await supabase
        .from('tracked_items')
        .delete()
        .match({ tmdb_id, media_type });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
