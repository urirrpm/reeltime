import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Poster } from '@/components/Poster';
import { useMediaBrief } from '@/hooks/useTmdb';
import type { FeedItem as FeedItemType } from '@/hooks/useActivityFeed';
import { timeAgo } from '@/lib/format';
import { colors, radius, spacing, type as typo } from '@/theme';

/** Etiqueta "T2E5" a partir de temporada/episodio (o '' si falta). */
function epLabel(season: number | null, episode: number | null): string {
  if (season == null || episode == null) return '';
  return `T${season}E${episode}`;
}

/** Icono representativo de cada tipo de actividad. */
const ICONS: Record<FeedItemType['type'], keyof typeof Ionicons.glyphMap> = {
  rating: 'star',
  comment: 'chatbubble-ellipses',
  character_vote: 'trophy',
  watched: 'checkmark-done',
};

/** Texto de la acción: "valoró con 8/10", "vio 5 episodios", etc. */
function actionText(item: FeedItemType): string {
  const ep = epLabel(item.season_number, item.episode_number);
  switch (item.type) {
    case 'rating':
      return `valoró con ${item.payload?.score ?? '?'}/10`;
    case 'comment':
      return ep ? `comentó el episodio ${ep}` : 'comentó';
    case 'character_vote':
      return `eligió a ${item.payload?.character_name ?? 'un personaje'} como mejor personaje${
        ep ? ` (${ep})` : ''
      }`;
    case 'watched':
      return (item.watchedCount ?? 1) > 1
        ? `vio ${item.watchedCount} episodios`
        : ep
          ? `vio el episodio ${ep}`
          : 'vio un episodio';
  }
}

function FeedItemBase({ item }: { item: FeedItemType }) {
  const { data: brief } = useMediaBrief(item.media_type, item.tmdb_id);
  const title = brief?.title ?? '';
  // El avatar es una URL pública completa (Supabase Storage), no un path de TMDB.
  const avatarUri = item.avatar_url;
  const initial = (item.username ?? '?').charAt(0).toUpperCase();

  return (
    <Link href={`/title/${item.media_type}/${item.tmdb_id}`} asChild>
      <Pressable style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>

        {/* Texto */}
        <View style={styles.body}>
          <Text style={styles.line}>
            <Link href={`/user/${item.actor_id}`} asChild>
              <Text style={styles.user}>@{item.username ?? 'alguien'}</Text>
            </Link>
            <Text style={styles.muted}> {actionText(item)}</Text>
          </Text>
          {!!title && (
            <View style={styles.titleLine}>
              <Ionicons
                name={ICONS[item.type]}
                size={13}
                color={colors.textFaint}
              />
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </View>
          )}
          {item.type === 'comment' && !!item.payload?.excerpt && (
            <Text style={styles.excerpt} numberOfLines={2}>
              «{item.payload.excerpt}»
            </Text>
          )}
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>

        {/* Miniatura */}
        <Poster path={brief?.poster_path} width={46} size="w185" />
      </Pressable>
    </Link>
  );
}

export const FeedItem = memo(FeedItemBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  body: { flex: 1, gap: 2 },
  line: { flexWrap: 'wrap' },
  user: { color: colors.text, ...typo.bodyStrong },
  muted: { color: colors.textMuted, ...typo.body },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  title: { color: colors.text, ...typo.bodyStrong, flexShrink: 1 },
  excerpt: {
    color: colors.textMuted,
    ...typo.caption,
    fontStyle: 'italic',
    marginTop: 1,
  },
  time: { color: colors.textFaint, ...typo.micro, marginTop: 2 },
});
