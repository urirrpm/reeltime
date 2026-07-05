-- ============================================================================
-- Programación del cron para notify-new-episodes (Supabase Cron = pg_cron)
-- ----------------------------------------------------------------------------
-- Ejecuta esto UNA VEZ en el SQL Editor de Supabase. No contiene secretos:
-- el CRON_SECRET y la URL se leen desde Supabase Vault (cifrado en reposo).
--
-- Antes de programar, guarda los dos secretos en Vault (sustituye los valores):
--
--   select vault.create_secret(
--     'https://<TU-REF>.supabase.co/functions/v1/notify-new-episodes',
--     'notify_fn_url');
--   select vault.create_secret('<TU_CRON_SECRET>', 'notify_cron_secret');
--
-- (Si ya existían, bórralos antes con:
--   delete from vault.secrets where name in ('notify_fn_url','notify_cron_secret'); )
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Evita duplicar el job si vuelves a ejecutar esto.
select cron.unschedule('notify-new-episodes')
where exists (select 1 from cron.job where jobname = 'notify-new-episodes');

-- Todos los días a las 08:00 UTC (~09:00/10:00 en Madrid según horario de verano).
-- La función recalcula internamente la fecha "hoy" en zona Europe/Madrid.
select cron.schedule(
  'notify-new-episodes',
  '0 8 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
              where name = 'notify_fn_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets
                          where name = 'notify_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para comprobar el estado del job y sus ejecuciones:
--   select * from cron.job where jobname = 'notify-new-episodes';
--   select * from cron.job_run_details order by start_time desc limit 10;
