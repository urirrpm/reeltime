import { FlatList, Text, View, StyleSheet, ActivityIndicator } from 'react-native';

import { PosterCard } from '@/components/PosterCard';
import { colors, spacing, type } from '@/theme';
import type { MediaListItem } from '@/types/tmdb';

interface Props {
  title: string;
  items: MediaListItem[] | undefined;
  loading?: boolean;
}

/** Carrusel horizontal de pósters (sin títulos, más limpio). */
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
          renderItem={({ item }) => (
            <PosterCard item={item} width={128} showTitle={false} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  heading: {
    color: colors.text,
    ...type.heading,
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  loader: {
    height: 192,
  },
});
