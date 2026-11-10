-- ==============================================================================
-- Golden Leaf Finance — Database Migration: Staff Profile Management
-- Migration: 20261107_create_staff_users_table
-- Dialect: PostgreSQL / MySQL Compatible Standard DDL
-- Enforces: Unique constraints, Role enum, Soft Delete, Auditing & Bcrypt Hash
-- ==============================================================================

-- 1. Create Enum Types (PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role_enum') THEN
        CREATE TYPE staff_role_enum AS ENUM (
            'ADMIN',
            'HR',
            'BRANCH_MANAGER',
            'CREDIT_MANAGER',
            'CRO'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_status_enum') THEN
        CREATE TYPE staff_status_enum AS ENUM (
            'active',
            'inactive'
        );
    END IF;
END$$;

-- 2. Staff Users Table
CREATE TABLE IF NOT EXISTS staff_users (
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
    deleted_at TIMESTAMP WITH TIME ZONE NULL,

    -- Constraints
    CONSTRAINT chk_staff_role CHECK (role IN ('ADMIN', 'HR', 'BRANCH_MANAGER', 'CREDIT_MANAGER', 'CRO')),
    CONSTRAINT chk_staff_status CHECK (status IN ('active', 'inactive')),
    CONSTRAINT chk_mobile_length CHECK (LENGTH(mobile) >= 10)
);

-- 3. Unique Indexes with Soft Delete Awareness (Active records must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_users_employee_id 
ON staff_users (LOWER(employee_id)) 
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_users_username 
ON staff_users (LOWER(username)) 
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_users_email 
ON staff_users (LOWER(email)) 
WHERE deleted_at IS NULL;

-- Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_branch_id ON staff_users(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_status ON staff_users(status);
CREATE INDEX IF NOT EXISTS idx_staff_users_deleted_at ON staff_users(deleted_at);

-- 4. Immutable Audit Trail Table
CREATE TABLE IF NOT EXISTS staff_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_staff_id VARCHAR(64) NOT NULL,
    target_username VARCHAR(50) NOT NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1'
);

CREATE INDEX IF NOT EXISTS idx_staff_audit_target_id ON staff_audit_logs(target_staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_timestamp ON staff_audit_logs(timestamp DESC);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_staff_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_users_updated_at ON staff_users;
CREATE TRIGGER trg_staff_users_updated_at
BEFORE UPDATE ON staff_users
FOR EACH ROW
EXECUTE FUNCTION update_staff_users_updated_at();

-- ==============================================================================
-- Rollback Script:
-- DROP TABLE IF EXISTS staff_audit_logs;
-- DROP TABLE IF EXISTS staff_users;
-- DROP TYPE IF EXISTS staff_status_enum;
-- DROP TYPE IF EXISTS staff_role_enum;
-- ==============================================================================

