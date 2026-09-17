-- ════════════════════════════════════════════════════════════════
-- Porterías (Gatehouses) + Trabajadores Retirados
-- AgroSafe SST — 2026-09-17
-- Totalmente idempotente: no falla si ya existe
-- ════════════════════════════════════════════════════════════════

-- ── 1. Porterías ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gatehouses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL,
  name         TEXT NOT NULL,
  location     TEXT,
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gatehouses_company_id_idx  ON gatehouses(company_id);
CREATE INDEX IF NOT EXISTS gatehouses_is_active_idx   ON gatehouses(is_active);

-- ── 2. Operadores de portería ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS gatehouse_operators (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gatehouse_id UUID NOT NULL REFERENCES gatehouses(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gatehouse_id, user_id)
);

CREATE INDEX IF NOT EXISTS gatehouse_operators_user_id_idx      ON gatehouse_operators(user_id);
CREATE INDEX IF NOT EXISTS gatehouse_operators_gatehouse_id_idx ON gatehouse_operators(gatehouse_id);

-- ── 3. Agregar gatehouse_id a access_logs ────────────────────────
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS gatehouse_id UUID REFERENCES gatehouses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS access_logs_gatehouse_id_idx ON access_logs(gatehouse_id);

-- ── 4. Agregar retired_at a users ────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS users_retired_at_idx ON users(retired_at);

-- ── 5. RLS ───────────────────────────────────────────────────────
ALTER TABLE gatehouses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatehouse_operators ENABLE ROW LEVEL SECURITY;
GRANT ALL ON gatehouses         TO service_role;
GRANT ALL ON gatehouse_operators TO service_role;
