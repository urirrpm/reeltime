import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { MediaType } from '@/types/tmdb';

export interface ListRow {
  id: string;
  name: string;
  created_at: string;
  count: number;
}

export interface ListItem {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
}

/** Listas de un usuario, con el nº de elementos incrustado. */
export function useLists(userId?: string) {
  return useQuery({
    queryKey: ['lists', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ListRow[]> => {
      const { data, error } = await supabase
        .from('lists')
        .select('id, name, created_at, items:list_items(count)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((l: any) => ({
        id: l.id,
        name: l.name,
        created_at: l.created_at,
        count: l.items?.[0]?.count ?? 0,
      }));
    },
  });
}

/** Elementos de una lista (público). */
export function useListItems(listId?: string) {
  return useQuery({
    queryKey: ['list_items', listId],
    enabled: !!listId,
    queryFn: async (): Promise<ListItem[]> => {
      const { data, error } = await supabase
        .from('list_items')
        .select('tmdb_id, media_type, title, poster_path')
        .eq('list_id', listId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ListItem[];
    },
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (name: string): Promise<ListRow> => {
      if (!session) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase
        .from('lists')
        .insert({ user_id: session.user.id, name: name.trim() })
        .select('id, name, created_at')
        .single();
      if (error) throw error;
      return { ...(data as any), count: 0 };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists'] }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists'] }),
  });
}

export function useAddToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      item,
    }: {
      listId: string;
      item: ListItem;
    }) => {
      const { error } = await supabase
        .from('list_items')
        .insert({ list_id: listId, ...item });
      if (error && error.code !== '23505') throw error; // ya estaba en la lista
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['lists'] });
      qc.invalidateQueries({ queryKey: ['list_items', v.listId] });
    },
  });
}

export function useRemoveFromList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      tmdbId,
      mediaType,
    }: {
      listId: string;
      tmdbId: number;
      mediaType: MediaType;
    }) => {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .match({ list_id: listId, tmdb_id: tmdbId, media_type: mediaType });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['lists'] });
      qc.invalidateQueries({ queryKey: ['list_items', v.listId] });
    },
  });
}
