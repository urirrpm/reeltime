import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  useMyReaction,
  useReactionResults,
  useSetReaction,
} from '@/hooks/useReactions';
import { EMOTIONS } from '@/lib/emotions';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';

interface Props {
  tvId: number;
  season: number;
  episode: number;
}

/** "¿Cómo te sentiste?" — reacción emocional por episodio con % de comunidad. */
export function EpisodeReactions({ tvId, season, episode }: Props) {
  const { session } = useAuth();
  const results = useReactionResults(tvId, season, episode);
  const mine = useMyReaction(tvId, season, episode);
  const set = useSetReaction(tvId, season, episode);

  const pctByKey = new Map<string, number>();
  let totalVotes = 0;
  for (const r of results.data ?? []) {
    pctByKey.set(r.emotion, r.pct);
    totalVotes += r.votes;
  }
  const hasResults = totalVotes > 0;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>¿Cómo te sentiste?</Text>
      <Text style={styles.subtitle}>
        {hasResults
          ? `${totalVotes} ${totalVotes === 1 ? 'voto' : 'votos'} de la comunidad`
          : 'Sé el primero en reaccionar'}
      </Text>

      {!session && (
        <Link href="/sign-in" asChild>
          <Pressable style={styles.signIn}>
            <Ionicons name="heart-outline" size={16} color={colors.text} />
            <Text style={styles.signInText}>Inicia sesión para reaccionar</Text>
          </Pressable>
        </Link>
      )}

      <View style={styles.grid}>
        {EMOTIONS.map((emotion) => {
          const pct = pctByKey.get(emotion.key) ?? 0;
          const isMine = mine.data === emotion.key;
          return (
            <Pressable
              key={emotion.key}
              disabled={!session || set.isPending}
              onPress={() => {
                haptics.medium();
                set.mutate(emotion.key);
              }}
              style={[styles.chip, isMine && styles.chipMine]}>
              {hasResults && (
                <View
                  style={[
                    styles.bar,
                    { width: `${Math.max(pct, 2)}%` },
                    isMine && styles.barMine,
                  ]}
                />
              )}
              <View style={styles.chipContent}>
                <Ionicons
                  name={emotion.icon}
                  size={18}
                  color={isMine ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[styles.label, isMine && styles.labelMine]}
                  numberOfLines={1}>
                  {emotion.label}
                </Text>
                {hasResults && <Text style={styles.pct}>{pct}%</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13 },
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    width: '48%',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  chipMine: { borderColor: colors.primary },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.surfaceAlt,
  },
  barMine: { backgroundColor: 'rgba(124,92,255,0.25)' },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  label: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  labelMine: { color: colors.primary },
  pct: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
