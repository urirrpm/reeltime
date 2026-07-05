import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { MediaType } from '@/types/tmdb';

export interface FavoriteItem {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
}

/** Favoritos de un usuario (público). */
export function useFavorites(userId?: string) {
  return useQuery({
    queryKey: ['favorites', userId],
    enabled: !!userId,
    queryFn: async (): Promise<FavoriteItem[]> => {
      const { data, error } = await supabase
        .from('favorites')
        .select('tmdb_id, media_type, title, poster_path')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FavoriteItem[];
    },
  });
}

/** ¿Es favorito del usuario actual? */
export function useIsFavorite(tmdbId: number, mediaType: MediaType) {
  const { session } = useAuth();
  const { data } = useFavorites(session?.user.id);
  return !!data?.some(
    (f) => f.tmdb_id === tmdbId && f.media_type === mediaType,
  );
}

/** Marca/desmarca un favorito. */
export function useToggleFavorite() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async ({
      item,
      isFav,
    }: {
      item: FavoriteItem;
      isFav: boolean;
    }) => {
      if (!session) throw new Error('Debes iniciar sesión');
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().match({
          user_id: session.user.id,
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: session.user.id, ...item });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}
