# MedIntel AI - System Architecture

This document describes the high-level system architecture of the **MedIntel AI** platform—a secure, multi-tenant AI Medical RAG (Retrieval-Augmented Generation) SaaS application designed for clinical guidelines, scientific publications, and healthcare knowledge retrieval.

## System Overview

```
                        +----------------------------------+
                        |           Web Browser            |
                        |      React / Vite Frontend       |
                        +-----------------+----------------+
                                          |
                                          | HTTPS / WebSockets
                                          v
                        +-----------------+----------------+
                        |          Express API             |
                        |       Application Server         |
                        +--------+----------------+--------+
                                 |                |
                Supabase Auth SDK|                | pgvector Search
                                 v                v
                        +--------+--------+  +----+--------+
                        |  Supabase Auth  |  |  PostgreSQL |
                        |  Secure Sessions|  |  Vector DB  |
                        +-----------------+  +-------------+
```

## Core Components

### 1. Client Application (Vite / React)
The user interface is a desktop-grade dashboard containing clean clinical workspaces:
* **Medical Knowledge Hub**: An ingestion engine where clinicians can upload, preview, and organize scientific guidelines, clinical PDFs, and research manuals.
* **Clinical Chat Interface**: A secure chat experience allowing users to query uploaded documents with real-time semantic RAG citations and medical-grade referencing.
* **Organization & Multi-Tenancy**: Support for clinical organizations (clinics, labs, research hospitals) with robust team management, invites, and granular role assignments.

### 2. Authentication & Session Management (Supabase Auth)
Migrated from the local state simulator to the official `@supabase/supabase-js` SDK:
* **Email & Password**: Standard password authentication with robust hashing.
* **Persistent Sessions**: Automated cookie and LocalStorage tokens handling for frictionless session continuity.
* **Email Verification**: Multi-factor signup verification flow utilizing secure OTPs.
* **Role Partitioning**: Decoupled from the profile schema to live inside memberships, enabling flexible user roles across multiple clinics.

### 3. Application Server (Future Express Service)
A secure middle-tier endpoint that routes requested clinical document workloads:
* Proxies the Gemini / OpenAI LLM requests to keep sensitive keys completely hidden.
* Manages chunking pipelines, OCR services, and vector uploads without risking client secrets exposure.

### 4. Database Engine (Supabase PostgreSQL)
A production-grade PostgreSQL service enhanced with the `pgvector` extension for semantic search and high-dimensional document search:
* **Multi-Tenant Partitioning**: Key entities are linked directly to `organizations` (tenants) with clean isolation constraints.
* **Auditability & Compliance**: Dedicated logs record clinical operations to satisfy security compliance standards.
