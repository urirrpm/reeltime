import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { WatchedButton } from '@/components/WatchedButton';
import { useSeasonEpisodes } from '@/hooks/useTmdb';
import {
  epKey,
  useSetSeasonWatched,
  useToggleWatched,
  useWatchedEpisodes,
} from '@/hooks/useWatched';
import { haptics } from '@/lib/haptics';
import { formatDate } from '@/lib/format';
import { imageUrl } from '@/lib/tmdb';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';

export default function SeasonScreen() {
  const params = useLocalSearchParams<{ tvId: string; season: string }>();
  const tvId = Number(params.tvId);
  const season = Number(params.season);

  const { session } = useAuth();
  const { data: episodes, isLoading } = useSeasonEpisodes(tvId, season);
  const { data: watched } = useWatchedEpisodes(tvId);
  const toggle = useToggleWatched(tvId);
  const setSeason = useSetSeasonWatched(tvId);

  const watchedSet = useMemo(
    () =>
      new Set(
        (watched ?? []).map((w) => epKey(w.season_number, w.episode_number)),
      ),
    [watched],
  );

  const epNumbers = (episodes ?? []).map((e) => e.episode_number);
  const seenCount = epNumbers.filter((n) => watchedSet.has(epKey(season, n)))
    .length;
  const total = epNumbers.length;
  const allSeen = total > 0 && seenCount === total;

  return (
    <View style={styles.bg}>
      <Stack.Screen options={{ title: `Temporada ${season}` }} />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {session && total > 0 && (
            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <Text style={styles.progressLabel}>
                  {seenCount} de {total} vistos
                </Text>
                <Pressable
                  onPress={() => {
                    haptics.success();
                    setSeason.mutate({
                      season,
                      episodes: epNumbers,
                      watched: !allSeen,
                    });
                  }}
                  style={styles.markAll}>
                  <Text style={styles.markAllText}>
                    {allSeen ? 'Desmarcar' : 'Marcar todo'}
                  </Text>
                </Pressable>
              </View>
              <ProgressBar value={total ? seenCount / total : 0} />
            </View>
          )}

          {episodes?.map((ep) => {
            const isSeen = watchedSet.has(epKey(season, ep.episode_number));
            return (
              <Link
                key={ep.id}
                href={`/episode/${tvId}/${season}/${ep.episode_number}`}
                asChild>
                <Pressable style={styles.row}>
                  <Image
                    source={{
                      uri: imageUrl(ep.still_path, 'w342') ?? undefined,
                    }}
                    style={[styles.still, isSeen && styles.stillSeen]}
                    contentFit="cover"
                  />
                  <View style={styles.info}>
                    <Text style={styles.epNum}>
                      Episodio {ep.episode_number}
                    </Text>
                    <Text style={styles.name} numberOfLines={2}>
                      {ep.name}
                    </Text>
                    {!!ep.air_date && (
                      <Text style={styles.date}>{formatDate(ep.air_date)}</Text>
                    )}
                  </View>
                  {session && (
                    <WatchedButton
                      watched={isSeen}
                      onToggle={(next) =>
                        toggle.mutate({
                          season,
                          episode: ep.episode_number,
                          watched: next,
                        })
                      }
                    />
                  )}
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: spacing.xxl },
  content: { padding: spacing.lg, gap: spacing.md },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { color: colors.text, ...type.bodyStrong },
  markAll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  markAllText: { color: colors.primary, ...type.micro, fontSize: 13 },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  still: {
    width: 108,
    height: 62,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  stillSeen: { opacity: 0.45 },
  info: { flex: 1, gap: 2 },
  epNum: { color: colors.textMuted, ...type.micro },
  name: { color: colors.text, ...type.bodyStrong },
  date: { color: colors.textMuted, ...type.caption },
});
