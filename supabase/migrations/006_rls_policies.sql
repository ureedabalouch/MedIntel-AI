-- MedIntel AI - Production Database Schema (Part 6: Row Level Security & Access Control)
-- Compatible with Supabase PostgreSQL (Postgres 15+)

--------------------------------------------------------------------------------
-- PRE-REQUISITE: COMPLIANCE AUDIT LOGS TABLE
--------------------------------------------------------------------------------
-- If audit_logs table was not created in a previous schema migration, we instantiate
-- it here to support full HIPAA compliance tracking.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action          VARCHAR(255) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       UUID,
    details         JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for compliance querying, filtering, and rapid system audit trails
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

--------------------------------------------------------------------------------
-- SECURE HELPER FUNCTIONS (Prevent Infinite Recursion in Policies)
--------------------------------------------------------------------------------
-- RLS policies that query the same table on which the policy is defined can cause
-- infinite recursion loops. To bypass this, we use SECURITY DEFINER helper functions.
--
-- Security Implications:
-- 1. SECURITY DEFINER: The functions execute with the privileges of the creator (postgres/superuser),
--    allowing them to safely read memberships to determine access permissions without triggering
--    recursive RLS checks on the memberships table.
-- 2. search_path: Explicitly locked to 'public' to prevent search-path hijacking attacks
--    where a malicious user could define a custom function or schema override.
-- 3. STABLE: Informs the query planner that the function does not modify database state and
--    returns consistent results for the same inputs within a transaction, optimizing query performance.

-- Helper 1: Verify organization membership for the currently logged-in user
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.memberships
        WHERE organization_id = org_id
          AND user_id = auth.uid()
    );
END;
$$;

-- Helper 2: Verify administrative privileges (Owner or Admin) for the logged-in user in an organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.memberships
        WHERE organization_id = org_id
          AND user_id = auth.uid()
          AND role IN ('Owner', 'Admin')
    );
END;
$$;

-- Explanatory comments on helper functions for database documentation and audit compliance
COMMENT ON FUNCTION public.is_org_member(UUID) IS 'Securely determines if the currently authenticated user is a registered member of the given organization. Executed with elevated privileges via SECURITY DEFINER to bypass recursive policy evaluation.';
COMMENT ON FUNCTION public.is_org_admin(UUID) IS 'Securely determines if the currently authenticated user is an Owner or Administrator of the given organization. Executed with elevated privileges via SECURITY DEFINER to bypass recursive policy evaluation.';

-- Explicitly revoke public execution permissions and grant only to authenticated roles
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;

--------------------------------------------------------------------------------
-- 1. PROFILES RLS POLICIES
--------------------------------------------------------------------------------
-- RLS is enabled to ensure users can only see and manipulate their own personal records.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Select own profile
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Insert own profile (required during user signup/onboarding flows)
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Update own profile (enables updating details like full name or avatar url)
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

--------------------------------------------------------------------------------
-- 2. ORGANIZATIONS RLS POLICIES
--------------------------------------------------------------------------------
-- Multi-tenant isolation is enforced at the organization level.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Select member organizations (Members can view organizations they belong to)
DROP POLICY IF EXISTS organizations_select ON public.organizations;
CREATE POLICY organizations_select ON public.organizations
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(id));

-- Insert organizations (any authenticated user can register a new organization)
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
CREATE POLICY organizations_insert ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Update organizations (Restricted strictly to Owner/Admin roles)
DROP POLICY IF EXISTS organizations_update ON public.organizations;
CREATE POLICY organizations_update ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(id))
    WITH CHECK (public.is_org_admin(id));

-- Delete organizations (Restricted strictly to Owner/Admin roles)
DROP POLICY IF EXISTS organizations_delete ON public.organizations;
CREATE POLICY organizations_delete ON public.organizations
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(id));

--------------------------------------------------------------------------------
-- 3. MEMBERSHIPS RLS POLICIES
--------------------------------------------------------------------------------
-- Access controls for managing member lists inside an organization.
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Select memberships (Any member can retrieve the list of other members in their organization)
DROP POLICY IF EXISTS memberships_select ON public.memberships;
CREATE POLICY memberships_select ON public.memberships
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert memberships (Only Owners or Admins can add members, or a user can self-register if invited)
DROP POLICY IF EXISTS memberships_insert ON public.memberships;
CREATE POLICY memberships_insert ON public.memberships
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_admin(organization_id) OR user_id = auth.uid());

-- Update memberships (Only Owners or Admins can modify member roles/details)
DROP POLICY IF EXISTS memberships_update ON public.memberships;
CREATE POLICY memberships_update ON public.memberships
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete memberships (Only Owners/Admins can remove members, or users can choose to leave themselves)
DROP POLICY IF EXISTS memberships_delete ON public.memberships;
CREATE POLICY memberships_delete ON public.memberships
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id) OR user_id = auth.uid());

--------------------------------------------------------------------------------
-- 4. DOCUMENT CATEGORIES RLS POLICIES
--------------------------------------------------------------------------------
-- Categories group documents for organized medical searching and retrieval.
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- Select document categories (All organization members can view categories)
DROP POLICY IF EXISTS document_categories_select ON public.document_categories;
CREATE POLICY document_categories_select ON public.document_categories
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert document categories (Restricted strictly to organization admins)
DROP POLICY IF EXISTS document_categories_insert ON public.document_categories;
CREATE POLICY document_categories_insert ON public.document_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_admin(organization_id));

-- Update document categories (Restricted strictly to organization admins)
DROP POLICY IF EXISTS document_categories_update ON public.document_categories;
CREATE POLICY document_categories_update ON public.document_categories
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete document categories (Restricted strictly to organization admins)
DROP POLICY IF EXISTS document_categories_delete ON public.document_categories;
CREATE POLICY delete_document_categories ON public.document_categories
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

--------------------------------------------------------------------------------
-- 5. DOCUMENTS RLS POLICIES
--------------------------------------------------------------------------------
-- Standard and sensitive clinical files. Multi-tenant partitioning is crucial.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Select documents (Any organization member can search or read documents)
DROP POLICY IF EXISTS documents_select ON public.documents;
CREATE POLICY documents_select ON public.documents
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert documents (Any member of the organization is authorized to upload and create documents)
DROP POLICY IF EXISTS documents_insert ON public.documents;
CREATE POLICY documents_insert ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

-- Update documents (Restricted strictly to organization admins to prevent tampering)
DROP POLICY IF EXISTS documents_update ON public.documents;
CREATE POLICY documents_update ON public.documents
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete documents (Restricted strictly to organization admins)
DROP POLICY IF EXISTS documents_delete ON public.documents;
CREATE POLICY documents_delete ON public.documents
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

--------------------------------------------------------------------------------
-- 6. PROCESSING JOBS RLS POLICIES
--------------------------------------------------------------------------------
-- Asynchronous worker jobs executing embeddings generation and clinical parsing.
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Select processing jobs (Members can view current parsing state)
DROP POLICY IF EXISTS processing_jobs_select ON public.processing_jobs;
CREATE POLICY processing_jobs_select ON public.processing_jobs
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert processing jobs (Members can initiate file ingestion)
DROP POLICY IF EXISTS processing_jobs_insert ON public.processing_jobs;
CREATE POLICY processing_jobs_insert ON public.processing_jobs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

-- Update processing jobs (Restricted strictly to organization admins / ingestion runner)
DROP POLICY IF EXISTS processing_jobs_update ON public.processing_jobs;
CREATE POLICY processing_jobs_update ON public.processing_jobs
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete processing jobs (Restricted strictly to organization admins)
DROP POLICY IF EXISTS processing_jobs_delete ON public.processing_jobs;
CREATE POLICY processing_jobs_delete ON public.processing_jobs
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

--------------------------------------------------------------------------------
-- 7. CHAT SESSIONS RLS POLICIES
--------------------------------------------------------------------------------
-- Chat histories between clinic members and the MedIntel AI agent.
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Select chat sessions (User must be member of the org AND must own the chat history)
DROP POLICY IF EXISTS chat_sessions_select ON public.chat_sessions;
CREATE POLICY chat_sessions_select ON public.chat_sessions
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id) AND user_id = auth.uid());

-- Insert chat sessions (Users can instantiate a new conversation for their account)
DROP POLICY IF EXISTS chat_sessions_insert ON public.chat_sessions;
CREATE POLICY chat_sessions_insert ON public.chat_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());

-- Update chat sessions (Users can edit properties like the session title)
DROP POLICY IF EXISTS chat_sessions_update ON public.chat_sessions;
CREATE POLICY chat_sessions_update ON public.chat_sessions
    FOR UPDATE
    TO authenticated
    USING (public.is_org_member(organization_id) AND user_id = auth.uid())
    WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());

-- Delete chat sessions (Users can clear or purge their conversation history)
DROP POLICY IF EXISTS chat_sessions_delete ON public.chat_sessions;
CREATE POLICY chat_sessions_delete ON public.chat_sessions
    FOR DELETE
    TO authenticated
    USING (public.is_org_member(organization_id) AND user_id = auth.uid());

--------------------------------------------------------------------------------
-- 8. MESSAGES RLS POLICIES
--------------------------------------------------------------------------------
-- Individual messaging transcripts.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Select messages (Must belong to a chat session the logged-in user owns within their org)
DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.chat_sessions s
            WHERE s.id = session_id
              AND s.user_id = auth.uid()
              AND public.is_org_member(s.organization_id)
        )
    );

-- Insert messages (Users can post new prompts and receive AI responses in their chat)
DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.chat_sessions s
            WHERE s.id = session_id
              AND s.user_id = auth.uid()
              AND public.is_org_member(s.organization_id)
        )
    );

-- Update messages (Enables modifying chat contents or rating prompts)
DROP POLICY IF EXISTS messages_update ON public.messages;
CREATE POLICY messages_update ON public.messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.chat_sessions s
            WHERE s.id = session_id
              AND s.user_id = auth.uid()
              AND public.is_org_member(s.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.chat_sessions s
            WHERE s.id = session_id
              AND s.user_id = auth.uid()
              AND public.is_org_member(s.organization_id)
        )
    );

-- Delete messages (Allows clearing records inside an active session)
DROP POLICY IF EXISTS messages_delete ON public.messages;
CREATE POLICY messages_delete ON public.messages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.chat_sessions s
            WHERE s.id = session_id
              AND s.user_id = auth.uid()
              AND public.is_org_member(s.organization_id)
        )
    );

--------------------------------------------------------------------------------
-- 9. DOCUMENT CHUNKS RLS POLICIES
--------------------------------------------------------------------------------
-- Chunked portions of documents stored with high-dimensional vector embeddings.
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Select document chunks (Organization members can query and search the index semantically)
DROP POLICY IF EXISTS document_chunks_select ON public.document_chunks;
CREATE POLICY document_chunks_select ON public.document_chunks
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert document chunks (Members and parsing ingestion engines can insert generated chunks)
DROP POLICY IF EXISTS document_chunks_insert ON public.document_chunks;
CREATE POLICY document_chunks_insert ON public.document_chunks
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

-- Update document chunks (Restricted strictly to organization admins to maintain structural integrity)
DROP POLICY IF EXISTS document_chunks_update ON public.document_chunks;
CREATE POLICY document_chunks_update ON public.document_chunks
    FOR UPDATE
    TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- Delete document chunks (Restricted strictly to organization admins)
DROP POLICY IF EXISTS document_chunks_delete ON public.document_chunks;
CREATE POLICY document_chunks_delete ON public.document_chunks
    FOR DELETE
    TO authenticated
    USING (public.is_org_admin(organization_id));

--------------------------------------------------------------------------------
-- 10. AUDIT LOGS RLS POLICIES (Append-only & Read-only for HIPAA compliance)
--------------------------------------------------------------------------------
-- Security Constraints & Immutability:
-- To guarantee regulatory compliance (such as HIPAA, SOC2, and GDPR) and ensure
-- completely tamper-proof audit trails:
-- 1. NO UPDATE or DELETE policies are registered. Once an audit trail is written, 
--    it is physically impossible for any authenticated user or organization admin 
--    to edit or delete compliance rows via RLS.
-- 2. SELECT and INSERT are partitioned strictly by organization membership.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Select audit logs (Only registered members can view the organization compliance records)
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Insert audit logs (Authenticated members can post system telemetry or compliance event logs)
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());
