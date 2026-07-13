-- Migration: attendance_lists module
-- Run once in Supabase SQL Editor → New query → Run
-- Schema validated against production DB (UUIDs match companies/users/certificates tables)

-- Table: attendance_lists
-- Stores each generated attendance list (one per training session)
CREATE TABLE IF NOT EXISTS public.attendance_lists (
  id                BIGSERIAL PRIMARY KEY,
  training_id       INTEGER,                        -- references trainings.id (INTEGER)
  training_title    TEXT NOT NULL,
  training_temario  TEXT,
  event_date        DATE NOT NULL,
  schedule          TEXT NOT NULL,                  -- e.g. "8:00 AM - 4:00 PM"
  intensity         TEXT,                           -- e.g. "8 horas"
  instructor        TEXT NOT NULL,
  organized_by      TEXT NOT NULL,
  directed_to       TEXT NOT NULL,
  company_id        UUID,                           -- references companies.id (UUID)
  generated_by      TEXT NOT NULL,                  -- admin name/email who created it
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  participant_count INTEGER NOT NULL DEFAULT 0
);

-- Table: attendance_list_participants
-- Stores each participant in a given attendance list
CREATE TABLE IF NOT EXISTS public.attendance_list_participants (
  id             BIGSERIAL PRIMARY KEY,
  list_id        BIGINT NOT NULL REFERENCES public.attendance_lists(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  cedula         TEXT,
  cargo          TEXT,
  signature_data TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_attendance_lists_company_id
  ON public.attendance_lists (company_id);

CREATE INDEX IF NOT EXISTS idx_attendance_lists_training_id
  ON public.attendance_lists (training_id);

CREATE INDEX IF NOT EXISTS idx_attendance_lists_event_date
  ON public.attendance_lists (event_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_list_participants_list_id
  ON public.attendance_list_participants (list_id);

-- Disable RLS so service_role key can write without policy conflicts
ALTER TABLE public.attendance_lists           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_list_participants DISABLE ROW LEVEL SECURITY;
