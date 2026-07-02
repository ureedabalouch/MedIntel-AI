-- Migration: 007_auth_profile_trigger
-- Purpose: Automatically synchronize Supabase Auth users (auth.users) with public profiles (public.profiles)
-- This ensures that as soon as a user signs up and verifies, their profile record is safely created in public.profiles.

-- 1. Create or Replace Trigger Function
-- We use SECURITY DEFINER so that this function executes with elevated privileges (as the database owner / superuser).
-- This is necessary because the database system Auth trigger operates outside the standard user RLS context
-- and must be able to insert into public.profiles directly.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- We perform an INSERT with ON CONFLICT DO NOTHING to ensure idempotence.
    -- If a profile with this ID already exists, we do not overwrite it.
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        job_title,
        avatar_url
    ) VALUES (
        NEW.id,
        NEW.email,
        -- Extract full name from the raw metadata. Fallback to empty string if not provided.
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        -- Extract clinical role/job title from either 'role' or 'job_title' user metadata fields.
        COALESCE(NEW.raw_user_meta_data ->> 'role', NEW.raw_user_meta_data ->> 'job_title', ''),
        -- Optionally extract avatar_url if present.
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Return the inserted/modified record for the next trigger in the pipeline.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists to ensure idempotence
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the Trigger
-- This trigger fires AFTER a new record is created in auth.users.
-- It must fire AFTER the insert to satisfy the foreign key constraint (public.profiles.id REFERENCES auth.users(id)).
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
