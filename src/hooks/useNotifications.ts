import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { MediaType } from '@/types/tmdb';

export type NotificationType = 'follow' | 'comment_like';

export interface NotificationRow {
  id: string;
  actor_id: string;
  type: NotificationType;
  comment_id: string | null;
  tmdb_id: number | null;
  media_type: MediaType | null;
  season_number: number | null;
  episode_number: number | null;
  read: boolean;
  created_at: string;
  actor: { username: string | null; avatar_url: string | null } | null;
}

/** Lista de notificaciones del usuario actual (con el autor incrustado). */
export function useNotifications() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['notifications', session?.user.id],
    enabled: !!session,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, actor_id, type, comment_id, tmdb_id, media_type, season_number, episode_number, read, created_at, actor:profiles!actor_id(username, avatar_url)',
        )
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as NotificationRow[];
    },
  });
}

/** Nº de notificaciones sin leer (para el badge de la campana). Se refresca. */
export function useUnreadCount() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['notifications-unread', session?.user.id],
    enabled: !!session,
    refetchInterval: 45_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Marca todas las notificaciones como leídas. */
export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!session) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', session.user.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
}
