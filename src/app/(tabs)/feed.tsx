import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FeedItem } from '@/components/FeedItem';
import { Screen } from '@/components/Screen';
import {
  groupFeed,
  useActivityFeed,
  type FeedItem as FeedItemType,
} from '@/hooks/useActivityFeed';
import { colors, spacing, type } from '@/theme';

export default function FeedScreen() {
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityFeed();

  // Aplana las páginas y agrupa los "vistos" consecutivos.
  const items = useMemo<FeedItemType[]>(
    () => groupFeed((data?.pages ?? []).flat()),
    [data],
  );

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <FeedItem item={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Feed</Text>
            <Text style={styles.subtitle}>
              La actividad reciente de la comunidad.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={items.length === 0 && styles.emptyContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aún no hay actividad</Text>
              <Text style={styles.emptyText}>
                Cuando la gente valore, comente o vea episodios, aparecerá aquí.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: spacing.lg }}
            />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 2,
  },
  title: { color: colors.text, ...type.hero },
  subtitle: { color: colors.textMuted, ...type.body },
  sep: { height: 1, backgroundColor: colors.hairline, marginLeft: 72 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { color: colors.text, ...type.heading, textAlign: 'center' },
  emptyText: {
    color: colors.textMuted,
    ...type.body,
    textAlign: 'center',
    maxWidth: 280,
  },
});
