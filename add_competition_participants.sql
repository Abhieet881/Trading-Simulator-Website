-- Migration: Create competition_participants table and setup RLS policies
-- Run this in the Supabase SQL Editor

-- 1. Create public.competition_participants table
CREATE TABLE IF NOT EXISTS public.competition_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    starting_balance NUMERIC(12, 2) NOT NULL,
    current_balance NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'failed')),
    rank INTEGER,
    CONSTRAINT unique_competition_user UNIQUE (competition_id, user_id)
);

-- 2. Configure Row-Level Security (RLS)
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;

-- 3. Setup RLS Policies for public.competition_participants
DROP POLICY IF EXISTS "Allow select for owner and admin" ON public.competition_participants;
CREATE POLICY "Allow select for owner and admin" ON public.competition_participants
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Allow insert for owner" ON public.competition_participants;
CREATE POLICY "Allow insert for owner" ON public.competition_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update for owner and admin" ON public.competition_participants;
CREATE POLICY "Allow update for owner and admin" ON public.competition_participants
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
