import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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

import { CharacterPoll } from '@/components/CharacterPoll';
import { CommentsSection } from '@/components/CommentsSection';
import { EpisodeReactions } from '@/components/EpisodeReactions';
import { ShareButton } from '@/components/ShareButton';
import { useEpisode } from '@/hooks/useTmdb';
import {
  epKey,
  useToggleWatched,
  useWatchedEpisodes,
} from '@/hooks/useWatched';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { imageUrl } from '@/lib/tmdb';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';

export default function EpisodeScreen() {
  const params = useLocalSearchParams<{
    tvId: string;
    season: string;
    episode: string;
  }>();
  const tvId = Number(params.tvId);
  const season = Number(params.season);
  const episode = Number(params.episode);

  const { session } = useAuth();
  const { data, isLoading, isError } = useEpisode(tvId, season, episode);
  const { data: watched } = useWatchedEpisodes(tvId);
  const toggle = useToggleWatched(tvId);

  const isSeen = useMemo(
    () =>
      new Set(
        (watched ?? []).map((w) => epKey(w.season_number, w.episode_number)),
      ).has(epKey(season, episode)),
    [watched, season, episode],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No se pudo cargar este episodio.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: `T${season} · E${episode}`,
          headerRight: () => (
            <ShareButton
              path={`episode/${tvId}/${season}/${episode}`}
              title={`${data.name} (T${season}E${episode})`}
            />
          ),
        }}
      />

      <View style={styles.hero}>
        {data.still_path && (
          <Image
            source={{ uri: imageUrl(data.still_path, 'w780') ?? undefined }}
            style={styles.still}
            contentFit="cover"
          />
        )}
        <LinearGradient
          colors={['transparent', colors.bg]}
          style={styles.heroFade}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.epNum}>
          Temporada {season} · Episodio {episode}
        </Text>
        <Text style={styles.title}>{data.name}</Text>
        <View style={styles.metaRow}>
          {!!data.air_date && (
            <Text style={styles.date}>{formatDate(data.air_date)}</Text>
          )}
          {!!data.runtime && (
            <Text style={styles.date}>· {data.runtime} min</Text>
          )}
        </View>

        {session ? (
          <Pressable
            onPress={() => {
              haptics.medium();
              toggle.mutate({ season, episode, watched: !isSeen });
            }}
            style={[styles.watchBtn, isSeen && styles.watchBtnOn]}>
            <Ionicons
              name={isSeen ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={isSeen ? colors.bg : colors.text}
            />
            <Text style={[styles.watchText, isSeen && styles.watchTextOn]}>
              {isSeen ? 'Visto' : 'Marcar como visto'}
            </Text>
          </Pressable>
        ) : (
          <Link href="/sign-in" asChild>
            <Pressable style={styles.watchBtn}>
              <Ionicons name="ellipse-outline" size={20} color={colors.text} />
              <Text style={styles.watchText}>Inicia sesión para marcar visto</Text>
            </Pressable>
          </Link>
        )}

        {!!data.overview && <Text style={styles.overview}>{data.overview}</Text>}

        <View style={styles.divider} />
        <EpisodeReactions tvId={tvId} season={season} episode={episode} />

        <View style={styles.divider} />
        <CharacterPoll
          tvId={tvId}
          season={season}
          episode={episode}
          cast={data.cast}
        />

        <View style={styles.divider} />
        <CommentsSection
          tmdbId={tvId}
          mediaType="tv"
          scope={{ season, episode }}
          title="Comentarios del episodio"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: spacing.xxl },
  hero: { height: 220 },
  still: { width: '100%', height: 220, backgroundColor: colors.surfaceAlt },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  body: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: -20 },
  epNum: { color: colors.textMuted, ...type.micro, fontSize: 13 },
  title: { color: colors.text, ...type.title },
  metaRow: { flexDirection: 'row', gap: spacing.xs },
  date: { color: colors.textMuted, ...type.caption },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    marginTop: spacing.sm,
  },
  watchBtnOn: { backgroundColor: colors.green },
  watchText: { color: colors.text, ...type.bodyStrong },
  watchTextOn: { color: colors.bg },
  overview: {
    color: colors.textMuted,
    ...type.body,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  muted: { color: colors.textMuted },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: spacing.lg,
  },
});
