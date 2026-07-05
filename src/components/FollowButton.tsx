import { Pressable, StyleSheet, Text } from 'react-native';

import { useIsFollowing, useToggleFollow } from '@/hooks/useSocial';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';

/**
 * Botón Seguir / Siguiendo. No se muestra en tu propio perfil ni sin sesión.
 */
export function FollowButton({ userId }: { userId: string }) {
  const { session } = useAuth();
  const isFollowing = useIsFollowing(userId);
  const { mutate, isPending } = useToggleFollow();

  if (!session || session.user.id === userId) return null;

  const onPress = () => {
    haptics.medium();
    mutate({ userId, follow: !isFollowing });
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      style={[styles.btn, isFollowing ? styles.following : styles.follow]}>
      <Text style={isFollowing ? styles.followingText : styles.followText}>
        {isFollowing ? 'Siguiendo' : 'Seguir'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  follow: { backgroundColor: colors.primary },
  following: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followText: { color: colors.onAccent, ...type.bodyStrong },
  followingText: { color: colors.text, ...type.bodyStrong },
});
