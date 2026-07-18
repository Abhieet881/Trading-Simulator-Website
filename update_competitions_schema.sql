-- Migration: Add new fields to public.competitions
-- Run this in the Supabase SQL Editor

ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS prize_pool NUMERIC(12, 2) DEFAULT 0.00 NOT NULL;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 1000 NOT NULL;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS initial_equity NUMERIC(12, 2) DEFAULT 10000.00 NOT NULL;
