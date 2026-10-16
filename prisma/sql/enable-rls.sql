-- ==============================================================================
-- Activation Dynamique de Row Level Security (RLS) et Révocation des Privilèges
-- ==============================================================================
-- Objectif de sécurité :
-- 1. Verrouiller TOUTES les tables actuelles et futures du schéma public pour
--    empêcher l'exposition involontaire via PostgREST (Supabase) avec la clé publique
--    anon ou authenticated.
-- 2. Aucune politique (POLICY) n'est créée : tout accès direct via PostgREST
--    est interdit par défaut.
-- 3. Prisma se connecte via l'utilisateur 'postgres' qui possède l'attribut
--    BYPASSRLS par défaut dans PostgreSQL.
-- 4. Révocation sur les tables, séquences et privilèges par défaut.
-- 5. Idempotent et compatible avec les bases locales sans les rôles Supabase.
-- ==============================================================================

DO $$
DECLARE
  tbl text;
BEGIN
  -- 1. Activer RLS et révoquer les privilèges sur toutes les tables existantes du schéma public
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', tbl);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', tbl);
    END IF;
  END LOOP;

  -- 2. Révoquer les privilèges sur toutes les séquences existantes du schéma public
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
  END IF;

  -- 3. Révoquer les privilèges par défaut pour que toute future table / séquence / fonction
  --    créée dans le schéma public ne soit pas automatiquement accessible par anon ou authenticated
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated';
  END IF;
END $$;
