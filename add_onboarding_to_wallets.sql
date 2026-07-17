-- Migration: Add onboarding fields to public.wallets table
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS balance_configured BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.wallets ALTER COLUMN virtual_balance SET DEFAULT 0.00;
