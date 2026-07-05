import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CharacterPoll } from '@/components/CharacterPoll';
import { useEpisode } from '@/hooks/useTmdb';
import { formatDate } from '@/lib/format';
import { imageUrl } from '@/lib/tmdb';
import { colors, spacing } from '@/theme';

export default function EpisodeScreen() {
  const params = useLocalSearchParams<{
    tvId: string;
    season: string;
    episode: string;
  }>();
  const tvId = Number(params.tvId);
  const season = Number(params.season);
  const episode = Number(params.episode);

  const { data, isLoading, isError } = useEpisode(tvId, season, episode);

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
      <Stack.Screen options={{ title: `T${season} · E${episode}` }} />

      {data.still_path && (
        <Image
          source={{ uri: imageUrl(data.still_path, 'w780') ?? undefined }}
          style={styles.still}
          contentFit="cover"
        />
      )}

      <View style={styles.body}>
        <Text style={styles.epNum}>
          Temporada {season} · Episodio {episode}
        </Text>
        <Text style={styles.title}>{data.name}</Text>
        {!!data.air_date && (
          <Text style={styles.date}>{formatDate(data.air_date)}</Text>
        )}
        {!!data.overview && <Text style={styles.overview}>{data.overview}</Text>}

        <View style={styles.divider} />

        <CharacterPoll
          tvId={tvId}
          season={season}
          episode={episode}
          cast={data.cast}
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
  still: { width: '100%', height: 210, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.lg, gap: spacing.xs },
  epNum: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  date: { color: colors.textMuted, fontSize: 13 },
  overview: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  muted: { color: colors.textMuted },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
});
