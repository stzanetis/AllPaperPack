-- ================================
-- Data Cleanup Script
-- ================================
-- This script deletes ALL data from the database while preserving:
-- - Table structures
-- - Functions
-- - Policies (RLS)
-- - Enums
-- - Sequences
-- - Storage buckets
--
-- Use this before running migration_data.sql to start fresh
-- ================================

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- ================================
-- Delete data from all tables in correct order (respecting foreign keys)
-- ================================

-- 1. Delete junction tables first (no foreign key dependencies on them)
DELETE FROM public.product_has_tags;

-- 2. Delete order-related data
DELETE FROM public.order_has_variants;
DELETE FROM public.orders;

-- 3. Delete cart data
DELETE FROM public.cart;

-- 4. Delete product data (variants before bases due to foreign key)
DELETE FROM public.product_variants;
DELETE FROM public.product_bases;

-- 5. Delete categories (has self-referencing foreign key, but cascades handle it)
DELETE FROM public.categories;

-- 6. Delete tags
DELETE FROM public.tags;

-- 7. Delete profiles (but keep the admin user if exists)
-- Note: This will NOT delete the actual auth.users, only the profile data
-- DELETE FROM public.profiles WHERE role = 'customer';
-- Uncomment the line above if you want to keep admin profiles
-- Or use this to delete ALL profiles:
DELETE FROM public.profiles;

-- 8. Delete site settings
DELETE FROM public.site_settings;

-- 9. Delete carousel images
DELETE FROM public.carousel_images;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- ================================
-- Reset sequences to start from 1
-- ================================
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE product_bases_id_seq RESTART WITH 1;
ALTER SEQUENCE product_variants_id_seq RESTART WITH 1;
ALTER SEQUENCE tags_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE cart_id_seq RESTART WITH 1;
ALTER SEQUENCE site_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE carousel_images_id_seq RESTART WITH 1;

-- ================================
-- Verification
-- ================================
-- Check that all tables are empty
DO $$
DECLARE
    table_counts TEXT := '';
BEGIN
    SELECT INTO table_counts
        'Categories: ' || (SELECT COUNT(*) FROM public.categories)::TEXT ||
        ', Products: ' || (SELECT COUNT(*) FROM public.product_bases)::TEXT ||
        ', Variants: ' || (SELECT COUNT(*) FROM public.product_variants)::TEXT ||
        ', Tags: ' || (SELECT COUNT(*) FROM public.tags)::TEXT ||
        ', Profiles: ' || (SELECT COUNT(*) FROM public.profiles)::TEXT ||
        ', Orders: ' || (SELECT COUNT(*) FROM public.orders)::TEXT ||
        ', Cart Items: ' || (SELECT COUNT(*) FROM public.cart)::TEXT ||
        ', Settings: ' || (SELECT COUNT(*) FROM public.site_settings)::TEXT ||
        ', Carousel: ' || (SELECT COUNT(*) FROM public.carousel_images)::TEXT;
    
    RAISE NOTICE 'Data cleanup completed. Table counts: %', table_counts;
END $$;

-- ================================
-- Notes:
-- ================================
-- 1. This script does NOT delete auth.users - those are managed by Supabase Auth
-- 2. Storage bucket files are NOT deleted - you may need to clean those manually
-- 3. All table structures, policies, and functions remain intact
-- 4. Sequences are reset so new data starts from ID 1
-- 5. Run this before migration_data.sql to import fresh data
