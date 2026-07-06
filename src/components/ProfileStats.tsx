import { Ionicons } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCompletedMovies, useWatchedCounts } from '@/hooks/useStats';
import { watchTime } from '@/lib/format';
import { getMediaBrief } from '@/lib/tmdb';
import { haptics } from '@/lib/haptics';
import { useRegion } from '@/providers/RegionProvider';
import { colors, radius, spacing, type } from '@/theme';

type Mode = 'series' | 'movies';

// Si TMDB no da duración, estimamos (episodio ~42 min, película ~110 min).
const FALLBACK_TV = 42;
const FALLBACK_MOVIE = 110;

/**
 * Estadísticas del usuario estilo TV Time, con selector Series / Cine. El tiempo
 * se estima con la duración de cada obra en TMDB.
 */
export function ProfileStats({ userId }: { userId: string }) {
  const { region } = useRegion();
  const [mode, setMode] = useState<Mode>('series');

  const { data: counts } = useWatchedCounts(userId);
  const { data: movieIds } = useCompletedMovies(userId);
  const perShow = counts?.perShow ?? [];
  const movies = movieIds ?? [];

  // Solo pedimos a TMDB las duraciones del modo activo.
  const showQueries = useQueries({
    queries: (mode === 'series' ? perShow : []).map((s) => ({
      queryKey: ['brief', 'tv', s.tv_id, region.code],
      queryFn: () => getMediaBrief('tv', s.tv_id, region),
      staleTime: 1000 * 60 * 60,
    })),
  });
  const movieQueries = useQueries({
    queries: (mode === 'movies' ? movies : []).map((id) => ({
      queryKey: ['brief', 'movie', id, region.code],
      queryFn: () => getMediaBrief('movie', id, region),
      staleTime: 1000 * 60 * 60,
    })),
  });

  const seriesMinutes = perShow.reduce((sum, s, i) => {
    const rt = showQueries[i]?.data?.runtime ?? FALLBACK_TV;
    return sum + s.episodes * rt;
  }, 0);
  const movieMinutes = movies.reduce((sum, _id, i) => {
    return sum + (movieQueries[i]?.data?.runtime ?? FALLBACK_MOVIE);
  }, 0);

  const { months, days, hours } = watchTime(
    mode === 'series' ? seriesMinutes : movieMinutes,
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        {(['series', 'movies'] as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => {
                haptics.selection();
                setMode(m);
              }}
              style={[styles.togBtn, active && styles.togBtnActive]}>
              <Text style={[styles.togText, active && styles.togTextActive]}>
                {m === 'series' ? 'Series' : 'Cine'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.timeCard}>
        <View style={styles.cardHead}>
          <Ionicons
            name={mode === 'series' ? 'tv-outline' : 'film-outline'}
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.cardLabel}>
            {mode === 'series' ? 'Tiempo de series' : 'Tiempo de cine'}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Unit value={months} label="MESES" />
          <Unit value={days} label="DÍAS" />
          <Unit value={hours} label="HORAS" />
        </View>
      </View>

      <View style={styles.smallRow}>
        {mode === 'series' ? (
          <>
            <Stat value={counts?.episodes ?? 0} label="Episodios vistos" />
            <Stat value={counts?.series ?? 0} label="Series" />
          </>
        ) : (
          <Stat value={movies.length} label="Películas vistas" />
        )}
      </View>
    </View>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.unit}>
      <Text style={styles.unitValue}>{value}</Text>
      <Text style={styles.unitLabel}>{label}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.smallCard}>
      <Text style={styles.smallValue}>{value}</Text>
      <Text style={styles.smallLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  togBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  togBtnActive: { backgroundColor: colors.primary },
  togText: { color: colors.textMuted, ...type.bodyStrong },
  togTextActive: { color: colors.onAccent },
  timeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardLabel: { color: colors.textMuted, ...type.bodyStrong },
  timeRow: { flexDirection: 'row', justifyContent: 'space-around' },
  unit: { alignItems: 'center', gap: 2 },
  unitValue: { color: colors.text, ...type.title },
  unitLabel: { color: colors.textFaint, ...type.micro },
  smallRow: { flexDirection: 'row', gap: spacing.md },
  smallCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 2,
    alignItems: 'center',
  },
  smallValue: { color: colors.text, ...type.title },
  smallLabel: { color: colors.textMuted, ...type.caption },
});
