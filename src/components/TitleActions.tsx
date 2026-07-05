import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';
import type { MediaDetail } from '@/types/tmdb';

/** Favorito (corazón) + añadir a lista, en la ficha de un título. */
export function TitleActions({ detail }: { detail: MediaDetail }) {
  const { session } = useAuth();
  const isFav = useIsFavorite(detail.id, detail.media_type);
  const toggleFav = useToggleFavorite();

  if (!session) return null;

  const item = {
    tmdb_id: detail.id,
    media_type: detail.media_type,
    title: detail.title,
    poster_path: detail.poster_path ?? null,
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, isFav && styles.btnActive]}
        onPress={() => {
          haptics.medium();
          toggleFav.mutate({ item, isFav });
        }}>
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={18}
          color={isFav ? colors.danger : colors.text}
        />
        <Text style={styles.btnText}>{isFav ? 'En favoritos' : 'Favorito'}</Text>
      </Pressable>

      <Link
        href={{
          pathname: '/add-to-list',
          params: {
            tmdb_id: String(detail.id),
            media_type: detail.media_type,
            title: detail.title,
            poster_path: detail.poster_path ?? '',
          },
        }}
        asChild>
        <Pressable style={styles.btn}>
          <Ionicons name="list-outline" size={18} color={colors.text} />
          <Text style={styles.btnText}>Añadir a lista</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnActive: { borderColor: colors.danger },
  btnText: { color: colors.text, ...type.bodyStrong },
});
