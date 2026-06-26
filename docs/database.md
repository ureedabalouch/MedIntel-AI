# MedIntel AI - Relational Database Schema Documentation

This document describes the design, relationships, and structural decisions behind the relational schema used by **MedIntel AI** to support clinical multi-tenancy, vector retrieval (RAG), and security audit tracking.

## Entity Relationship Overview

```
 [auth.users] (Supabase Built-in)
      | (1)
      v (1)
  [profiles] (Extends Profile metadata)
      | (1)
      |
      |   (Many-to-Many via Memberships)
      +---------------+
                      |
                      v (Many)
                 [memberships] <-------- [organizations] (Tenants)
                      ^ (Many)                | (1)
                      |                       | (1)
                      |                       v (Many)
                      +------------------ [documents] <------- [processing_jobs] (Ingestion Pipeline)
                                              | (1)
                                              | (1)
                                              v (Many)
                                        [document_chunks] (Semantic Embeddings)
```

## Schema Decoupling & Decisions

### 1. Multi-Tenancy Architecture
Each user belongs to one or more tenants via the `memberships` table. Key clinical data like `documents`, `chat_sessions`, and `document_categories` are partition-isolated via `organization_id` foreign keys. This guarantees strict logical separation between medical groups.

### 2. Role Decoupling
To allow healthcare professionals to hold different access levels across clinics (e.g., a **Doctor** in Hospital A, but a **Researcher** or **Observer** in Research Lab B), the `role` field lives inside `memberships` instead of `profiles`.

### 3. Processing Jobs Pipeline
To handle asynchronous text extraction (such as complex medical PDFs, charts, or low-resolution OCR workloads), the `processing_jobs` table tracks the precise lifecycle status of document parsing:
* `Pending` -> `Extracting` -> `Chunking` -> `Embedding` -> `Completed` / `Failed`.

### 4. RAG-Ready Vector Tables
The `document_chunks` table leverages PostgreSQL's native `VECTOR` type (`vector(1536)` for standard models like `text-embedding-3-small`). This enables cosine distance vector queries to execute directly inside Postgres.

---

## Table Schemas

### `profiles`
Extends the primary authentication credentials of Supabase.
* **Fields:** `id` (UUID), `email` (Text), `full_name` (Text), `avatar_url` (Text), `timestamps`.

### `organizations`
Defines logical medical boundaries.
* **Fields:** `id` (UUID), `name` (Text), `slug` (Text), `org_type` (Text), `timestamps`.

### `memberships`
Junction table mapping users to tenant organizations with custom authorization roles.
* **Fields:** `id` (UUID), `user_id` (UUID), `organization_id` (UUID), `role` (Text), `timestamps`.

### `document_categories`
Clinical taxonomy categorization tags for medical knowledge organizing.
* **Fields:** `id` (UUID), `organization_id` (UUID), `name` (Text), `description` (Text), `timestamps`.

### `documents`
Uploaded medical research papers, guidelines, manuals, or journals.
* **Fields:** `id` (UUID), `organization_id` (UUID), `category_id` (UUID), `title` (Text), `file_path` (Text), `file_size` (Int), `mime_type` (Text), `is_processed` (Bool), `metadata` (JSONB), `timestamps`.

### `processing_jobs`
Lifecycle tracker for asynchronous document ingestion pipelines.
* **Fields:** `id` (UUID), `document_id` (UUID), `organization_id` (UUID), `current_status` (Text), `progress_percentage` (Int), `current_step` (Text), `error_message` (Text), `timestamps`.

### `document_chunks`
Granular text intervals containing pre-computed vector embeddings for AI semantic query lookups.
* **Fields:** `id` (UUID), `document_id` (UUID), `content` (Text), `embedding` (Vector), `page_number` (Int), `chunk_index` (Int), `metadata` (JSONB), `timestamps`.

### `chat_sessions`
Context boundaries representing individual interactive conversations.
* **Fields:** `id` (UUID), `organization_id` (UUID), `user_id` (UUID), `title` (Text), `timestamps`.

### `messages`
Sequential query and response instances recorded inside chat sessions.
* **Fields:** `id` (UUID), `chat_session_id` (UUID), `role` (Text), `content` (Text), `metadata` (JSONB), `timestamps`.

### `audit_logs`
Compliance trails to record security and patient/clinician operational actions.
* **Fields:** `id` (UUID), `organization_id` (UUID), `user_id` (UUID), `action` (Text), `entity_type` (Text), `entity_id` (UUID), `details` (JSONB), `ip_address` (Text), `created_at`.
