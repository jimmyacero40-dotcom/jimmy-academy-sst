-- ════════════════════════════════════════════════════════════════
-- Control Operativo: Registro de Ingresos y Salidas
-- AgroSafe SST — 2026-09-16
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS access_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_time    TIMESTAMPTZ NOT NULL DEFAULT now(),
  exit_time     TIMESTAMPTZ,
  area_id       UUID REFERENCES areas(id) ON DELETE SET NULL,
  registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  exit_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_logs_company_id_idx  ON access_logs(company_id);
CREATE INDEX IF NOT EXISTS access_logs_user_id_idx     ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS access_logs_entry_time_idx  ON access_logs(entry_time DESC);

-- RLS: solo service_role accede (consistente con el resto del sistema)
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON access_logs TO service_role;
