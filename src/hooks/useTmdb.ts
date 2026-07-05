import { useQuery } from '@tanstack/react-query';

import { useRegion } from '@/providers/RegionProvider';
import {
  getDetail,
  getEpisode,
  getMediaBrief,
  getOnTheAir,
  getPopular,
  getSeasonEpisodes,
  getTrending,
  getUpcomingMovies,
  searchMulti,
} from '@/lib/tmdb';
import type { MediaType } from '@/types/tmdb';

export function useTrending() {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['trending', region.code],
    queryFn: () => getTrending(region),
  });
}

export function usePopular(type: MediaType) {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['popular', type, region.code],
    queryFn: () => getPopular(type, region),
  });
}

export function useOnTheAir() {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['on_the_air', region.code],
    queryFn: () => getOnTheAir(region),
  });
}

export function useUpcomingMovies() {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['upcoming', region.code],
    queryFn: () => getUpcomingMovies(region),
  });
}

export function useSearch(query: string) {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['search', query, region.code],
    queryFn: () => searchMulti(query, region),
    enabled: query.trim().length > 1,
  });
}

/** Título + póster (ligero) de una obra, para el feed. Cacheado por id/región. */
export function useMediaBrief(type: MediaType, id: number) {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['brief', type, id, region.code],
    queryFn: () => getMediaBrief(type, id, region),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 1000 * 60 * 60, // los títulos no cambian; 1h de caché
  });
}

export function useDetail(type: MediaType, id: number) {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['detail', type, id, region.code],
    queryFn: () => getDetail(type, id, region),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useSeasonEpisodes(
  tvId: number,
  seasonNumber: number,
  enabled = true,
) {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['season', tvId, seasonNumber, region.code],
    queryFn: () => getSeasonEpisodes(tvId, seasonNumber, region),
    enabled: enabled && Number.isFinite(tvId) && seasonNumber >= 0,
  });
}

export function useEpisode(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number,
) {
  const { region } = useRegion();
  return useQuery({
    queryKey: ['episode', tvId, seasonNumber, episodeNumber, region.code],
    queryFn: () => getEpisode(tvId, seasonNumber, episodeNumber, region),
    enabled:
      Number.isFinite(tvId) &&
      Number.isFinite(seasonNumber) &&
      Number.isFinite(episodeNumber),
  });
}
