-- ════════════════════════════════════════════════════════════════════════════
-- SECURITY MIGRATION: RLS Completo + Mínimo Privilegio
-- Jimmy Academy SST — 2026-07-29
--
-- ARQUITECTURA: NextAuth (no Supabase Auth) + service_role en API routes.
-- El rol `authenticated` de Supabase NUNCA se activa.
-- Todo acceso de datos pasa por API routes autenticadas con NextAuth.
-- Las API routes usan service_role (bypassa RLS automáticamente).
-- El rol `anon` debe tener CERO acceso a datos.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. REVOCAR permisos de tabla a anon y authenticated ──────────────────
-- Mantenemos USAGE en schema (PostgREST lo necesita para introspección)
-- pero eliminamos acceso a todas las tablas.

REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- service_role siempre bypassa RLS y tiene acceso total por diseño de Supabase.
-- Las siguientes líneas son explícitas por claridad:
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ── 2. HABILITAR RLS en todas las tablas snake_case ───────────────────────

ALTER TABLE IF EXISTS public.users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.areas                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.groups                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_groups                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worker_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trainings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_slides            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_blocks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_resources         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.certificates               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.signatures                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.annual_plans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plan_items                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plan_item_targets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_trainings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance_lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance_list_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.legal_documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.legal_document_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.legal_document_signatures  ENABLE ROW LEVEL SECURITY;

-- Tablas opcionales (pueden o no existir según migraciones anteriores)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'consent_records'
  ) THEN
    EXECUTE 'ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ── 3. HABILITAR RLS en tablas PascalCase (schema Evaluaciones) ───────────
-- Estas tablas usan supabaseAdmin (service_role) exclusivamente.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Evaluation'
  ) THEN
    EXECUTE 'ALTER TABLE public."Evaluation" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE ON public."Evaluation" FROM anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Question'
  ) THEN
    EXECUTE 'ALTER TABLE public."Question" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE ON public."Question" FROM anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Option'
  ) THEN
    EXECUTE 'ALTER TABLE public."Option" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE ON public."Option" FROM anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Training'
  ) THEN
    EXECUTE 'ALTER TABLE public."Training" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE ON public."Training" FROM anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Company'
  ) THEN
    EXECUTE 'ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE ON public."Company" FROM anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'AuditLog'
  ) THEN
    EXECUTE 'ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE ON public."AuditLog" FROM anon, authenticated';
  END IF;
END $$;

-- ── 4. POLICIES: ninguna para anon/authenticated ──────────────────────────
-- Al habilitar RLS sin políticas permisivas, el acceso queda DENEGADO
-- por defecto para todos excepto service_role (que bypassa RLS).
-- No se crean políticas de tipo "ALL" para anon porque eso anularía el efecto.

-- Solo se crean políticas de service_role como documentación explícita:
-- (service_role ya bypassa RLS pero las políticas documentan la intención)

-- usuarios — solo service_role
CREATE POLICY "service_role_all_users" ON public.users
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_companies" ON public.companies
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_areas" ON public.areas
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_groups" ON public.groups
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_user_groups" ON public.user_groups
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_worker_profiles" ON public.worker_profiles
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_trainings" ON public.trainings
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_training_slides" ON public.training_slides
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_training_blocks" ON public.training_blocks
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_training_resources" ON public.training_resources
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_training_results" ON public.training_results
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_training_questions" ON public.training_questions
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_enrollments" ON public.enrollments
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_certificates" ON public.certificates
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_signatures" ON public.signatures
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_annual_plans" ON public.annual_plans
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_plan_items" ON public.plan_items
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_plan_item_targets" ON public.plan_item_targets
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_training_profiles" ON public.training_profiles
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_profile_trainings" ON public.profile_trainings
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_attendance_lists" ON public.attendance_lists
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_attendance_participants" ON public.attendance_list_participants
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_legal_documents" ON public.legal_documents
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_legal_document_versions" ON public.legal_document_versions
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_legal_document_signatures" ON public.legal_document_signatures
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 5. PROTEGER columnas sensibles ────────────────────────────────────────
-- Con RLS habilitado y sin políticas para anon, las columnas sensibles
-- (password, email, signature_data, pdf_data, etc.) ya no son accesibles
-- vía PostgREST anon. No se requieren column-level grants adicionales.

-- Verificación adicional: eliminar grant de sequences a anon
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- ── 6. FUNCIONES RPC — asegurar que usan SECURITY DEFINER correctamente ──
-- Las funciones SECURITY DEFINER se ejecutan con privilegios del dueño.
-- Solo deben existir si son necesarias y están bien protegidas.
-- Este bloque revoca la ejecución a anon para cualquier función pública:
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ── 7. ASEGURAR futuros objetos ────────────────────────────────────────────
-- DEFAULT PRIVILEGES: nuevas tablas creadas en public no tendrán acceso anon
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

-- ════════════════════════════════════════════════════════════════════════════
-- RESUMEN DE SEGURIDAD IMPLEMENTADA:
--
-- ✅ RLS habilitado en todas las tablas snake_case (25 tablas)
-- ✅ RLS habilitado en tablas PascalCase (6 tablas, condicional)
-- ✅ REVOKE de SELECT/INSERT/UPDATE/DELETE a anon y authenticated
-- ✅ REVOKE de EXECUTE en funciones a anon y authenticated
-- ✅ Políticas explícitas service_role en cada tabla
-- ✅ DEFAULT PRIVILEGES protegidas para objetos futuros
-- ✅ Columnas sensibles protegidas por bloqueo total de anon
--
-- RESULTADO ESPERADO EN SECURITY ADVISOR:
-- ❌ "RLS Disabled in Public" → eliminado (todas las tablas con RLS)
-- ❌ "Sensitive Columns Publicly Accessible" → eliminado (anon bloqueado)
-- ❌ "Tables Publicly Accessible via API" → eliminado (anon bloqueado)
--
-- IMPACTO EN LA APLICACIÓN:
-- ✅ NINGUNO — todas las API routes usan service_role que bypassa RLS
-- ✅ NINGUNO — dashboard no hace queries directas a Supabase
-- ✅ NINGUNO — NextAuth (no Supabase Auth) maneja la autenticación
-- ════════════════════════════════════════════════════════════════════════════
