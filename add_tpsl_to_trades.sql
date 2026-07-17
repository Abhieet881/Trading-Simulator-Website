-- Migration: Add Take Profit and Stop Loss columns to trades table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS take_profit NUMERIC(16, 8);
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS stop_loss NUMERIC(16, 8);
