-- Migration: Add link_url column to carousel_images table
-- Date: 2026-01-07
-- Description: Adds optional link_url field to carousel images for clickable carousel slides

ALTER TABLE public.carousel_images
ADD COLUMN IF NOT EXISTS link_url TEXT;

COMMENT ON COLUMN public.carousel_images.link_url IS 'Optional URL that the carousel image links to when clicked. Can be internal (/products) or external (https://...)';
