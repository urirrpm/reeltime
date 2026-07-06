import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  useEpisodeRatingResults,
  useMyEpisodeRating,
  useSetEpisodeRating,
} from '@/hooks/useEpisodeRating';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';

const TIERS = [
  { score: 1, label: 'Malo' },
  { score: 2, label: 'Normal' },
  { score: 3, label: 'Bueno' },
  { score: 4, label: 'Genial' },
  { score: 5, label: 'Brutal' },
];

/** "Califica este episodio" — 5 niveles (Malo→Brutal) con histograma de la
 *  comunidad, estilo TV Time. */
export function EpisodeRating({
  tvId,
  season,
  episode,
}: {
  tvId: number;
  season: number;
  episode: number;
}) {
  const { session } = useAuth();
  const results = useEpisodeRatingResults(tvId, season, episode);
  const mine = useMyEpisodeRating(tvId, season, episode);
  const set = useSetEpisodeRating(tvId, season, episode);

  const pctByScore = new Map<number, number>();
  let total = 0;
  let weighted = 0;
  for (const r of results.data ?? []) {
    pctByScore.set(r.score, r.pct);
    total += r.votes;
    weighted += r.score * r.votes;
  }
  const hasResults = total > 0;
  const avg = hasResults ? (weighted / total).toFixed(1) : null;
  const myScore = mine.data ?? 0;

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Califica este episodio</Text>
        {hasResults && (
          <Text style={styles.avg}>
            {avg}/5 · {total} {total === 1 ? 'voto' : 'votos'}
          </Text>
        )}
      </View>

      {!session && (
        <Link href="/sign-in" asChild>
          <Pressable style={styles.signIn}>
            <Ionicons name="star-outline" size={16} color={colors.text} />
            <Text style={styles.signInText}>Inicia sesión para valorar</Text>
          </Pressable>
        </Link>
      )}

      <View style={styles.row}>
        {TIERS.map((t) => {
          const selected = myScore >= t.score && myScore > 0;
          const pct = pctByScore.get(t.score) ?? 0;
          return (
            <Pressable
              key={t.score}
              disabled={!session || set.isPending}
              onPress={() => {
                haptics.medium();
                set.mutate(t.score);
              }}
              style={styles.tier}>
              <Ionicons
                name={selected ? 'star' : 'star-outline'}
                size={26}
                color={selected ? colors.gold : colors.textFaint}
              />
              <Text
                style={[
                  styles.tierLabel,
                  myScore === t.score && styles.tierLabelMine,
                ]}
                numberOfLines={1}>
                {t.label}
              </Text>
              {hasResults && <Text style={styles.pct}>{pct}%</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  avg: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  signIn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  signInText: { color: colors.text, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  tier: { flex: 1, alignItems: 'center', gap: 4 },
  tierLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  tierLabelMine: { color: colors.text, fontWeight: '800' },
  pct: { color: colors.textFaint, fontSize: 12, fontWeight: '600' },
});
