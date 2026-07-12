-- SQL Script to create public.trades table in Supabase SQL Editor

-- 1. Drop existing table if it exists (for a clean install)
DROP TABLE IF EXISTS public.trades CASCADE;

-- 2. Create the trades table
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,                -- e.g., "BTC/USDT", "ETH/USDT", "EUR/USD"
    side TEXT NOT NULL,                  -- "buy" or "sell" (lowercase)
    status TEXT DEFAULT 'open' NOT NULL, -- "open" or "closed" (lowercase)
    entry_price NUMERIC(16, 8) NOT NULL,
    exit_price NUMERIC(16, 8),
    quantity NUMERIC(16, 8) NOT NULL,    -- lot / unit size
    usd_amount NUMERIC(16, 2) NOT NULL,   -- committed USD margin
    pnl NUMERIC(16, 2) DEFAULT 0.00,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Backward compatibility fields required by Next.js API routes (e.g. route.js inserts size/created_at)
    size NUMERIC(16, 8) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies to restrict access to the owning user only
DROP POLICY IF EXISTS "Allow select for trades" ON public.trades;
CREATE POLICY "Allow select for trades" ON public.trades 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for trades" ON public.trades;
CREATE POLICY "Allow insert for trades" ON public.trades 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update for trades" ON public.trades;
CREATE POLICY "Allow update for trades" ON public.trades 
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Grant access permissions to Supabase roles
GRANT ALL ON public.trades TO anon;
GRANT ALL ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
