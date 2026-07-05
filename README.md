# Reeltime 🎬

Rastreador social de series y películas — un sustituto de **TV Time** (que cierra).
Sigue lo que ves, descubre **dónde está disponible** cada título en tu país, y
recibe el calendario de nuevos episodios. Construido para iPhone (y Android en el
futuro) con un único código.

## Stack

| Capa | Tecnología |
|------|-----------|
| App móvil | **Expo (React Native) + TypeScript + Expo Router** |
| Datos de caché | **TanStack Query** |
| Catálogo + "¿dónde verlo?" | **TMDB API** (disponibilidad vía JustWatch) |
| Backend (auth, DB, realtime) | **Supabase** |

Un solo código → **iOS y Android**. El catálogo y la disponibilidad se
actualizan **solos** desde TMDB: no hace falta gente manteniendo datos.

## Arranque rápido

Ver la guía completa en **[`docs/SETUP.md`](docs/SETUP.md)**. Resumen:

```bash
cp .env.example .env      # y rellena tokens de TMDB + Supabase
npm start                 # escanea el QR con Expo Go
```

## Estructura

```
src/
  app/                 # rutas (Expo Router)
    (tabs)/            # Descubrir · Buscar · Mi lista · Calendario · Perfil
    title/[type]/[id]  # ficha de detalle (peli o serie)
    sign-in.tsx        # login / registro
  components/          # Poster, PosterCard, MediaRow, WatchProviders…
  hooks/               # useTmdb (catálogo), useTracking (Supabase)
  lib/                 # tmdb.ts (cliente API), supabase.ts, format.ts
  providers/           # Query, Auth, Region
  config/              # env, regiones
  types/               # tipos de TMDB
supabase/schema.sql    # tablas + RLS (aplícalo en el SQL Editor de Supabase)
```

## Hoja de ruta

- **Fase 1 (este MVP)** ✅ tracking, descubrir, buscar, detalle con "dónde verlo",
  calendario de estrenos, cuentas.
- **Fase 2** — notificaciones push de nuevos episodios; capa social: valoraciones,
  comentarios públicos por título/episodio, encuestas ("mejor personaje del
  capítulo"). *Las tablas de Supabase ya están preparadas en `schema.sql`.*
- **Fase 3** — feed de actividad, seguir usuarios, pulido y publicación en Android.

## Créditos de datos

Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
Datos de disponibilidad de streaming por JustWatch.
