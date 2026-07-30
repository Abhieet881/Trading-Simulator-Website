-- SQL Migration: Add support for multiple demo accounts and custom naming in PaperPulse
-- Run this script in your Supabase SQL Editor

-- 1. Remove the unique constraint on user_id in public.wallets
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_key;

-- 2. Add account_number and account_name columns to public.wallets if they don't exist
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 3. Update existing wallets with a default/deterministic account number if null
UPDATE public.wallets 
SET account_number = CAST(100000 + abs(hashtext(user_id::text) % 900000) AS TEXT)
WHERE account_number IS NULL;

-- 4. Add wallet_id column to public.trades if it doesn't exist
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE;

-- 5. Backfill existing trades with their user's primary wallet ID if wallet_id is null
UPDATE public.trades t
SET wallet_id = w.id
FROM public.wallets w
WHERE t.user_id = w.user_id AND t.wallet_id IS NULL;
