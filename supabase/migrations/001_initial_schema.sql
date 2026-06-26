-- MedIntel AI - Multi-Tenant Relational Database Schema
-- Compatible with Supabase PostgreSQL (Postgres 15+)

-- Enable vector extension for future RAG / embedding capabilities
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for profile emails to speed up searches
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

--------------------------------------------------------------------------------
-- 2. ORGANIZATIONS (Multi-tenant partition)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    org_type TEXT DEFAULT 'Clinic', -- 'Clinic', 'Hospital', 'ResearchLab', etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on organization slug
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

--------------------------------------------------------------------------------
-- 3. MEMBERSHIPS (Associates profiles with multiple organizations)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'Member', -- 'Owner', 'Admin', 'Doctor', 'Researcher', 'Member'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

-- Indexes for performance on membership lookups
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON public.memberships(organization_id);

--------------------------------------------------------------------------------
-- 4. DOCUMENT CATEGORIES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite unique name within an organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_org_name ON public.document_categories(organization_id, name);

--------------------------------------------------------------------------------
-- 5. DOCUMENTS (Medical Reference Knowledge, Guidelines, Manuals)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL, -- Path to storage bucket
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    is_processed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb, -- Custom key-value tags, clinical categorization, author info
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for organization-level documents list and processing status
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_processed ON public.documents(is_processed);

--------------------------------------------------------------------------------
-- 6. DOCUMENT CHUNKS (For AI RAG retrieval)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Vector embeddings (e.g. OpenAI text-embedding-3-small or Gemini text-embedding-004)
    page_number INTEGER,
    chunk_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast sequential reading, and vector search index (HNSW / IVFFlat can be added later)
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON public.document_chunks(document_id);

--------------------------------------------------------------------------------
-- 7. PROCESSING JOBS (To track async document ingestion, OCR, chunking, embedding)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    current_status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Extracting', 'Chunking', 'Embedding', 'Completed', 'Failed'
    progress_percentage INTEGER DEFAULT 0,
    current_step VARCHAR(100),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for active job tracking
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.processing_jobs(current_status);
CREATE INDEX IF NOT EXISTS idx_jobs_document_id ON public.processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON public.processing_jobs(organization_id);

--------------------------------------------------------------------------------
-- 8. CHAT SESSIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for users retrieving their history per organization
CREATE INDEX IF NOT EXISTS idx_chats_user_org ON public.chat_sessions(organization_id, user_id);

--------------------------------------------------------------------------------
-- 9. MESSAGES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Stores citations, model name, retrieved chunk IDs, token count
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index messages by chat session to load history quickly
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(chat_session_id);

--------------------------------------------------------------------------------
-- 10. AUDIT LOGS (Compliance, security tracking)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'SIGN_IN', 'DOCUMENT_UPLOADED', 'AI_QUERY_ISSUED', etc.
    entity_type VARCHAR(100), -- 'Document', 'ChatSession', 'Membership'
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index logs for organization and compliance audits
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

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

-- Apply triggers
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON public.document_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_chunks_updated_at BEFORE UPDATE ON public.document_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_processing_jobs_updated_at BEFORE UPDATE ON public.processing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_chats_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
