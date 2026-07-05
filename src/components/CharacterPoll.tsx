import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  useEpisodeResults,
  useMyCharacterVote,
  useVoteCharacter,
} from '@/hooks/useCharacterPoll';
import { imageUrl } from '@/lib/tmdb';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';
import type { CastMember } from '@/types/tmdb';

interface Props {
  tvId: number;
  season: number;
  episode: number;
  cast: CastMember[];
}

/** Encuesta "¿mejor personaje del episodio?" con % de la comunidad. */
export function CharacterPoll({ tvId, season, episode, cast }: Props) {
  const { session } = useAuth();
  const results = useEpisodeResults(tvId, season, episode);
  const myVote = useMyCharacterVote(tvId, season, episode);
  const vote = useVoteCharacter(tvId, season, episode);

  const pctById = new Map<number, { pct: number; votes: number }>();
  let totalVotes = 0;
  for (const r of results.data ?? []) {
    pctById.set(r.character_id, { pct: r.pct, votes: r.votes });
    totalVotes += r.votes;
  }
  const hasResults = totalVotes > 0;

  // Mostrar los personajes principales; si hay votos, ordenar por más votados.
  const options = [...cast].slice(0, 14).sort((a, b) => {
    const pa = pctById.get(a.id)?.votes ?? 0;
    const pb = pctById.get(b.id)?.votes ?? 0;
    return pb - pa;
  });

  return (
    <View style={styles.section}>
      <Text style={styles.title}>¿Mejor personaje del episodio?</Text>
      <Text style={styles.subtitle}>
        {hasResults
          ? `${totalVotes} ${totalVotes === 1 ? 'voto' : 'votos'} de la comunidad`
          : 'Sé el primero en votar'}
      </Text>

      {!session && (
        <Link href="/sign-in" asChild>
          <Pressable style={styles.signIn}>
            <Ionicons name="trophy-outline" size={16} color={colors.text} />
            <Text style={styles.signInText}>Inicia sesión para votar</Text>
          </Pressable>
        </Link>
      )}

      <View style={styles.list}>
        {options.map((c) => {
          const res = pctById.get(c.id);
          const pct = res?.pct ?? 0;
          const isMine = myVote.data === c.id;
          return (
            <Pressable
              key={c.id}
              disabled={!session || vote.isPending}
              onPress={() =>
                vote.mutate({
                  character_id: c.id,
                  character_name: c.character || c.name,
                  profile_path: c.profile_path,
                })
              }
              style={[styles.row, isMine && styles.rowMine]}>
              {/* Barra de fondo proporcional al % */}
              {hasResults && (
                <View
                  style={[
                    styles.bar,
                    { width: `${Math.max(pct, 2)}%` },
                    isMine && styles.barMine,
                  ]}
                />
              )}
              <View style={styles.rowContent}>
                <Image
                  source={{ uri: imageUrl(c.profile_path, 'w185') ?? undefined }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View style={styles.names}>
                  <Text style={styles.character} numberOfLines={1}>
                    {c.character || c.name}
                  </Text>
                  {!!c.character && (
                    <Text style={styles.actor} numberOfLines={1}>
                      {c.name}
                    </Text>
                  )}
                </View>
                {isMine && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                  />
                )}
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
  list: { gap: spacing.sm, marginTop: spacing.xs },
  row: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rowMine: { borderColor: colors.primary },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.surfaceAlt,
  },
  barMine: { backgroundColor: 'rgba(124,92,255,0.25)' },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  names: { flex: 1 },
  character: { color: colors.text, fontSize: 15, fontWeight: '600' },
  actor: { color: colors.textMuted, fontSize: 12 },
  pct: { color: colors.text, fontSize: 15, fontWeight: '700', minWidth: 44, textAlign: 'right' },
});
