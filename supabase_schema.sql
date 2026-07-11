-- Schema setup for PaperPulse Trading Simulator (Supabase / PostgreSQL)

-- 1. Create public.users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Matches auth.users.id
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT, -- Compatible with previous structure, can remain NULL
    plan_type TEXT DEFAULT 'free' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create public.wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    virtual_balance NUMERIC(12, 2) DEFAULT 10000.00 NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Configure Row-Level Security (RLS)
-- To ensure the app can read/write during signup and dashboard views, we configure permissive policies.
-- In a strict production app, you can restrict SELECT/UPDATE to auth.uid() = user_id.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
DROP POLICY IF EXISTS "Allow select for users" ON public.users;
CREATE POLICY "Allow select for users" ON public.users 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for users" ON public.users;
CREATE POLICY "Allow insert for users" ON public.users 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for users" ON public.users;
CREATE POLICY "Allow update for users" ON public.users 
    FOR UPDATE USING (true);

-- Policies for public.wallets
DROP POLICY IF EXISTS "Allow select for wallets" ON public.wallets;
CREATE POLICY "Allow select for wallets" ON public.wallets 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for wallets" ON public.wallets;
CREATE POLICY "Allow insert for wallets" ON public.wallets 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for wallets" ON public.wallets;
CREATE POLICY "Allow update for wallets" ON public.wallets 
    FOR UPDATE USING (true);
