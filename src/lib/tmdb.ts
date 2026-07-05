import { ENV } from '@/config/env';
import { DEFAULT_REGION, type RegionOption } from '@/config/region';
import type {
  Episode,
  EpisodeDetail,
  MediaDetail,
  MediaListItem,
  MediaType,
  Video,
} from '@/types/tmdb';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

/** Construye la URL de una imagen de TMDB. Devuelve null si no hay path. */
export function imageUrl(
  path: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342',
): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

class TmdbError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  if (!ENV.tmdbAccessToken) {
    throw new TmdbError(
      'Falta EXPO_PUBLIC_TMDB_ACCESS_TOKEN. Añádelo en tu fichero .env (ver docs/SETUP.md).',
      0,
    );
  }
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${ENV.tmdbAccessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new TmdbError(`TMDB ${path} respondió ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

interface Paginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

/** Título mostrable de un item, sea peli o serie. */
export function displayTitle(item: {
  title?: string;
  name?: string;
}): string {
  return item.title ?? item.name ?? 'Sin título';
}

/** Fecha de estreno normalizada. */
export function displayDate(item: {
  release_date?: string;
  first_air_date?: string;
}): string | null {
  return item.release_date ?? item.first_air_date ?? null;
}

// ---------------------------------------------------------------------------
// Descubrir / listas
// ---------------------------------------------------------------------------

export async function getTrending(
  region: RegionOption = DEFAULT_REGION,
): Promise<MediaListItem[]> {
  const data = await request<Paginated<MediaListItem>>('/trending/all/week', {
    language: region.language,
  });
  return data.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv');
}

export async function getPopular(
  type: MediaType,
  region: RegionOption = DEFAULT_REGION,
): Promise<MediaListItem[]> {
  const data = await request<Paginated<MediaListItem>>(`/${type}/popular`, {
    language: region.language,
    region: region.code,
  });
  return data.results.map((r) => ({ ...r, media_type: type }));
}

/** Series que emiten estos días (para la home). */
export async function getOnTheAir(
  region: RegionOption = DEFAULT_REGION,
): Promise<MediaListItem[]> {
  const data = await request<Paginated<MediaListItem>>('/tv/on_the_air', {
    language: region.language,
  });
  return data.results.map((r) => ({ ...r, media_type: 'tv' as const }));
}

export async function getUpcomingMovies(
  region: RegionOption = DEFAULT_REGION,
): Promise<MediaListItem[]> {
  const data = await request<Paginated<MediaListItem>>('/movie/upcoming', {
    language: region.language,
    region: region.code,
  });
  return data.results.map((r) => ({ ...r, media_type: 'movie' as const }));
}

/**
 * Datos mínimos de una obra (título + póster). Se usa en el feed social para
 * resolver el nombre a partir de tmdb_id + media_type sin traer el detalle
 * completo. TanStack Query cachea por (tipo, id, región) así que títulos
 * repetidos no vuelven a pedirse.
 */
export interface MediaBrief {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  /** Duración en minutos: de la película, o media por episodio en series. */
  runtime: number | null;
}

export async function getMediaBrief(
  type: MediaType,
  id: number,
  region: RegionOption = DEFAULT_REGION,
): Promise<MediaBrief> {
  const raw = await request<any>(`/${type}/${id}`, { language: region.language });
  const runtime =
    type === 'tv'
      ? (raw.episode_run_time?.[0] ?? null)
      : (raw.runtime ?? null);
  return {
    id: raw.id,
    media_type: type,
    title: raw.title ?? raw.name ?? 'Sin título',
    poster_path: raw.poster_path ?? null,
    runtime,
  };
}

// ---------------------------------------------------------------------------
// Búsqueda
// ---------------------------------------------------------------------------

export async function searchMulti(
  query: string,
  region: RegionOption = DEFAULT_REGION,
): Promise<MediaListItem[]> {
  if (!query.trim()) return [];
  const data = await request<Paginated<MediaListItem>>('/search/multi', {
    query,
    language: region.language,
    include_adult: 'false',
  });
  return data.results.filter(
    (r) => r.media_type === 'movie' || r.media_type === 'tv',
  );
}

// ---------------------------------------------------------------------------
// Detalle (normaliza peli y serie a MediaDetail)
// ---------------------------------------------------------------------------

interface RawProviders {
  results: Record<
    string,
    {
      link?: string;
      flatrate?: any[];
      rent?: any[];
      buy?: any[];
      ads?: any[];
      free?: any[];
    }
  >;
}

function pickTrailer(videos?: { results?: Video[] }): Video | null {
  const list = videos?.results ?? [];
  const yt = list.filter((v) => v.site === 'YouTube');
  return (
    yt.find((v) => v.type === 'Trailer' && v.official) ??
    yt.find((v) => v.type === 'Trailer') ??
    yt.find((v) => v.type === 'Teaser') ??
    yt[0] ??
    null
  );
}

export async function getDetail(
  type: MediaType,
  id: number,
  region: RegionOption = DEFAULT_REGION,
): Promise<MediaDetail> {
  const append =
    type === 'tv'
      ? 'aggregate_credits,watch/providers,videos'
      : 'credits,watch/providers,videos';

  const raw = await request<any>(`/${type}/${id}`, {
    language: region.language,
    append_to_response: append,
  });

  const providersBlock: RawProviders['results'][string] | undefined = (
    raw['watch/providers'] as RawProviders | undefined
  )?.results?.[region.code];

  const credits = type === 'tv' ? raw.aggregate_credits : raw.credits;

  return {
    id: raw.id,
    media_type: type,
    title: raw.title ?? raw.name ?? 'Sin título',
    overview: raw.overview ?? '',
    poster_path: raw.poster_path,
    backdrop_path: raw.backdrop_path,
    vote_average: raw.vote_average ?? 0,
    vote_count: raw.vote_count ?? 0,
    genres: raw.genres ?? [],
    releaseDate: raw.release_date ?? raw.first_air_date ?? null,
    runtime: raw.runtime,
    numberOfSeasons: raw.number_of_seasons,
    numberOfEpisodes: raw.number_of_episodes,
    seasons: (raw.seasons ?? []).filter(
      (s: any) => s.season_number !== 0, // ocultar "Especiales" por defecto
    ),
    cast: (credits?.cast ?? []).slice(0, 20).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character ?? c.roles?.[0]?.character,
      profile_path: c.profile_path,
    })),
    providers: providersBlock
      ? {
          link: providersBlock.link,
          flatrate: providersBlock.flatrate,
          rent: providersBlock.rent,
          buy: providersBlock.buy,
          ads: providersBlock.ads,
          free: providersBlock.free,
        }
      : null,
    providersLink: providersBlock?.link,
    trailer: pickTrailer(raw.videos),
    status: raw.status,
    tagline: raw.tagline,
  };
}

export interface NextEpisodeInfo {
  tvId: number;
  title: string;
  poster_path: string | null;
  episode: {
    name: string;
    season_number: number;
    episode_number: number;
    air_date: string | null;
  } | null;
}

/**
 * Próximo episodio a emitir de una serie. Se usa en el Calendario para
 * construir la agenda de estrenos de lo que el usuario sigue.
 */
export async function getNextEpisode(
  tvId: number,
  region: RegionOption = DEFAULT_REGION,
): Promise<NextEpisodeInfo> {
  const raw = await request<any>(`/tv/${tvId}`, { language: region.language });
  const next = raw.next_episode_to_air;
  return {
    tvId,
    title: raw.name ?? raw.title ?? 'Serie',
    poster_path: raw.poster_path,
    episode: next
      ? {
          name: next.name,
          season_number: next.season_number,
          episode_number: next.episode_number,
          air_date: next.air_date,
        }
      : null,
  };
}

export async function getSeasonEpisodes(
  tvId: number,
  seasonNumber: number,
  region: RegionOption = DEFAULT_REGION,
): Promise<Episode[]> {
  const data = await request<{ episodes: Episode[] }>(
    `/tv/${tvId}/season/${seasonNumber}`,
    { language: region.language },
  );
  return data.episodes ?? [];
}

/** Detalle de un episodio + su reparto (principal e invitados, sin duplicados). */
export async function getEpisode(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number,
  region: RegionOption = DEFAULT_REGION,
): Promise<EpisodeDetail> {
  const raw = await request<any>(
    `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
    { language: region.language, append_to_response: 'credits' },
  );

  const people = [
    ...(raw.credits?.cast ?? []),
    ...(raw.credits?.guest_stars ?? []),
  ];
  const seen = new Set<number>();
  const cast = [] as EpisodeDetail['cast'];
  for (const p of people) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    cast.push({
      id: p.id,
      name: p.name,
      character: p.character,
      profile_path: p.profile_path,
    });
    if (cast.length >= 30) break;
  }

  return {
    id: raw.id,
    episode_number: raw.episode_number,
    season_number: raw.season_number,
    name: raw.name,
    overview: raw.overview ?? '',
    air_date: raw.air_date ?? null,
    still_path: raw.still_path,
    runtime: raw.runtime ?? null,
    vote_average: raw.vote_average,
    cast,
  };
}
