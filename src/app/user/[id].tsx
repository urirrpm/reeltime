import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FeedItem } from '@/components/FeedItem';
import { FollowButton } from '@/components/FollowButton';
import { ProfileCollections } from '@/components/ProfileCollections';
import { ProfileStats } from '@/components/ProfileStats';
import { Screen } from '@/components/Screen';
import {
  groupFeed,
  useActivityFeed,
  type FeedItem as FeedItemType,
} from '@/hooks/useActivityFeed';
import { useFollowCounts, useProfile } from '@/hooks/useSocial';
import { colors, radius, spacing, type } from '@/theme';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: profile } = useProfile(id);
  const { data: counts } = useFollowCounts(id);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityFeed({ actorId: id });

  const items = useMemo<FeedItemType[]>(
    () => groupFeed((data?.pages ?? []).flat()),
    [data],
  );

  const username = profile?.username ?? 'usuario';
  // Los avatares/portadas se guardan como URL pública completa (Supabase Storage).
  const avatarUri = profile?.avatar_url ?? null;
  const coverUri = profile?.cover_url ?? null;
  const initial = username.charAt(0).toUpperCase();

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: `@${username}` }} />
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <FeedItem item={item} />}
        ListHeaderComponent={
          <View>
            <View style={styles.cover}>
              {coverUri ? (
                <Image
                  source={{ uri: coverUri }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
            </View>
            <View style={styles.header}>
              <View style={styles.avatar}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : (
                  <Text style={styles.avatarText}>{initial}</Text>
                )}
              </View>
              <Text style={styles.username}>@{username}</Text>
              {!!profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
              <Text style={styles.counts}>
                {counts?.followers ?? 0} seguidores · {counts?.following ?? 0}{' '}
                siguiendo
              </Text>
              {id && <FollowButton userId={id} />}
            </View>
            <View style={styles.statsWrap}>
              {id && <ProfileStats userId={id} />}
              {id && (
                <View style={{ marginTop: spacing.lg }}>
                  <ProfileCollections userId={id} editable={false} />
                </View>
              )}
            </View>
            <Text style={styles.sectionLabel}>Actividad</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            />
          ) : (
            <Text style={styles.empty}>Este usuario aún no tiene actividad.</Text>
          )
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
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
  cover: { height: 130, backgroundColor: colors.surfaceHigh },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: -42,
    borderWidth: 4,
    borderColor: colors.bg,
  },
  bio: {
    color: colors.textMuted,
    ...type.body,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  statsWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 30 },
  username: { color: colors.text, ...type.title },
  counts: { color: colors.textMuted, ...type.body },
  sectionLabel: {
    alignSelf: 'flex-start',
    color: colors.text,
    ...type.heading,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sep: { height: 1, backgroundColor: colors.hairline, marginLeft: 72 },
  empty: {
    color: colors.textMuted,
    ...type.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
