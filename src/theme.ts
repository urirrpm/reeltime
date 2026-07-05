/**
 * Sistema de diseño de Reeltime — "dark minimal" moderno.
 * Sin bordes duros por todas partes: la profundidad se da con superficies
 * elevadas y sombras muy sutiles. Mucho aire y tipografía clara.
 */
export const colors = {
  bg: '#0A0A0C',
  surface: '#141418',
  surfaceAlt: '#1E1E24',
  surfaceHigh: '#26262E',
  border: '#26262E',
  hairline: 'rgba(255,255,255,0.08)',
  text: '#F5F5F7',
  textMuted: '#8E8E98',
  textFaint: '#5A5A64',
  primary: '#7C5CFF',
  primarySoft: 'rgba(124,92,255,0.16)',
  gold: '#F5C518',
  green: '#32D74B',
  danger: '#FF453A',
  overlay: 'rgba(10,10,12,0.0)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

/** Escala tipográfica coherente. */
export const type = {
  hero: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 11, fontWeight: '600' as const },
};

/** Sombra sutil para tarjetas (iOS/Android). */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
