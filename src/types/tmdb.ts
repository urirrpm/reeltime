/** Tipos (parciales) de la API de TMDB. Solo los campos que usa la app. */

export type MediaType = 'movie' | 'tv';

/** Elemento tal como aparece en listas y búsquedas (multi). */
export interface MediaListItem {
  id: number;
  media_type?: MediaType; // presente en /search/multi y /trending/all
  title?: string; // películas
  name?: string; // series
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  release_date?: string; // películas
  first_air_date?: string; // series
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  roles?: { character: string }[]; // aggregate_credits (series)
  profile_path: string | null;
}

export interface SeasonSummary {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview?: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
  vote_average?: number;
}

/** Un proveedor concreto (Netflix, HBO Max…) dentro de un país. */
export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

/** Bloque de watch/providers para UN país. */
export interface WatchProviderCountry {
  link?: string;
  flatrate?: WatchProvider[]; // incluido en suscripción
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  ads?: WatchProvider[];
  free?: WatchProvider[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string; // "YouTube"
  type: string; // "Trailer", "Teaser"...
  official: boolean;
}

/** Detalle unificado de película o serie. */
export interface MediaDetail {
  id: number;
  media_type: MediaType;
  title: string; // normalizado (title || name)
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  releaseDate: string | null; // normalizado
  runtime?: number | null; // películas
  numberOfSeasons?: number; // series
  numberOfEpisodes?: number; // series
  seasons?: SeasonSummary[]; // series
  cast: CastMember[];
  providers: WatchProviderCountry | null; // ya filtrado por región
  providersLink?: string;
  trailer: Video | null;
  status?: string;
  tagline?: string;
}
