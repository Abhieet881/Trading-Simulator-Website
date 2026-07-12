-- SQL Script to create the leaderboard view in Supabase SQL Editor
-- This view allows public access to aggregated trading statistics without exposing individual trade details or private user emails.

-- 1. Drop existing view if it exists
DROP VIEW IF EXISTS public.public_closed_trades CASCADE;

-- 2. Create the view
CREATE OR REPLACE VIEW public.public_closed_trades AS
SELECT 
    t.id,
    t.user_id,
    u.name AS user_name,
    t.pnl::numeric AS pnl,
    t.closed_at
FROM 
    public.trades t
JOIN 
    public.users u ON t.user_id = u.id
WHERE 
    t.status = 'closed';

-- 3. Grant select permissions on the view to public roles
GRANT SELECT ON public.public_closed_trades TO anon;
GRANT SELECT ON public.public_closed_trades TO authenticated;
GRANT SELECT ON public.public_closed_trades TO service_role;
