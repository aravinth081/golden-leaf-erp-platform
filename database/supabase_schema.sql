-- ==============================================================================
-- Golden Leaf Finance — Complete Supabase PostgreSQL Schema
-- Dialect: PostgreSQL (Supabase Compatible)
-- Includes: Universal Document Store (JSONB with GIN indexing),
--           Staff Users Table, Audit Logging, and Realtime Subscriptions
-- ==============================================================================

-- 1. Enable Useful Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Universal Document Store for Collections
-- Handles customers, loans, collections, fixed deposits, attendance, expenses, etc.
CREATE TABLE IF NOT EXISTS public.documents (
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    data JSONB NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection, id)
);

-- Indexes for blazing fast querying & filtering
CREATE INDEX IF NOT EXISTS idx_documents_collection ON public.documents (collection);
CREATE INDEX IF NOT EXISTS idx_documents_col_active ON public.documents (collection, is_deleted);
CREATE INDEX IF NOT EXISTS idx_documents_data_gin ON public.documents USING GIN (data);

-- 3. Staff Users Table (Institutional RBAC)
CREATE TABLE IF NOT EXISTS public.staff_users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'CRO',
    branch_id VARCHAR(64) NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_users_emp_id 
ON public.staff_users (LOWER(employee_id)) 
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_users_username 
ON public.staff_users (LOWER(username)) 
WHERE deleted_at IS NULL;

-- 4. Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    old_data JSONB NULL,
    new_data JSONB NULL,
    ip_address VARCHAR(45) NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity, entity_id);

-- 5. Row Level Security (RLS) Policies
-- Enables seamless access using Supabase Anon Public Key
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all authenticated & anon client requests
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access to documents" ON public.documents;
    CREATE POLICY "Public access to documents" ON public.documents
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to staff_users" ON public.staff_users;
    CREATE POLICY "Public access to staff_users" ON public.staff_users
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access to audit_logs" ON public.audit_logs;
    CREATE POLICY "Public access to audit_logs" ON public.audit_logs
        FOR ALL USING (true) WITH CHECK (true);
END$$;

-- 6. Enable Realtime Publications
-- Allows frontend to subscribe to live collection updates
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_users;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;
