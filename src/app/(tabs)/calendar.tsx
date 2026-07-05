import { useQueries } from '@tanstack/react-query';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Poster } from '@/components/Poster';
import { Screen } from '@/components/Screen';
import { useTrackedItems } from '@/hooks/useTracking';
import { getNextEpisode, type NextEpisodeInfo } from '@/lib/tmdb';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';
import { useRegion } from '@/providers/RegionProvider';
import { colors, radius, spacing } from '@/theme';

export default function CalendarScreen() {
  const { session, configured } = useAuth();
  const { region } = useRegion();
  const { data: tracked } = useTrackedItems();

  const tvShows = (tracked ?? []).filter((t) => t.media_type === 'tv');

  const results = useQueries({
    queries: tvShows.map((t) => ({
      queryKey: ['next-episode', t.tmdb_id, region.code],
      queryFn: () => getNextEpisode(t.tmdb_id, region),
      staleTime: 1000 * 60 * 60,
    })),
  });

  if (!configured || !session) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Tu calendario de estrenos</Text>
          <Text style={styles.emptyText}>
            Inicia sesión y sigue series para ver aquí cuándo se estrena cada
            nuevo episodio.
          </Text>
          <Link href="/sign-in" asChild>
            <Pressable style={styles.cta}>
              <Text style={styles.ctaText}>Iniciar sesión</Text>
            </Pressable>
          </Link>
        </View>
      </Screen>
    );
  }

  const loading = results.some((r) => r.isLoading);

  const upcoming: NextEpisodeInfo[] = results
    .map((r) => r.data)
    .filter((d): d is NextEpisodeInfo => !!d?.episode?.air_date)
    .sort((a, b) =>
      (a.episode!.air_date ?? '').localeCompare(b.episode!.air_date ?? ''),
    );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Calendario</Text>

        {loading && <ActivityIndicator color={colors.primary} />}

        {!loading && upcoming.length === 0 && (
          <Text style={styles.emptyText}>
            No hay episodios anunciados para tus series. Cuando se anuncien,
            aparecerán aquí ordenados por fecha.
          </Text>
        )}

        {upcoming.map((u) => (
          <Link key={u.tvId} href={`/title/tv/${u.tvId}`} asChild>
            <Pressable style={styles.row}>
              <Poster path={u.poster_path} width={54} />
              <View style={styles.info}>
                <Text style={styles.showTitle} numberOfLines={1}>
                  {u.title}
                </Text>
                <Text style={styles.episode} numberOfLines={1}>
                  T{u.episode!.season_number} · E{u.episode!.episode_number}
                  {u.episode!.name ? ` — ${u.episode!.name}` : ''}
                </Text>
                <Text style={styles.date}>{formatDate(u.episode!.air_date)}</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  info: { flex: 1, gap: 2 },
  showTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  episode: { color: colors.textMuted, fontSize: 13 },
  date: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
