import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSeasonEpisodes } from '@/hooks/useTmdb';
import { formatDate } from '@/lib/format';
import { imageUrl } from '@/lib/tmdb';
import { colors, radius, spacing } from '@/theme';

export default function SeasonScreen() {
  const params = useLocalSearchParams<{ tvId: string; season: string }>();
  const tvId = Number(params.tvId);
  const season = Number(params.season);
  const { data, isLoading } = useSeasonEpisodes(tvId, season);

  return (
    <View style={styles.bg}>
      <Stack.Screen options={{ title: `Temporada ${season}` }} />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {data?.map((ep) => (
            <Link
              key={ep.id}
              href={`/episode/${tvId}/${season}/${ep.episode_number}`}
              asChild>
              <Pressable style={styles.row}>
                <Image
                  source={{ uri: imageUrl(ep.still_path, 'w342') ?? undefined }}
                  style={styles.still}
                  contentFit="cover"
                />
                <View style={styles.info}>
                  <Text style={styles.epNum}>Episodio {ep.episode_number}</Text>
                  <Text style={styles.name} numberOfLines={2}>
                    {ep.name}
                  </Text>
                  {!!ep.air_date && (
                    <Text style={styles.date}>{formatDate(ep.air_date)}</Text>
                  )}
                </View>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: spacing.xxl },
  content: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  still: { width: 120, height: 68, backgroundColor: colors.surfaceAlt },
  info: { flex: 1, paddingVertical: spacing.sm, paddingRight: spacing.sm, gap: 2 },
  epNum: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  date: { color: colors.textMuted, fontSize: 12 },
});
