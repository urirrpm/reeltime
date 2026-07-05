import { FlatList, Text, View, StyleSheet, ActivityIndicator } from 'react-native';

import { PosterCard } from '@/components/PosterCard';
import { colors, spacing } from '@/theme';
import type { MediaListItem } from '@/types/tmdb';

interface Props {
  title: string;
  items: MediaListItem[] | undefined;
  loading?: boolean;
}

/** Carrusel horizontal de pósters con título de sección. */
export function MediaRow({ title, items, loading }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PosterCard item={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  loader: {
    height: 180,
  },
});
