import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import { useFollowing } from '@/hooks/useSocial';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';

type Mode = 'discover' | 'following';

export default function FeedScreen() {
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>('discover');

  const { data: following, isLoading: followingLoading } = useFollowing();

  const filter =
    mode === 'following' ? { actorIn: following ?? [] } : {};

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityFeed(filter);

  const items = useMemo<FeedItemType[]>(
    () => groupFeed((data?.pages ?? []).flat()),
    [data],
  );

  const select = (m: Mode) => {
    haptics.selection();
    setMode(m);
  };

  // Estado especial del modo "Siguiendo".
  const followingEmpty =
    mode === 'following' && !followingLoading && (following?.length ?? 0) === 0;

  return (
    <Screen>
      <FlatList
        data={followingEmpty ? [] : items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <FeedItem item={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Feed</Text>
            {session && (
              <View style={styles.segment}>
                {(['discover', 'following'] as Mode[]).map((m) => {
                  const active = mode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => select(m)}
                      style={[styles.segBtn, active && styles.segBtnActive]}>
                      <Text
                        style={[
                          styles.segText,
                          active && styles.segTextActive,
                        ]}>
                        {m === 'discover' ? 'Descubrir' : 'Siguiendo'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={
          (followingEmpty || items.length === 0) && styles.emptyContainer
        }
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
          followingEmpty ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aún no sigues a nadie</Text>
              <Text style={styles.emptyText}>
                Toca el @usuario de cualquier actividad en Descubrir para ver su
                perfil y seguirlo.
              </Text>
            </View>
          ) : isLoading || (mode === 'following' && followingLoading) ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aún no hay actividad</Text>
              <Text style={styles.emptyText}>
                Cuando la gente valore, comente o vea episodios, aparecerá aquí.
              </Text>
              {!session && (
                <Link href="/sign-in" asChild>
                  <Pressable style={styles.cta}>
                    <Text style={styles.ctaText}>Iniciar sesión</Text>
                  </Pressable>
                </Link>
              )}
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
    gap: spacing.md,
  },
  title: { color: colors.text, ...type.hero },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { color: colors.textMuted, ...type.bodyStrong },
  segTextActive: { color: colors.text },
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
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.onAccent, ...type.bodyStrong },
});
