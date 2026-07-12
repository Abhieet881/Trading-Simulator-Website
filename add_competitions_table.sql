-- Migration: Create Competitions table and setup RLS
-- Run this in the Supabase SQL Editor

-- 1. Create public.competitions table
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    entry_fee NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    target_profit_percent NUMERIC(5, 2) NOT NULL,
    status TEXT DEFAULT 'upcoming' NOT NULL CHECK (status IN ('upcoming', 'active', 'ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- 3. Setup RLS Policies for public.competitions
DROP POLICY IF EXISTS "Allow select for all authenticated users" ON public.competitions;
CREATE POLICY "Allow select for all authenticated users" ON public.competitions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin to insert competitions" ON public.competitions;
CREATE POLICY "Allow admin to insert competitions" ON public.competitions
    FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to update competitions" ON public.competitions;
CREATE POLICY "Allow admin to update competitions" ON public.competitions
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to delete competitions" ON public.competitions;
CREATE POLICY "Allow admin to delete competitions" ON public.competitions
    FOR DELETE USING (public.is_admin());
