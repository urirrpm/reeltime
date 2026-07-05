import { Image } from 'expo-image';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { imageUrl } from '@/lib/tmdb';
import { colors, radius } from '@/theme';

interface Props {
  path: string | null | undefined;
  width: number;
  size?: 'w185' | 'w342' | 'w500';
  style?: ViewStyle;
}

/** Póster con relación 2:3 y placeholder cuando no hay imagen. */
export function Poster({ path, width, size = 'w342', style }: Props) {
  const height = width * 1.5;
  const uri = imageUrl(path, size);

  return (
    <View style={[{ width, height }, styles.wrap, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🎬</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 28,
    opacity: 0.5,
  },
});
