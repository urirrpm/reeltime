import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Poster } from '@/components/Poster';
import { useFavorites } from '@/hooks/useFavorites';
import { useCreateList, useLists } from '@/hooks/useLists';
import { haptics } from '@/lib/haptics';
import { colors, radius, spacing, type } from '@/theme';

/**
 * Estanterías del perfil: Favoritos (pósters) y Listas. `editable` (perfil
 * propio) añade el botón de crear lista nueva.
 */
export function ProfileCollections({
  userId,
  editable,
}: {
  userId: string;
  editable: boolean;
}) {
  const { data: favorites } = useFavorites(userId);
  const { data: lists } = useLists(userId);
  const createList = useCreateList();

  const hasFavs = (favorites?.length ?? 0) > 0;
  const hasLists = (lists?.length ?? 0) > 0;

  const promptNewList = () => {
    haptics.selection();
    // Alert.prompt es iOS (el usuario prueba en iPhone); sin él, no rompe.
    if (typeof Alert.prompt === 'function') {
      Alert.prompt('Nueva lista', 'Ponle un nombre', (name) => {
        if (name?.trim()) createList.mutate(name.trim());
      });
    }
  };

  if (!editable && !hasFavs && !hasLists) return null;

  return (
    <View style={styles.wrap}>
      {hasFavs && (
        <View style={styles.section}>
          <Text style={styles.header}>Favoritos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shelf}>
            {favorites!.map((f) => (
              <Link
                key={`${f.media_type}-${f.tmdb_id}`}
                href={`/title/${f.media_type}/${f.tmdb_id}`}
                asChild>
                <Pressable style={styles.favCell}>
                  <Poster path={f.poster_path} width={92} size="w342" />
                  <Text style={styles.favTitle} numberOfLines={1}>
                    {f.title}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </View>
      )}

      {(hasLists || editable) && (
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Listas</Text>
            {editable && (
              <Pressable onPress={promptNewList} style={styles.newBtn}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.newText}>Nueva</Text>
              </Pressable>
            )}
          </View>

          {!hasLists && editable && (
            <Text style={styles.empty}>
              Crea listas para organizar tus series y películas.
            </Text>
          )}

          {lists?.map((l) => (
            <Link key={l.id} href={`/list/${l.id}`} asChild>
              <Pressable style={styles.listRow}>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{l.name}</Text>
                  <Text style={styles.listCount}>
                    {l.count} {l.count === 1 ? 'título' : 'títulos'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textFaint}
                />
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl },
  section: { gap: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: { color: colors.text, ...type.heading },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  newText: { color: colors.primary, ...type.bodyStrong },
  shelf: { gap: spacing.md, paddingVertical: spacing.xs },
  favCell: { width: 92, gap: spacing.xs },
  favTitle: { color: colors.text, ...type.caption },
  empty: { color: colors.textMuted, ...type.body },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  listInfo: { flex: 1, gap: 2 },
  listName: { color: colors.text, ...type.bodyStrong },
  listCount: { color: colors.textMuted, ...type.caption },
});
