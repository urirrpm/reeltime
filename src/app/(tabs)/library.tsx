import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PosterCard } from '@/components/PosterCard';
import { Screen } from '@/components/Screen';
import {
  useTrackedItems,
  type TrackStatus,
  type TrackedItem,
} from '@/hooks/useTracking';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';
import type { MediaListItem } from '@/types/tmdb';

const SECTIONS: { status: TrackStatus; label: string }[] = [
  { status: 'watching', label: 'Viendo ahora' },
  { status: 'watchlist', label: 'Pendientes' },
  { status: 'completed', label: 'Vistas' },
];

function toListItem(t: TrackedItem): MediaListItem {
  return {
    id: t.tmdb_id,
    media_type: t.media_type,
    title: t.media_type === 'movie' ? t.title : undefined,
    name: t.media_type === 'tv' ? t.title : undefined,
    poster_path: t.poster_path,
    backdrop_path: null,
  };
}

export default function LibraryScreen() {
  const { session, configured } = useAuth();
  const { data, isLoading } = useTrackedItems();

  if (!configured || !session) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Tu lista te espera</Text>
          <Text style={styles.emptyText}>
            Inicia sesión para guardar series y películas, seguir tu progreso y
            recibir avisos de nuevas temporadas.
          </Text>
          <Link href="/sign-in" asChild>
            <Pressable style={styles.cta}>
              <Text style={styles.ctaText}>Iniciar sesión</Text>
            </Pressable>
          </Link>
        </View>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  const hasAny = (data?.length ?? 0) > 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mi lista</Text>
        {!hasAny && (
          <Text style={styles.emptyText}>
            Aún no sigues nada. Explora y pulsa “Añadir a mi lista” en cualquier
            título.
          </Text>
        )}
        {SECTIONS.map(({ status, label }) => {
          const items = (data ?? []).filter((t) => t.status === status);
          if (items.length === 0) return null;
          return (
            <View key={status} style={styles.section}>
              <Text style={styles.heading}>
                {label} · {items.length}
              </Text>
              <View style={styles.grid}>
                {items.map((t) => (
                  <PosterCard
                    key={`${t.media_type}-${t.tmdb_id}`}
                    item={toListItem(t)}
                    width={104}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  section: { gap: spacing.md },
  heading: { color: colors.text, fontSize: 18, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  loader: { marginTop: spacing.xxl },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
