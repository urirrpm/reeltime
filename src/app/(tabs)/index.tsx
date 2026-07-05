import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MediaRow } from '@/components/MediaRow';
import { Screen } from '@/components/Screen';
import { hasTmdb } from '@/config/env';
import {
  useOnTheAir,
  usePopular,
  useTrending,
  useUpcomingMovies,
} from '@/hooks/useTmdb';
import { colors, spacing } from '@/theme';

export default function DiscoverScreen() {
  const trending = useTrending();
  const onAir = useOnTheAir();
  const popularTv = usePopular('tv');
  const popularMovies = usePopular('movie');
  const upcoming = useUpcomingMovies();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.appName}>Reeltime</Text>

        {!hasTmdb() && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Falta configurar TMDB</Text>
            <Text style={styles.bannerText}>
              Añade tu token en el fichero .env para ver el catálogo. Consulta
              docs/SETUP.md.
            </Text>
          </View>
        )}

        <MediaRow
          title="Tendencias esta semana"
          items={trending.data}
          loading={trending.isLoading}
        />
        <MediaRow
          title="Series en emisión"
          items={onAir.data}
          loading={onAir.isLoading}
        />
        <MediaRow
          title="Series populares"
          items={popularTv.data}
          loading={popularTv.isLoading}
        />
        <MediaRow
          title="Películas populares"
          items={popularMovies.data}
          loading={popularMovies.isLoading}
        />
        <MediaRow
          title="Próximos estrenos"
          items={upcoming.data}
          loading={upcoming.isLoading}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingVertical: spacing.lg,
  },
  appName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
  },
  banner: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  bannerTitle: { color: colors.text, fontWeight: '700' },
  bannerText: { color: colors.textMuted, fontSize: 13 },
});
