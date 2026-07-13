-- Migration: add extended company fields for settings page
-- Run in Supabase SQL Editor → New query → Run

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS correo            TEXT,
  ADD COLUMN IF NOT EXISTS telefono          TEXT,
  ADD COLUMN IF NOT EXISTS ciudad            TEXT,
  ADD COLUMN IF NOT EXISTS sector            TEXT,
  ADD COLUMN IF NOT EXISTS responsable_nombre    TEXT,
  ADD COLUMN IF NOT EXISTS responsable_cargo     TEXT,
  ADD COLUMN IF NOT EXISTS responsable_email     TEXT,
  ADD COLUMN IF NOT EXISTS responsable_licencia  TEXT;
