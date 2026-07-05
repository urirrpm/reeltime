# notify-new-episodes

Cron autónomo que avisa por push cuando se estrena un nuevo episodio de una
serie seguida. No necesita mantenimiento humano: cruza `tracked_items` con
`next_episode_to_air` de TMDB y envía por la Expo Push API.

## Despliegue (una sola vez)

Requiere la CLI de Supabase y haber iniciado sesión.

```bash
# 1. Login + enlazar el proyecto (interactivo la primera vez)
npx supabase login
npx supabase link --project-ref nnakbbvfpbpdwwkisgvc

# 2. Secretos que usa la función (NO se suben a git)
npx supabase secrets set TMDB_ACCESS_TOKEN="<tu token v4 de TMDB>"
npx supabase secrets set CRON_SECRET="<el CRON_SECRET generado>"
#   (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta la plataforma)

# 3. Desplegar la función sin verificación de JWT (la protege x-cron-secret)
npx supabase functions deploy notify-new-episodes --no-verify-jwt
```

## Programar el cron

1. Guarda la URL y el secreto en Vault y programa el job ejecutando
   `schedule.sql` en el SQL Editor (ver instrucciones dentro del fichero).

## Probar a mano

```bash
curl -i -X POST \
  https://nnakbbvfpbpdwwkisgvc.supabase.co/functions/v1/notify-new-episodes \
  -H "x-cron-secret: <el CRON_SECRET>"
```

Respuesta esperada: JSON con `date`, `candidates`, `claimed`, `pushes`.
Para forzar un envío de prueba: sigue una serie cuyo `next_episode_to_air`
sea hoy (o ajusta temporalmente la comparación de fecha en `index.ts`).
