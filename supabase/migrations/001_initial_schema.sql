-- MedIntel AI - Production Database Schema (Part 1: Core Identity & Multi-Tenancy)
-- Compatible with Supabase PostgreSQL (Postgres 15+)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--------------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    job_title VARCHAR(255),
    specialization VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching and filtering profiles by email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

--------------------------------------------------------------------------------
-- 2. ORGANIZATIONS (Multi-tenant Boundaries)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    organization_type TEXT NOT NULL DEFAULT 'Other',
    billing_plan TEXT NOT NULL DEFAULT 'Free',
    timezone TEXT DEFAULT 'UTC',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Check constraints for valid types and plans
    CONSTRAINT chk_organization_type CHECK (organization_type IN (
        'Hospital',
        'Clinic',
        'Research Institute',
        'Medical School',
        'Pharmaceutical',
        'Personal',
        'Other'
    )),
    CONSTRAINT chk_billing_plan CHECK (billing_plan IN (
        'Free',
        'Pro',
        'Enterprise'
    ))
);

-- Index for scanning organizations by slug or founder
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

--------------------------------------------------------------------------------
-- 3. MEMBERSHIPS (Junction table linking Profiles to Organizations)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member',
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique constraint ensures a profile has only one membership per organization
    CONSTRAINT uq_organization_user UNIQUE(organization_id, user_id),
    
    -- Check constraint for valid roles
    CONSTRAINT chk_membership_role CHECK (role IN (
        'Owner',
        'Admin',
        'Doctor',
        'Researcher',
        'Pharmacist',
        'Nurse',
        'Member',
        'Viewer'
    ))
);

-- Indexes for performance on joins and queries
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON public.memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON public.memberships(role);

--------------------------------------------------------------------------------
-- UPDATED_AT TIMESTAMP TRIGGER HELPER
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically maintain updated_at on modify
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON public.organizations;
CREATE TRIGGER trigger_organizations_updated_at 
    BEFORE UPDATE ON public.organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_memberships_updated_at ON public.memberships;
CREATE TRIGGER trigger_memberships_updated_at 
    BEFORE UPDATE ON public.memberships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
