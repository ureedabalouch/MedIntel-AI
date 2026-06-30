-- MedIntel AI - Production Database Schema (Part 2: Document Management Layer)
-- Compatible with Supabase PostgreSQL (Postgres 15+)

--------------------------------------------------------------------------------
-- 1. DOCUMENT CATEGORIES (Organization-Specific Custom Taxonomy)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50),
    icon VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Category names must be unique within a single organization to prevent duplication
    CONSTRAINT uq_organization_category_name UNIQUE (organization_id, name)
);

-- Index for scanning and listing categories within an organization
CREATE INDEX IF NOT EXISTS idx_document_categories_org_id ON public.document_categories(organization_id);

--------------------------------------------------------------------------------
-- 2. DOCUMENTS (Medical Knowledge Base Metadata)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    page_count INTEGER,
    checksum VARCHAR(64),
    language VARCHAR(10) DEFAULT 'en',
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Check constraint for allowed documents status lifecycle values
    CONSTRAINT chk_document_status CHECK (status IN (
        'uploaded',
        'processing',
        'indexed',
        'failed'
    ))
);

-- Indexes for document search, filtering, and foreign key relations
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

--------------------------------------------------------------------------------
-- 3. PROCESSING JOBS (To track asynchronous document ingestion workflows)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    current_step VARCHAR(255),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Check constraint for valid job type steps
    CONSTRAINT chk_processing_job_type CHECK (job_type IN (
        'extraction',
        'ocr',
        'chunking',
        'embedding',
        'indexing'
    )),
    
    -- Check constraint for valid job status states
    CONSTRAINT chk_processing_job_status CHECK (status IN (
        'queued',
        'running',
        'completed',
        'failed'
    )),
    
    -- Progress must remain in a valid range
    CONSTRAINT chk_processing_job_progress CHECK (progress_percentage BETWEEN 0 AND 100)
);

-- Indexes for performance on active job monitoring and queries
CREATE INDEX IF NOT EXISTS idx_processing_jobs_doc_id ON public.processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_org_id ON public.processing_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);

--------------------------------------------------------------------------------
-- UPDATED_AT TIMESTAMP TRIGGERS
--------------------------------------------------------------------------------
-- Apply trigger helper from 001_initial_schema.sql to automatically manage updated_at on change

DROP TRIGGER IF EXISTS trigger_document_categories_updated_at ON public.document_categories;
CREATE TRIGGER trigger_document_categories_updated_at
BEFORE UPDATE ON public.document_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_documents_updated_at ON public.documents;
CREATE TRIGGER trigger_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_processing_jobs_updated_at ON public.processing_jobs;
CREATE TRIGGER trigger_processing_jobs_updated_at
BEFORE UPDATE ON public.processing_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
