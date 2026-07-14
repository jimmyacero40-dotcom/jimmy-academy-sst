-- Migration: enforce unique (profile_id, training_id) in profile_trainings
-- Run in Supabase → SQL Editor → New query → Run

-- Remove any existing duplicates before adding the constraint
-- (keeps the row with the lowest sort_order for each duplicate pair)
DELETE FROM public.profile_trainings
WHERE id NOT IN (
  SELECT DISTINCT ON (profile_id, training_id) id
  FROM public.profile_trainings
  ORDER BY profile_id, training_id, sort_order ASC NULLS LAST
);

-- Add UNIQUE constraint (idempotent)
ALTER TABLE public.profile_trainings
  DROP CONSTRAINT IF EXISTS profile_trainings_profile_id_training_id_key;

ALTER TABLE public.profile_trainings
  ADD CONSTRAINT profile_trainings_profile_id_training_id_key
  UNIQUE (profile_id, training_id);
