import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMyRating, useRatingSummary, useSetRating } from '@/hooks/useRatings';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';
import type { MediaType } from '@/types/tmdb';

interface Props {
  tmdbId: number;
  mediaType: MediaType;
}

const STARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Valoración: 10 estrellas para tu nota + media de la comunidad. */
export function RatingBox({ tmdbId, mediaType }: Props) {
  const { session } = useAuth();
  const summary = useRatingSummary(tmdbId, mediaType);
  const mine = useMyRating(tmdbId, mediaType);
  const setRating = useSetRating(tmdbId, mediaType);

  const myScore = mine.data ?? 0;

  return (
    <View style={styles.box}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Valoración</Text>
        {summary.data && summary.data.votes > 0 && (
          <Text style={styles.community}>
            <Ionicons name="people" size={13} color={colors.textMuted} />{' '}
            {summary.data.avg_score.toFixed(1)}{' '}
            <Text style={styles.communityMuted}>
              · {summary.data.votes}{' '}
              {summary.data.votes === 1 ? 'voto' : 'votos'}
            </Text>
          </Text>
        )}
      </View>

      {session ? (
        <>
          <View style={styles.stars}>
            {STARS.map((n) => (
              <Pressable
                key={n}
                onPress={() => setRating.mutate(n)}
                hitSlop={4}
                style={styles.starHit}>
                <Ionicons
                  name={n <= myScore ? 'star' : 'star-outline'}
                  size={24}
                  color={n <= myScore ? colors.gold : colors.textMuted}
                />
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>
            {myScore > 0 ? `Tu nota: ${myScore}/10` : 'Toca para puntuar'}
          </Text>
        </>
      ) : (
        <Link href="/sign-in" asChild>
          <Pressable style={styles.signIn}>
            <Ionicons name="star-outline" size={16} color={colors.text} />
            <Text style={styles.signInText}>Inicia sesión para valorar</Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  community: { color: colors.text, fontSize: 14, fontWeight: '600' },
  communityMuted: { color: colors.textMuted, fontWeight: '400' },
  stars: { flexDirection: 'row', justifyContent: 'space-between' },
  starHit: { padding: 2 },
  hint: { color: colors.textMuted, fontSize: 13 },
  signIn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  signInText: { color: colors.text, fontWeight: '600' },
});
