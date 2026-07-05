/**
 * Sistema de diseño de Reeltime — claro, limpio y moderno (estilo apps oficiales
 * de Apple). Fondo blanco, superficies gris muy claro para dar profundidad sin
 * bordes duros, tipografía cuidada y mucho aire.
 */
export const colors = {
  bg: '#FFFFFF',
  surface: '#F4F4F6', // tarjetas
  surfaceAlt: '#EAEAEF',
  surfaceHigh: '#E0E0E6',
  border: 'rgba(0,0,0,0.06)',
  hairline: 'rgba(0,0,0,0.09)',
  text: '#0E0E12',
  textMuted: '#6B6B73',
  textFaint: '#AEAEB6',
  primary: '#6C4CF0',
  primarySoft: 'rgba(108,76,240,0.12)',
  onAccent: '#FFFFFF', // texto/iconos sobre primary o green
  gold: '#E0A400',
  green: '#34C759',
  danger: '#FF3B30',
  overlay: 'rgba(255,255,255,0.0)',
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
  hero: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.6 },
  title: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4 },
  heading: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 11, fontWeight: '600' as const },
};

/** Sombra sutil para tarjetas y pósters (iOS/Android). */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
};
