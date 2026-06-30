-- MedIntel AI - Production Database Schema (Part 4: Storage Buckets Configuration)
-- Compatible with Supabase PostgreSQL (Postgres 15+)

--------------------------------------------------------------------------------
-- 1. STORAGE BUCKETS CONFIGURATION
--------------------------------------------------------------------------------
-- Create the 'medical-documents' bucket under the storage schema.
-- This bucket is configured as PRIVATE to maintain strict HIPAA and medical confidentiality standards.
-- Row Level Security (RLS) policies will be established in a separate dedicated migration.
--
-- Purpose:
-- - Stores organization-specific medical knowledge documents.
-- - Supports PDFs, DOCX, DOC, TXT, and Markdown files.
-- - Used by the Knowledge Library for document uploads.
-- - Bucket remains private and will be secured later using Row Level Security (RLS).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'medical-documents',
    'medical-documents',
    false,     -- Private bucket: access requires explicit signature/policy approval
    52428800,  -- Maximum upload size limit of 50 MB (52,428,800 bytes)
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
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    updated_at = now();
