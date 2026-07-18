-- Migration: Add banner support to public.competitions
-- Run this in the Supabase SQL Editor

ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS banner_video_url TEXT;
