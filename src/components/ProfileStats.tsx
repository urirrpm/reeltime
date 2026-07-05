import { useQueries } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useWatchedCounts } from '@/hooks/useStats';
import { watchTime } from '@/lib/format';
import { getMediaBrief } from '@/lib/tmdb';
import { useRegion } from '@/providers/RegionProvider';
import { colors, radius, spacing, type } from '@/theme';

/**
 * Estadísticas del usuario estilo TV Time: tiempo de series (estimado con la
 * duración media de cada serie en TMDB), episodios vistos y nº de series.
 */
export function ProfileStats({ userId }: { userId: string }) {
  const { region } = useRegion();
  const { data: counts } = useWatchedCounts(userId);
  const perShow = counts?.perShow ?? [];

  // Duración media por serie (misma clave de caché que useMediaBrief).
  const briefs = useQueries({
    queries: perShow.map((s) => ({
      queryKey: ['brief', 'tv', s.tv_id, region.code],
      queryFn: () => getMediaBrief('tv', s.tv_id, region),
      staleTime: 1000 * 60 * 60,
    })),
  });

  // Si TMDB no da duración de una serie, estimamos ~42 min/episodio.
  const FALLBACK_RUNTIME = 42;
  const totalMinutes = perShow.reduce((sum, s, i) => {
    const rt = briefs[i]?.data?.runtime ?? FALLBACK_RUNTIME;
    return sum + s.episodes * rt;
  }, 0);
  const { months, days, hours } = watchTime(totalMinutes);

  return (
    <View style={styles.wrap}>
      <View style={styles.timeCard}>
        <View style={styles.cardHead}>
          <Ionicons name="tv-outline" size={16} color={colors.textMuted} />
          <Text style={styles.cardLabel}>Tiempo de series</Text>
        </View>
        <View style={styles.timeRow}>
          <Unit value={months} label="MESES" />
          <Unit value={days} label="DÍAS" />
          <Unit value={hours} label="HORAS" />
        </View>
      </View>

      <View style={styles.smallRow}>
        <View style={styles.smallCard}>
          <Text style={styles.smallValue}>{counts?.episodes ?? 0}</Text>
          <Text style={styles.smallLabel}>Episodios vistos</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.smallValue}>{counts?.series ?? 0}</Text>
          <Text style={styles.smallLabel}>Series</Text>
        </View>
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

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
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
