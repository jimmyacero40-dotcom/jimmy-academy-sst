-- Migration: plan + profile visual redesign enhancements
-- Run in Supabase SQL Editor → New query → Run

-- 1. Link plans to a training profile
ALTER TABLE public.annual_plans
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.training_profiles(id) ON DELETE SET NULL;

-- 2. Extended fields for plan items (side panel editing)
ALTER TABLE public.plan_items
  ADD COLUMN IF NOT EXISTS end_date      DATE,
  ADD COLUMN IF NOT EXISTS estado        TEXT    DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS reinduccion   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS observaciones TEXT,
  ADD COLUMN IF NOT EXISTS modalidad     TEXT    DEFAULT 'presencial';

-- 3. Sort order for profile course assignments
ALTER TABLE public.profile_trainings
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. Index for ordering
CREATE INDEX IF NOT EXISTS idx_profile_trainings_sort
  ON public.profile_trainings (profile_id, sort_order);
