import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MediaRow } from '@/components/MediaRow';
import { NotificationBell } from '@/components/NotificationBell';
import { Screen } from '@/components/Screen';
import { hasTmdb } from '@/config/env';
import {
  useOnTheAir,
  usePopular,
  useTrending,
  useUpcomingMovies,
} from '@/hooks/useTmdb';
import { colors, spacing, type } from '@/theme';

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
        <View style={styles.header}>
          <Text style={styles.appName}>Reeltime</Text>
          <NotificationBell />
        </View>

        {!hasTmdb() && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Falta configurar TMDB</Text>
            <Text style={styles.bannerText}>
              Añade tu token en el fichero .env para ver el catálogo.
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: { color: colors.text, ...type.hero },
  banner: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    gap: spacing.xs,
  },
  bannerTitle: { color: colors.text, fontWeight: '700' },
  bannerText: { color: colors.textMuted, fontSize: 13 },
});
