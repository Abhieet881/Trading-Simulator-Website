-- Schema setup for PaperPulse Trading Simulator (Supabase / PostgreSQL)

-- 1. Create public.users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Matches auth.users.id
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT, -- Compatible with previous structure, can remain NULL
    plan_type TEXT DEFAULT 'free' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
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

-- 3. Helper function to check if the current user is an admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Configure Row-Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
DROP POLICY IF EXISTS "Allow select for users" ON public.users;
CREATE POLICY "Allow select for users" ON public.users 
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Allow insert for users" ON public.users;
CREATE POLICY "Allow insert for users" ON public.users 
    FOR INSERT WITH CHECK (true); -- Anyone can sign up

DROP POLICY IF EXISTS "Allow update for users" ON public.users;
CREATE POLICY "Allow update for users" ON public.users 
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Policies for public.wallets
DROP POLICY IF EXISTS "Allow select for wallets" ON public.wallets;
CREATE POLICY "Allow select for wallets" ON public.wallets 
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Allow insert for wallets" ON public.wallets;
CREATE POLICY "Allow insert for wallets" ON public.wallets 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for wallets" ON public.wallets;
CREATE POLICY "Allow update for wallets" ON public.wallets 
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- 5. Create public.trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,          -- e.g. "BTC/USDT", "ETH/USDT"
    side TEXT NOT NULL,            -- "buy" or "sell"
    status TEXT DEFAULT 'open' NOT NULL, -- "open" or "closed"
    entry_price NUMERIC(16, 8) NOT NULL,
    exit_price NUMERIC(16, 8),
    quantity NUMERIC(16, 8) NOT NULL,  -- lot/unit size
    size NUMERIC(16, 8) NOT NULL,      -- backward compatibility
    usd_amount NUMERIC(16, 2) NOT NULL,
    pnl NUMERIC(16, 2),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for public.trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Policies for public.trades
DROP POLICY IF EXISTS "Allow select for trades" ON public.trades;
CREATE POLICY "Allow select for trades" ON public.trades 
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Allow insert for trades" ON public.trades;
CREATE POLICY "Allow insert for trades" ON public.trades 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Allow update for trades" ON public.trades;
CREATE POLICY "Allow update for trades" ON public.trades 
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
