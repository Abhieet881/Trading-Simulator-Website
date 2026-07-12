-- Migration: Add Admin support, security definer helper and upgrade RLS policies
-- Run this in the Supabase SQL Editor

-- 1. Add is_admin column to public.users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;

-- 2. Create helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Upgrade Row-Level Security (RLS) policies for public.users
DROP POLICY IF EXISTS "Allow select for users" ON public.users;
CREATE POLICY "Allow select for users" ON public.users 
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Allow update for users" ON public.users;
CREATE POLICY "Allow update for users" ON public.users 
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 4. Upgrade Row-Level Security (RLS) policies for public.wallets
DROP POLICY IF EXISTS "Allow select for wallets" ON public.wallets;
CREATE POLICY "Allow select for wallets" ON public.wallets 
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Allow update for wallets" ON public.wallets;
CREATE POLICY "Allow update for wallets" ON public.wallets 
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- 5. Upgrade Row-Level Security (RLS) policies for public.trades
DROP POLICY IF EXISTS "Allow select for trades" ON public.trades;
CREATE POLICY "Allow select for trades" ON public.trades 
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Allow insert for trades" ON public.trades;
CREATE POLICY "Allow insert for trades" ON public.trades 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Allow update for trades" ON public.trades;
CREATE POLICY "Allow update for trades" ON public.trades 
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
