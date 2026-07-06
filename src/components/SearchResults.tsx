import { Image } from 'expo-image';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PosterCard } from '@/components/PosterCard';
import { useUserSearch } from '@/hooks/useSocial';
import { useSearch } from '@/hooks/useTmdb';
import { colors, radius, spacing, type } from '@/theme';

/** Resultados de búsqueda: usuarios (arriba) + títulos (rejilla). */
export function SearchResults({ query }: { query: string }) {
  const titles = useSearch(query);
  const users = useUserSearch(query);

  const noResults =
    !titles.isLoading &&
    !users.isLoading &&
    (titles.data?.length ?? 0) === 0 &&
    (users.data?.length ?? 0) === 0;

  return (
    <FlatList
      data={titles.data ?? []}
      keyExtractor={(item) => `${item.media_type}-${item.id}`}
      numColumns={3}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.usersWrap}>
          {(users.data?.length ?? 0) > 0 && (
            <>
              <Text style={styles.sectionLabel}>Usuarios</Text>
              {users.data!.map((u) => (
                <Link key={u.id} href={`/user/${u.id}`} asChild>
                  <Pressable style={styles.userRow}>
                    <View style={styles.avatar}>
                      {u.avatar_url ? (
                        <Image
                          source={{ uri: u.avatar_url }}
                          style={StyleSheet.absoluteFill}
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {(u.username ?? '?').charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.userName}>@{u.username ?? 'usuario'}</Text>
                  </Pressable>
                </Link>
              ))}
            </>
          )}
          {(titles.data?.length ?? 0) > 0 &&
            (users.data?.length ?? 0) > 0 && (
              <Text style={styles.sectionLabel}>Series y películas</Text>
            )}
        </View>
      }
      renderItem={({ item }) => <PosterCard item={item} width={104} />}
      ListFooterComponent={
        titles.isLoading || users.isLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: spacing.xl }}
          />
        ) : noResults ? (
          <Text style={styles.msg}>Sin resultados para “{query}”.</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  grid: { paddingHorizontal: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  row: { justifyContent: 'space-between' },
  usersWrap: { gap: spacing.sm },
  sectionLabel: {
    color: colors.text,
    ...type.heading,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  userName: { color: colors.text, ...type.bodyStrong },
  msg: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
