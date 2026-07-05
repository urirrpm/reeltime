# Puesta en marcha de Reeltime

Guía paso a paso para dejar el MVP funcionando en tu iPhone (o simulador).

## 0. Requisitos

- **Node 20+** (tienes 25, perfecto) y **npm**.
- La app **Expo Go** instalada en tu iPhone (App Store), o Xcode para el simulador.
- Las dependencias ya están instaladas. Si clonas el repo de cero: `npm install`.

---

## 1. Conseguir la API de TMDB (gratis, 2 minutos)

TMDB es la base de datos de series/películas **y** la fuente de "¿dónde verlo?"
(disponibilidad de streaming vía JustWatch).

1. Crea una cuenta en https://www.themoviedb.org/signup
2. Ve a **Settings → API**: https://www.themoviedb.org/settings/api
3. Solicita una API key (tipo "Developer"; el uso personal/dev es gratuito).
4. Copia el **"API Read Access Token"** (es un token largo tipo `eyJ...`).
   ⚠️ Usa el *Read Access Token* (v4), **no** la "API Key (v3)".

---

## 2. Crear el proyecto Supabase (gratis)

Supabase te da login, base de datos y realtime sin montar servidor.

1. Crea un proyecto en https://supabase.com (plan Free).
2. Abre **SQL Editor**, pega el contenido de [`supabase/schema.sql`](../supabase/schema.sql)
   y ejecútalo. Esto crea las tablas y la seguridad (RLS).
3. Ve a **Settings → API** y copia:
   - **Project URL**
   - **anon public key**
4. (Opcional recomendado) En **Authentication → Providers → Email**, desactiva
   "Confirm email" mientras desarrollas para poder entrar sin confirmar el correo.

---

## 3. Configurar variables de entorno

En la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` y rellena:

```
EXPO_PUBLIC_TMDB_ACCESS_TOKEN=eyJ...        # el token de TMDB del paso 1
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # la anon key del paso 2
```

> La app arranca aunque falten estos valores (verás un aviso), pero sin TMDB no
> hay catálogo y sin Supabase no hay cuentas.

---

## 4. Arrancar

```bash
npm start          # abre el panel de Expo; escanea el QR con Expo Go
# o directamente:
npm run ios        # simulador de iOS (requiere Xcode)
```

Si cambias el `.env`, reinicia con caché limpia:

```bash
npx expo start -c
```

---

## 5. Qué deberías ver

- **Descubrir**: carruseles de tendencias, series y películas.
- **Buscar**: busca cualquier título.
- **Ficha de detalle**: sinopsis, reparto, temporadas y **"¿Dónde verlo?"** con
  los logos de las plataformas de tu región.
- **Mi lista / Calendario**: tras iniciar sesión, guarda títulos y sigue estrenos.

---

## Notas y siguientes pasos

- **Región**: por defecto España. Se cambia en **Perfil**. Afecta a idioma y a
  las plataformas de streaming mostradas (el dato es por país).
- **Automatización de datos**: todo el catálogo y la disponibilidad vienen de
  TMDB en tiempo real; no hay nadie actualizando a mano. Para notificaciones
  push de nuevos episodios (Fase 2) se añadirá una tarea programada.
- **Términos**: TMDB requiere atribución. La disponibilidad la provee JustWatch;
  para uso comercial a escala revisa sus condiciones de licencia.
