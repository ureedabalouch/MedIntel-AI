-- MedIntel AI - Production Database Schema (Part 3: AI Conversation System)
-- Compatible with Supabase PostgreSQL (Postgres 15+)

--------------------------------------------------------------------------------
-- 1. CHAT SESSIONS (AI Context Boundaries within Multi-Tenant Organizations)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    description TEXT,
    model_name VARCHAR(100) DEFAULT 'gemini-2.5-pro',
    conversation_mode VARCHAR(30) NOT NULL DEFAULT 'hybrid',
    system_prompt TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Check constraint for allowed conversation modes
    CONSTRAINT chk_conversation_mode CHECK (conversation_mode IN (
        'document',
        'hybrid',
        'general'
    ))
);

-- Indexes for performance and quick scans
CREATE INDEX IF NOT EXISTS idx_chat_sessions_org_id ON public.chat_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON public.chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_pinned_created ON public.chat_sessions(is_pinned DESC, created_at DESC);

--------------------------------------------------------------------------------
-- 2. MESSAGES (Append-only records of user-assistant interactions)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    model_name VARCHAR(100),
    feedback SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Check constraint for allowed message roles
    CONSTRAINT chk_message_role CHECK (role IN (
        'user',
        'assistant',
        'system'
    )),

    -- Check constraint for qualitative feedback (NULL, positive thumbs up, or negative thumbs down)
    CONSTRAINT chk_message_feedback CHECK (feedback IN (1, -1))
);

-- B-Tree indexes for sequential history loading, user tracking, and fast filtering
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- GIN indexes for low-latency JSON extraction (caching, citations lookup, and telemetry analysis)
CREATE INDEX IF NOT EXISTS idx_messages_metadata_gin ON public.messages USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_messages_citations_gin ON public.messages USING gin (citations);

--------------------------------------------------------------------------------
-- UPDATED_AT TIMESTAMP TRIGGER
--------------------------------------------------------------------------------
-- Apply the reusable trigger helper from Migration 001 to maintain session updates

DROP TRIGGER IF EXISTS trigger_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trigger_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
