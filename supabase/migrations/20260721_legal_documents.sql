-- ══════════════════════════════════════════════════════════
-- Legal Documents Module
-- Run in: Supabase → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════════

-- 1. Catálogo de documentos legales
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT        NOT NULL UNIQUE,
  title              TEXT        NOT NULL,
  content            TEXT        NOT NULL,
  version            TEXT        NOT NULL DEFAULT '1.0',
  requires_signature BOOLEAN     NOT NULL DEFAULT TRUE,
  is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by         UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Historial de versiones
CREATE TABLE IF NOT EXISTS public.legal_document_versions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID        NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  version      TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE (document_id, version)
);

-- 3. Firmas de documentos
CREATE TABLE IF NOT EXISTS public.legal_document_signatures (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id      UUID        NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  document_version TEXT        NOT NULL,
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id       UUID        REFERENCES public.companies(id) ON DELETE SET NULL,
  user_name        TEXT,
  user_cargo       TEXT,
  signature_data   TEXT        NOT NULL,
  pdf_data         TEXT,
  ip_address       TEXT,
  doc_hash         TEXT,
  signed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, document_version, user_id)
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_lds_user     ON public.legal_document_signatures (user_id);
CREATE INDEX IF NOT EXISTS idx_lds_doc      ON public.legal_document_signatures (document_id);
CREATE INDEX IF NOT EXISTS idx_lds_company  ON public.legal_document_signatures (company_id);
CREATE INDEX IF NOT EXISTS idx_ldv_doc      ON public.legal_document_versions   (document_id);

-- 5. Documento inicial: Acuerdo de Uso
INSERT INTO public.legal_documents (slug, title, content, version, requires_signature, is_active)
VALUES (
  'acuerdo-uso-plataforma',
  'ACUERDO DE USO DE LA PLATAFORMA, RESPONSABILIDAD DOCUMENTAL Y AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES',
  E'## 1. Objeto\n\nEl presente Acuerdo regula las condiciones de uso de la Plataforma de Gestión de Contratistas de Agro Venture Capital S.A.S., así como las responsabilidades que asume la empresa contratista respecto a la información y documentación suministrada y la autorización para el tratamiento de los datos personales registrados en la plataforma.\n\n## 2. Declaración de responsabilidad\n\nLa empresa contratista declara que toda la información, datos y documentos cargados en la plataforma son auténticos, completos, veraces, vigentes y corresponden a la realidad.\n\nAsimismo, manifiesta que dicha documentación ha sido previamente revisada y validada antes de ser cargada, garantizando que pertenece a sus trabajadores, contratistas o personal autorizado.\n\nLa empresa contratista asume la responsabilidad exclusiva por la autenticidad, legalidad, integridad, actualización y conservación de toda la información suministrada.\n\n## 3. Alcance de la revisión realizada por Agro Venture Capital S.A.S.\n\nLa revisión efectuada por Agro Venture Capital S.A.S. tiene un carácter exclusivamente documental y administrativo, orientado a verificar el cumplimiento de los requisitos definidos para el ingreso y permanencia del personal contratista.\n\nLa aprobación de documentos dentro de la plataforma no constituye certificación de autenticidad, legalidad o validez de los mismos, ni traslada a Agro Venture Capital S.A.S. la responsabilidad sobre la información aportada por la empresa contratista.\n\n## 4. Actualización de la información\n\nLa empresa contratista se compromete a mantener permanentemente actualizada toda la documentación de sus trabajadores, cargando oportunamente las renovaciones, modificaciones o nuevos documentos requeridos por la plataforma.\n\nLa omisión en la actualización de la información podrá generar la suspensión del estado documental del trabajador o las restricciones de acceso que determine Agro Venture Capital S.A.S.\n\n## 5. Tratamiento de datos personales\n\nLa empresa contratista manifiesta que cuenta con las autorizaciones necesarias para suministrar los datos personales de sus trabajadores, contratistas y colaboradores.\n\nIgualmente, autoriza a Agro Venture Capital S.A.S. para recolectar, almacenar, organizar, consultar, verificar, actualizar, utilizar y conservar dicha información exclusivamente para:\n\n• Administración de contratistas.\n• Gestión documental.\n• Control de acceso.\n• Cumplimiento de obligaciones legales.\n• Administración del SG-SST.\n• Gestión contractual.\n• Atención de auditorías.\n• Cumplimiento de requerimientos de autoridades competentes.\n\nEl tratamiento de los datos personales se realizará conforme a la Ley 1581 de 2012, el Decreto 1074 de 2015 y las demás normas que las modifiquen o sustituyan.\n\n## 6. Evidencia electrónica\n\nLa aceptación del presente Acuerdo se realizará mediante firma electrónica simple dentro de la plataforma.\n\nLa firma quedará asociada al usuario autenticado y será registrada junto con la fecha, hora, empresa, usuario, dirección IP (cuando técnicamente sea posible) y versión del documento.\n\n## 7. Declaración final\n\nAl firmar electrónicamente el presente documento, la empresa contratista declara que:\n\n• Ha leído y comprendido el presente Acuerdo.\n• Acepta todas sus condiciones.\n• Se compromete a suministrar información auténtica, veraz y actualizada.\n• Asume la responsabilidad exclusiva sobre toda la documentación cargada.\n• Autoriza el tratamiento de los datos personales conforme a la legislación colombiana.',
  '1.0',
  TRUE,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- 6. Registrar versión inicial en historial
INSERT INTO public.legal_document_versions (document_id, version, content)
SELECT id, version, content FROM public.legal_documents WHERE slug = 'acuerdo-uso-plataforma'
ON CONFLICT (document_id, version) DO NOTHING;
