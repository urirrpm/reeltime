-- ============================================================================
-- Programación del cron para notify-social (push de notificaciones sociales)
-- Ejecuta esto UNA VEZ en el SQL Editor. Reutiliza el secreto notify_cron_secret
-- ya guardado en Vault (ver notify-new-episodes/schedule.sql). Solo hace falta
-- guardar la URL de esta función:
--
--   select vault.create_secret(
--     'https://<TU-REF>.supabase.co/functions/v1/notify-social',
--     'notify_social_fn_url');
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('notify-social')
where exists (select 1 from cron.job where jobname = 'notify-social');

-- Cada 2 minutos: entrega casi en tiempo real de las push sociales.
select cron.schedule(
  'notify-social',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
              where name = 'notify_social_fn_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets
                          where name = 'notify_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
