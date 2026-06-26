-- MedIntel AI - Development Seed Script

-- 1. Insert Mock Organizations
INSERT INTO public.organizations (id, name, slug, org_type)
VALUES 
  ('8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 'Sacre Coeur Medical Center', 'sacre-coeur-medical', 'Hospital'),
  ('d884be5e-19d2-43bb-a5a5-ef726a26df01', 'Helix Genomics Laboratories', 'helix-genomics', 'ResearchLab')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Mock Profile entries (Note: in production these link to auth.users)
-- Create dummy auth user UUIDs
INSERT INTO public.profiles (id, email, full_name, avatar_url)
VALUES
  ('33f52422-7711-447a-9cb8-bc3861cdb5e8', 'dr.smith@medintel.ai', 'Dr. Alistair Smith', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'),
  ('bc266ee1-449a-411a-8c54-7f1ef2e86efd', 'dr.johnson@medintel.ai', 'Dr. Sarah Johnson', 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Memberships linking users with correct organization-specific roles
INSERT INTO public.memberships (id, user_id, organization_id, role)
VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '33f52422-7711-447a-9cb8-bc3861cdb5e8', '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 'Owner'),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'bc266ee1-449a-411a-8c54-7f1ef2e86efd', '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 'Doctor')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Document Categories
INSERT INTO public.document_categories (id, organization_id, name, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 'Clinical Guidelines', 'Standard operating procedures and clinical references'),
  ('22222222-2222-2222-2222-222222222222', '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 'Research Papers', 'Peer-reviewed literature and scientific breakthroughs'),
  ('33333333-3333-3333-3333-333333333333', '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 'Drug Monographs', 'Formulary information and dosing constraints')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Sample Documents
INSERT INTO public.documents (id, organization_id, category_id, title, description, file_path, file_size, mime_type, is_processed, metadata)
VALUES
  (
    'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d', 
    '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 
    '11111111-1111-1111-1111-111111111111', 
    'AHA_Hypertension_Guidelines_2026.pdf', 
    'Updated AHA and ACC guidelines for blood pressure management in high-risk adult patients.', 
    'documents/8a73b221-d77c-4739-bf8c-1e24ef5a24aa/aha_guidelines.pdf', 
    2411000, 
    'application/pdf', 
    TRUE,
    '{"disease": "Hypertension", "author": "AHA Clinical Council", "confidentiality": "internal"}'::jsonb
  ),
  (
    'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', 
    '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 
    '22222222-2222-2222-2222-222222222222', 
    'GLP1_Agonists_Cardiovascular_Outcomes.pdf', 
    'NEJM study evaluating risk reduction of major adverse cardiovascular events using GLP-1 therapy.', 
    'documents/8a73b221-d77c-4739-bf8c-1e24ef5a24aa/nejm_glp1_study.pdf', 
    1845000, 
    'application/pdf', 
    FALSE,
    '{"drug_class": "GLP-1", "therapeutic_area": "Cardiology", "status": "draft"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Mock Document Chunk (for RAG testing)
INSERT INTO public.document_chunks (id, document_id, content, embedding, page_number, chunk_index, metadata)
VALUES
  (
    'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f',
    'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
    'Hypertension guidelines recommend initiating dual therapy in stage 2 hypertension with BP exceeding 140/90 mmHg. ACE inhibitors or ARBs represent gold-standard first-line compounds unless contraindicated by chronic renal compromise or acute pregnancy.',
    NULL, -- Set to null; in production, pgvector embeddings are populated by AI pipeline
    1,
    0,
    '{"section": "Initiation of Pharmacotherapy"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Mock Ingestion/Processing Job
INSERT INTO public.processing_jobs (id, document_id, organization_id, current_status, progress_percentage, current_step, started_at)
VALUES
  (
    'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a',
    'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
    '8a73b221-d77c-4739-bf8c-1e24ef5a24aa',
    'Chunking',
    40,
    'Segmenting PDF text streams into optimized 500-token chunks with overlap...',
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Chat Sessions & Sample Conversations
INSERT INTO public.chat_sessions (id, organization_id, user_id, title)
VALUES
  ('e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b', '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', '33f52422-7711-447a-9cb8-bc3861cdb5e8', 'First-line Hypertension Tx')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (id, chat_session_id, role, content, metadata)
VALUES
  (
    'f5a6b7c8-d90e-1f2a-3b4c-5d6e7f8a9b0c',
    'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b',
    'user',
    'What is the recommended first-line drug therapy for a stage 2 hypertension patient with diabetes?',
    '{}'::jsonb
  ),
  (
    'a6b7c8d9-0e1f-2a3b-4c5d-6e7f8a9b0c1d',
    'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b',
    'assistant',
    'According to the AHA 2026 guidelines, for patients presenting with both Stage 2 Hypertension and Diabetes, first-line antihypertensive therapy should begin with an ACE Inhibitor (e.g., Lisinopril) or an Angiotensin Receptor Blocker (ARB) (e.g., Losartan). This is recommended due to their protective renal outcomes.',
    '{"citations": [{"title": "AHA_Hypertension_Guidelines_2026.pdf", "chunk_id": "c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f", "page": 1}], "model": "gemini-1.5-pro", "tokens": 482}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Sample Audit logs
INSERT INTO public.audit_logs (organization_id, user_id, action, entity_type, entity_id, details)
VALUES
  (
    '8a73b221-d77c-4739-bf8c-1e24ef5a24aa', 
    '33f52422-7711-447a-9cb8-bc3861cdb5e8', 
    'DOCUMENT_UPLOADED', 
    'Document', 
    'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
    '{"filename": "AHA_Hypertension_Guidelines_2026.pdf", "size_bytes": 2411000}'::jsonb
  )
ON CONFLICT DO NOTHING;
