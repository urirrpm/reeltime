import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CommentsSection } from '@/components/CommentsSection';
import { Poster } from '@/components/Poster';
import { ProgressBar } from '@/components/ProgressBar';
import { RatingBox } from '@/components/RatingBox';
import { ShareButton } from '@/components/ShareButton';
import { TitleActions } from '@/components/TitleActions';
import { WatchProviders } from '@/components/WatchProviders';
import { useDetail } from '@/hooks/useTmdb';
import {
  useRemoveTracking,
  useSetTracking,
  useTrackStatus,
  type TrackStatus,
} from '@/hooks/useTracking';
import { useWatchedEpisodes } from '@/hooks/useWatched';
import { haptics } from '@/lib/haptics';
import { imageUrl } from '@/lib/tmdb';
import { formatRuntime, year } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type as typo } from '@/theme';
import type { MediaDetail, MediaType } from '@/types/tmdb';

const STATUS_OPTIONS: { status: TrackStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'watchlist', label: 'Pendiente', icon: 'bookmark-outline' },
  { status: 'watching', label: 'Viendo', icon: 'play-outline' },
  { status: 'completed', label: 'Vista', icon: 'checkmark-done-outline' },
];

export default function TitleDetailScreen() {
  const params = useLocalSearchParams<{ type: string; id: string }>();
  const type = (params.type === 'movie' ? 'movie' : 'tv') as MediaType;
  const id = Number(params.id);

  const { data, isLoading, isError } = useDetail(type, id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No se pudo cargar este título.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: data.title,
          headerRight: () => (
            <ShareButton
              path={`title/${data.media_type}/${data.id}`}
              title={data.title}
            />
          ),
        }}
      />

      {/* Backdrop con degradado hacia el fondo */}
      <View style={styles.backdropWrap}>
        {data.backdrop_path && (
          <Image
            source={{ uri: imageUrl(data.backdrop_path, 'w780') ?? undefined }}
            style={styles.backdrop}
            contentFit="cover"
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.55)', colors.bg]}
          locations={[0, 0.6, 1]}
          style={styles.backdropFade}
        />
      </View>

      <View style={styles.body}>
        {/* Cabecera: póster + meta */}
        <View style={styles.headerRow}>
          <Poster path={data.poster_path} width={110} />
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.meta}>
              {year(data.releaseDate)}
              {type === 'tv' && data.numberOfSeasons
                ? ` · ${data.numberOfSeasons} temp.`
                : ''}
              {type === 'movie' && data.runtime
                ? ` · ${formatRuntime(data.runtime)}`
                : ''}
            </Text>
            {data.vote_average > 0 && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={styles.rating}>
                  {data.vote_average.toFixed(1)}
                </Text>
                <Text style={styles.muted}>· {data.vote_count} votos</Text>
              </View>
            )}
            <View style={styles.genres}>
              {data.genres.slice(0, 3).map((g) => (
                <View key={g.id} style={styles.genreChip}>
                  <Text style={styles.genreText}>{g.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <TrackControls detail={data} />

        <TitleActions detail={data} />

        {type === 'tv' && <SeriesProgress detail={data} />}

        <RatingBox tmdbId={data.id} mediaType={data.media_type} />

        {data.trailer && (
          <Pressable
            style={styles.trailerBtn}
            onPress={() =>
              Linking.openURL(
                `https://www.youtube.com/watch?v=${data.trailer!.key}`,
              )
            }>
            <Ionicons name="logo-youtube" size={18} color={colors.text} />
            <Text style={styles.trailerText}>Ver tráiler</Text>
          </Pressable>
        )}

        {!!data.overview && (
          <Section title="Sinopsis">
            <Text style={styles.overview}>{data.overview}</Text>
          </Section>
        )}

        <Section title="¿Dónde verlo?">
          <WatchProviders providers={data.providers} />
        </Section>

        {type === 'tv' && (data.seasons?.length ?? 0) > 0 && (
          <Section title="Temporadas">
            {data.seasons!.map((s) => (
              <Link
                key={s.id}
                href={`/season/${data.id}/${s.season_number}`}
                asChild>
                <Pressable style={styles.seasonRow}>
                  <Poster path={s.poster_path} width={44} />
                  <View style={styles.seasonInfo}>
                    <Text style={styles.seasonName}>{s.name}</Text>
                    <Text style={styles.muted}>
                      {s.episode_count} episodios
                      {s.air_date ? ` · ${year(s.air_date)}` : ''}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </Link>
            ))}
          </Section>
        )}

        {data.cast.length > 0 && (
          <Section title="Reparto">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castList}>
              {data.cast.map((c) => (
                <View key={c.id} style={styles.castCard}>
                  <Image
                    source={{
                      uri: imageUrl(c.profile_path, 'w185') ?? undefined,
                    }}
                    style={styles.castImg}
                    contentFit="cover"
                  />
                  <Text style={styles.castName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={styles.castChar} numberOfLines={1}>
                    {c.character}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Section>
        )}

        <CommentsSection tmdbId={data.id} mediaType={data.media_type} />
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** Progreso de la serie: episodios vistos / total. Solo si hay sesión. */
function SeriesProgress({ detail }: { detail: MediaDetail }) {
  const { session } = useAuth();
  const { data: watched } = useWatchedEpisodes(detail.id);
  const total = detail.numberOfEpisodes ?? 0;

  if (!session || total === 0) return null;

  const seen = Math.min(watched?.length ?? 0, total);
  const pct = total ? seen / total : 0;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>Tu progreso</Text>
        <Text style={styles.progressValue}>
          {seen}/{total} · {Math.round(pct * 100)}%
        </Text>
      </View>
      <ProgressBar value={pct} />
      {seen === total && (
        <Text style={styles.progressDone}>¡Serie completada!</Text>
      )}
    </View>
  );
}

/** Botones de estado de seguimiento (requieren sesión). */
function TrackControls({ detail }: { detail: MediaDetail }) {
  const router = useRouter();
  const { session } = useAuth();
  const current = useTrackStatus(detail.id, detail.media_type);
  const setTracking = useSetTracking();
  const remove = useRemoveTracking();

  if (!session) {
    return (
      <Link href="/sign-in" asChild>
        <Pressable style={styles.signInPrompt}>
          <Ionicons name="add" size={18} color={colors.text} />
          <Text style={styles.signInPromptText}>
            Inicia sesión para añadir a tu lista
          </Text>
        </Pressable>
      </Link>
    );
  }

  const choose = (status: TrackStatus) => {
    haptics.light();
    if (current?.status === status) {
      remove.mutate({ tmdb_id: detail.id, media_type: detail.media_type });
    } else {
      setTracking.mutate({
        tmdb_id: detail.id,
        media_type: detail.media_type,
        title: detail.title,
        poster_path: detail.poster_path,
        status,
      });
    }
  };

  return (
    <View style={styles.trackRow}>
      {STATUS_OPTIONS.map((opt) => {
        const active = current?.status === opt.status;
        return (
          <Pressable
            key={opt.status}
            onPress={() => choose(opt.status)}
            style={[styles.trackBtn, active && styles.trackBtnActive]}>
            <Ionicons
              name={opt.icon}
              size={18}
              color={active ? colors.onAccent : colors.textMuted}
            />
            <Text
              style={[styles.trackBtnText, active && styles.trackBtnTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: spacing.xxl },
  backdropWrap: { height: 260, backgroundColor: colors.surfaceAlt },
  backdrop: { width: '100%', height: 260, opacity: 0.9 },
  backdropFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  body: { padding: spacing.lg, gap: spacing.xl, marginTop: -72 },
  headerRow: { flexDirection: 'row', gap: spacing.md },
  headerInfo: { flex: 1, gap: spacing.xs, justifyContent: 'flex-end' },
  title: { color: colors.text, ...typo.title },
  meta: { color: colors.textMuted, fontSize: 14 },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { color: colors.text, ...typo.bodyStrong },
  progressValue: { color: colors.textMuted, ...typo.bodyStrong },
  progressDone: { color: colors.green, ...typo.caption, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: colors.text, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 13 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
  genreChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  genreText: { color: colors.textMuted, fontSize: 12 },
  trackRow: { flexDirection: 'row', gap: spacing.sm },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  trackBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  trackBtnTextActive: { color: colors.onAccent },
  signInPrompt: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signInPromptText: { color: colors.text, fontWeight: '600' },
  trailerBtn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  trailerText: { color: colors.text, fontWeight: '600' },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  overview: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  seasonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  seasonInfo: { flex: 1 },
  seasonName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  castList: { gap: spacing.md },
  castCard: { width: 84, gap: 2 },
  castImg: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  castName: { color: colors.text, fontSize: 12, fontWeight: '600' },
  castChar: { color: colors.textMuted, fontSize: 11 },
});
