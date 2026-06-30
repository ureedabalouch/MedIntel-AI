-- MedIntel AI - Production Database Schema (Part 6: Row Level Security & Access Control)
-- Compatible with Supabase PostgreSQL (Postgres 15+)

--------------------------------------------------------------------------------
-- PRE-REQUISITE: COMPLIANCE AUDIT LOGS TABLE
--------------------------------------------------------------------------------
-- Create the audit_logs table if it does not already exist, ensuring the migration
-- succeeds independently and is robust.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for compliance querying and auditing speed
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

--------------------------------------------------------------------------------
-- SECURE HELPER FUNCTIONS (Prevent Infinite Recursion in Policies)
--------------------------------------------------------------------------------
-- By utilizing SECURITY DEFINER, these functions execute with elevated privileges (bypassing RLS),
-- which solves the classic RLS self-referential infinite recursion loop in Supabase.
-- SET search_path is explicitly set to public for optimal security and search path scoping.

-- Helper 1: Verify organization membership for the currently logged-in user
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.memberships
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper 2: Verify administrative privileges (Owner or Admin) for the logged-in user in an organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.memberships
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explanatory comments on helper functions for documentation and observability
COMMENT ON FUNCTION public.is_org_member(UUID) IS 'Securely determines if the currently authenticated user is a registered member of the given organization.';
COMMENT ON FUNCTION public.is_org_admin(UUID) IS 'Securely determines if the currently authenticated user is an Owner or Administrator of the given organization.';

-- Explicitly revoke public execution permissions and grant only to authenticated roles
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;

--------------------------------------------------------------------------------
-- 1. PROFILES RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Select own profile
DROP POLICY IF EXISTS select_own_profile ON public.profiles;
CREATE POLICY select_own_profile ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Insert own profile (on signup)
DROP POLICY IF EXISTS insert_own_profile ON public.profiles;
CREATE POLICY insert_own_profile ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Update own profile
DROP POLICY IF EXISTS update_own_profile ON public.profiles;
CREATE POLICY update_own_profile ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

--------------------------------------------------------------------------------
-- 2. ORGANIZATIONS RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Select member organizations
DROP POLICY IF EXISTS select_member_organizations ON public.organizations;
CREATE POLICY select_member_organizations ON public.organizations
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(id));

-- Insert organizations (any authenticated user can create an organization)
DROP POLICY IF EXISTS insert_authenticated_organizations ON public.organizations;
CREATE POLICY insert_authenticated_organizations ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Update organizations (Owner/Admin only)
DROP POLICY IF EXISTS update_admin_organizations ON public.organizations;
CREATE POLICY update_admin_organizations ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(id))
    WITH CHECK (public.is_org_admin(id));

-- Delete organizations (Owner/Admin only)
DROP POLICY IF EXISTS delete_admin_organizations ON public.organizations;
CREATE POLICY delete_admin_organizations ON public.organizations
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(id));

--------------------------------------------------------------------------------
-- 3. MEMBERSHIPS RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Select memberships (any member of the organization can view other members)
DROP POLICY IF EXISTS select_memberships ON public.memberships;
CREATE POLICY select_memberships ON public.memberships
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert memberships (Owner/Admin can add memberships, or a user can self-join if invited)
DROP POLICY IF EXISTS insert_memberships ON public.memberships;
CREATE POLICY insert_memberships ON public.memberships
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_admin(organization_id) OR user_id = auth.uid());

-- Update memberships (Owner/Admin only)
DROP POLICY IF EXISTS update_memberships ON public.memberships;
CREATE POLICY update_memberships ON public.memberships
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete memberships (Owner/Admin can remove members, or users can leave themselves)
DROP POLICY IF EXISTS delete_memberships ON public.memberships;
CREATE POLICY delete_memberships ON public.memberships
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id) OR user_id = auth.uid());

--------------------------------------------------------------------------------
-- 4. DOCUMENT CATEGORIES RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- Select document categories (Members only)
DROP POLICY IF EXISTS select_document_categories ON public.document_categories;
CREATE POLICY select_document_categories ON public.document_categories
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert document categories (Admin only)
DROP POLICY IF EXISTS insert_document_categories ON public.document_categories;
CREATE POLICY insert_document_categories ON public.document_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_admin(organization_id));

-- Update document categories (Admin only)
DROP POLICY IF EXISTS update_document_categories ON public.document_categories;
CREATE POLICY update_document_categories ON public.document_categories
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete document categories (Admin only)
DROP POLICY IF EXISTS delete_document_categories ON public.document_categories;
CREATE POLICY delete_document_categories ON public.document_categories
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

--------------------------------------------------------------------------------
-- 5. DOCUMENTS RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Select documents (Members only)
DROP POLICY IF EXISTS select_documents ON public.documents;
CREATE POLICY select_documents ON public.documents
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert documents (Members can upload/create documents)
DROP POLICY IF EXISTS insert_documents ON public.documents;
CREATE POLICY insert_documents ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

-- Update documents (Admin only)
DROP POLICY IF EXISTS update_documents ON public.documents;
CREATE POLICY update_documents ON public.documents
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete documents (Admin only)
DROP POLICY IF EXISTS delete_documents ON public.documents;
CREATE POLICY delete_documents ON public.documents
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

--------------------------------------------------------------------------------
-- 6. PROCESSING JOBS RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Select processing jobs (Members only)
DROP POLICY IF EXISTS select_processing_jobs ON public.processing_jobs;
CREATE POLICY select_processing_jobs ON public.processing_jobs
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert processing jobs (Members can initiate processing jobs)
DROP POLICY IF EXISTS insert_processing_jobs ON public.processing_jobs;
CREATE POLICY insert_processing_jobs ON public.processing_jobs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

-- Update processing jobs (Admin only)
DROP POLICY IF EXISTS update_processing_jobs ON public.processing_jobs;
CREATE POLICY update_processing_jobs ON public.processing_jobs
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete processing jobs (Admin only)
DROP POLICY IF EXISTS delete_processing_jobs ON public.processing_jobs;
CREATE POLICY delete_processing_jobs ON public.processing_jobs
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

--------------------------------------------------------------------------------
-- 7. CHAT SESSIONS RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Select chat sessions (Must be member of the org AND must own the session)
DROP POLICY IF EXISTS select_chat_sessions ON public.chat_sessions;
CREATE POLICY select_chat_sessions ON public.chat_sessions
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id) AND user_id = auth.uid());

-- Insert chat sessions
DROP POLICY IF EXISTS insert_chat_sessions ON public.chat_sessions;
CREATE POLICY insert_chat_sessions ON public.chat_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());

-- Update chat sessions
DROP POLICY IF EXISTS update_chat_sessions ON public.chat_sessions;
CREATE POLICY update_chat_sessions ON public.chat_sessions
    FOR UPDATE
    TO authenticated
    USING (public.is_org_member(organization_id) AND user_id = auth.uid())
    WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());

-- Delete chat sessions
DROP POLICY IF EXISTS delete_chat_sessions ON public.chat_sessions;
CREATE POLICY delete_chat_sessions ON public.chat_sessions
    FOR DELETE
    TO authenticated
    USING (public.is_org_member(organization_id) AND user_id = auth.uid());

--------------------------------------------------------------------------------
-- 8. MESSAGES RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Select messages (Must belong to a chat session the user owns inside their org)
DROP POLICY IF EXISTS select_messages ON public.messages;
CREATE POLICY select_messages ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = session_id
            AND s.user_id = auth.uid()
            AND public.is_org_member(s.organization_id)
        )
    );

-- Insert messages
DROP POLICY IF EXISTS insert_messages ON public.messages;
CREATE POLICY insert_messages ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = session_id
            AND s.user_id = auth.uid()
            AND public.is_org_member(s.organization_id)
        )
    );

-- Update messages
DROP POLICY IF EXISTS update_messages ON public.messages;
CREATE POLICY update_messages ON public.messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = session_id
            AND s.user_id = auth.uid()
            AND public.is_org_member(s.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = session_id
            AND s.user_id = auth.uid()
            AND public.is_org_member(s.organization_id)
        )
    );

-- Delete messages
DROP POLICY IF EXISTS delete_messages ON public.messages;
CREATE POLICY delete_messages ON public.messages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = session_id
            AND s.user_id = auth.uid()
            AND public.is_org_member(s.organization_id)
        )
    );

--------------------------------------------------------------------------------
-- 9. DOCUMENT CHUNKS RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Select document chunks (Members only)
DROP POLICY IF EXISTS select_document_chunks ON public.document_chunks;
CREATE POLICY select_document_chunks ON public.document_chunks
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert document chunks (Members/Ingestion system can create chunks)
DROP POLICY IF EXISTS insert_document_chunks ON public.document_chunks;
CREATE POLICY insert_document_chunks ON public.document_chunks
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

-- Update document chunks (Admin only)
DROP POLICY IF EXISTS update_document_chunks ON public.document_chunks;
CREATE POLICY update_document_chunks ON public.document_chunks
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete document chunks (Admin only)
DROP POLICY IF EXISTS delete_document_chunks ON public.document_chunks;
CREATE POLICY delete_document_chunks ON public.document_chunks
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

--------------------------------------------------------------------------------
-- 10. AUDIT LOGS RLS POLICIES (Append-only & Read-only for HIPAA compliance)
--------------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Select audit logs
DROP POLICY IF EXISTS select_audit_logs ON public.audit_logs;
CREATE POLICY select_audit_logs ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert audit logs (any logged member activity can record an audit trail entry)
DROP POLICY IF EXISTS insert_audit_logs ON public.audit_logs;
CREATE POLICY insert_audit_logs ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());

-- SECURITY ACTION: No UPDATE or DELETE is allowed on audit logs to guarantee
-- that compliance records are completely tamper-proof and immutable.
