-- MedIntel AI - Production Database Schema (Part 4: Storage Buckets Configuration)
-- Compatible with Supabase PostgreSQL (Postgres 15+)

--------------------------------------------------------------------------------
-- 1. STORAGE BUCKETS CONFIGURATION
--------------------------------------------------------------------------------
-- Create the 'medical-documents' bucket under the storage schema.
-- This bucket is configured as PRIVATE to maintain strict HIPAA and medical confidentiality standards.
-- Row Level Security (RLS) policies will be established in a separate dedicated migration.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'medical-documents',
    'medical-documents',
    false, -- Private bucket: access requires explicit signature/policy approval
    NULL,  -- Use default file size limits
    ARRAY[
        'application/pdf',                                                        -- Portable Document Format (PDF)
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- Microsoft Word (DOCX)
        'application/msword',                                                     -- Microsoft Word Legacy (DOC)
        'text/plain',                                                             -- Plain Text files (.txt)
        'text/markdown'                                                           -- Markdown documents (.md)
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    updated_at = now();
