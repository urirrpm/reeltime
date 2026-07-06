import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface PublicProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
}

/** Perfil público (username/avatar/portada/bio) de un usuario cualquiera. */
export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async (): Promise<PublicProfile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, cover_url, bio')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as PublicProfile;
    },
  });
}

/** Busca usuarios por nombre de usuario (para la búsqueda de Explorar). */
export function useUserSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['user-search', q],
    enabled: q.length > 1,
    queryFn: async (): Promise<PublicProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, cover_url, bio')
        .ilike('username', `%${q}%`)
        .limit(10);
      if (error) throw error;
      return (data ?? []) as PublicProfile[];
    },
  });
}

/** Actualiza campos del perfil del usuario actual. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (patch: {
      username?: string;
      bio?: string | null;
      avatar_url?: string | null;
      cover_url?: string | null;
    }) => {
      if (!session) throw new Error('Debes iniciar sesión');
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', session.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

/** IDs de los usuarios a los que sigue el usuario actual. */
export function useFollowing() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['following', session?.user.id],
    enabled: !!session,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', session!.user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.following_id as string);
    },
  });
}

/** ¿El usuario actual sigue a `userId`? */
export function useIsFollowing(userId?: string) {
  const { data } = useFollowing();
  return !!userId && !!data?.includes(userId);
}

/** Contadores de seguidores / siguiendo de un usuario. */
export function useFollowCounts(userId?: string) {
  return useQuery({
    queryKey: ['follow_counts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId!),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId!),
      ]);
      return {
        followers: followers.count ?? 0,
        following: following.count ?? 0,
      };
    },
  });
}

/** Seguir / dejar de seguir a un usuario. */
export function useToggleFollow() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async ({
      userId,
      follow,
    }: {
      userId: string;
      follow: boolean;
    }) => {
      if (!session) throw new Error('Debes iniciar sesión');
      if (follow) {
        const { error } = await supabase.from('follows').insert({
          follower_id: session.user.id,
          following_id: userId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ follower_id: session.user.id, following_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['following'] });
      qc.invalidateQueries({ queryKey: ['follow_counts'] });
      qc.invalidateQueries({ queryKey: ['activity_feed'] });
    },
  });
}
