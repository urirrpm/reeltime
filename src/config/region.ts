/**
 * Región e idioma. La disponibilidad de streaming (watch providers) de TMDB
 * es POR PAÍS, así que todo dato de "dónde verlo" se filtra con `watchRegion`.
 * El idioma controla títulos/sinopsis. Por ahora es una constante; en el futuro
 * se puede mover a ajustes del usuario (AsyncStorage) sin tocar el resto.
 */
export type RegionCode = 'ES' | 'MX' | 'AR' | 'CO' | 'CL' | 'US';

export interface RegionOption {
  code: RegionCode;
  label: string;
  language: string; // formato TMDB: es-ES, es-MX, en-US
}

export const REGIONS: RegionOption[] = [
  { code: 'ES', label: 'España', language: 'es-ES' },
  { code: 'MX', label: 'México', language: 'es-MX' },
  { code: 'AR', label: 'Argentina', language: 'es-AR' },
  { code: 'CO', label: 'Colombia', language: 'es-CO' },
  { code: 'CL', label: 'Chile', language: 'es-CL' },
  { code: 'US', label: 'Estados Unidos', language: 'en-US' },
];

export const DEFAULT_REGION: RegionOption = REGIONS[0];
