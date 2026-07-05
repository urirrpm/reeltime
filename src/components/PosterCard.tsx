import { Link } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';

import { Poster } from '@/components/Poster';
import { displayTitle } from '@/lib/tmdb';
import { colors, shadow, spacing } from '@/theme';
import type { MediaListItem, MediaType } from '@/types/tmdb';

interface Props {
  item: MediaListItem;
  width?: number;
  showTitle?: boolean;
}

/** Tarjeta de póster que enlaza al detalle. */
export function PosterCard({ item, width = 124, showTitle = true }: Props) {
  const type: MediaType = item.media_type ?? (item.title ? 'movie' : 'tv');

  return (
    <Link href={`/title/${type}/${item.id}`} asChild>
      <Pressable style={[styles.card, { width }]}>
        <Poster path={item.poster_path} width={width} style={shadow.card} />
        {showTitle && (
          <Text numberOfLines={2} style={styles.title}>
            {displayTitle(item)}
          </Text>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
