-- ════════════════════════════════════════════════════════════════════════════
-- SECURITY MIGRATION: RLS Completo + Mínimo Privilegio
-- Jimmy Academy SST — 2026-07-29
-- VERSIÓN 2: Totalmente condicional — no falla si una tabla no existe
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. REVOCAR permisos de tabla a anon y authenticated ──────────────────
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- service_role explícito
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ── 2. PROTEGER objetos futuros ──────────────────────────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ── 3. HABILITAR RLS + POLICIES — todo condicional ───────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users', 'companies', 'areas', 'groups', 'user_groups',
    'worker_profiles', 'trainings', 'training_slides', 'training_blocks',
    'training_resources', 'training_results', 'training_questions',
    'enrollments', 'certificates', 'signatures', 'consent_records',
    'annual_plans', 'plan_items', 'plan_item_targets',
    'training_profiles', 'profile_trainings',
    'attendance_lists', 'attendance_list_participants',
    'legal_documents', 'legal_document_versions', 'legal_document_signatures',
    'user_profiles', 'notifications'
  ];
  pascal_tables TEXT[] := ARRAY[
    'Evaluation', 'Question', 'Option', 'Training', 'Company', 'AuditLog'
  ];
BEGIN
  -- Tablas snake_case
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

      -- Eliminar política si ya existe para evitar error al re-ejecutar
      EXECUTE format(
        'DROP POLICY IF EXISTS "service_role_all_%s" ON public.%I',
        tbl, tbl
      );

      -- Crear política service_role
      EXECUTE format(
        'CREATE POLICY "service_role_all_%s" ON public.%I
         AS PERMISSIVE FOR ALL TO service_role
         USING (true) WITH CHECK (true)',
        tbl, tbl
      );

      RAISE NOTICE 'RLS habilitado + policy creada: %', tbl;
    ELSE
      RAISE NOTICE 'Tabla no existe (omitida): %', tbl;
    END IF;
  END LOOP;

  -- Tablas PascalCase
  FOREACH tbl IN ARRAY pascal_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

      EXECUTE format(
        'DROP POLICY IF EXISTS "service_role_all_%s" ON public.%I',
        tbl, tbl
      );

      EXECUTE format(
        'CREATE POLICY "service_role_all_%s" ON public.%I
         AS PERMISSIVE FOR ALL TO service_role
         USING (true) WITH CHECK (true)',
        tbl, tbl
      );

      -- Revocar permisos de anon para tablas PascalCase (el REVOKE ALL arriba las incluye)
      EXECUTE format(
        'REVOKE SELECT, INSERT, UPDATE, DELETE ON public.%I FROM anon, authenticated',
        tbl
      );

      RAISE NOTICE 'RLS habilitado + policy creada (PascalCase): %', tbl;
    ELSE
      RAISE NOTICE 'Tabla PascalCase no existe (omitida): %', tbl;
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- RESULTADO:
-- Las tablas que no existen todavía son omitidas sin error.
-- Cuando se ejecuten sus migraciones de creación, volver a correr
-- este script para protegerlas (es idempotente: DROP POLICY IF EXISTS).
-- ════════════════════════════════════════════════════════════════════════════
