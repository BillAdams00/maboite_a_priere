-- ==============================================================================
-- Activation de Row Level Security (RLS) et Révocation des Privilèges Publics
-- ==============================================================================
-- Objectif de sécurité :
-- 1. Empêcher l'exposition involontaire des données via PostgREST (Supabase)
--    utilisant les clés publiques anon ou authenticated.
-- 2. Aucune politique (POLICY) n'est créée : tout accès direct via PostgREST
--    est strictement bloqué par défaut.
-- 3. Prisma se connecte via l'utilisateur 'postgres' (direct ou via Transaction Pooler)
--    qui possède le privilège BYPASSRLS par défaut dans PostgreSQL.
-- 4. Ce script est strictement idempotent.
-- ==============================================================================

-- 1. Activer RLS sur toutes les tables du schéma
ALTER TABLE IF EXISTS public."PrayerRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."PrayerAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."AdminInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."AnsweredClaim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."DailyStat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."UsedExpressToken" ENABLE ROW LEVEL SECURITY;

-- 2. Révocation de tous les privilèges pour les rôles Supabase 'anon' et 'authenticated'
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'PrayerRequest',
    'PrayerAction',
    'Admin',
    'AdminInvitation',
    'AnsweredClaim',
    'Report',
    'AuditLog',
    'Setting',
    'DailyStat',
    'UsedExpressToken'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', tbl);
      END IF;

      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;
