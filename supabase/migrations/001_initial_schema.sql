-- Right Time Parts Tracker - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for statuses
CREATE TYPE boss_status_enum AS ENUM ('ordered', 'backorder', 'discontinued');
CREATE TYPE staff_status_enum AS ENUM ('received', 'part_defective', 'installed');
CREATE TYPE user_role_enum AS ENUM ('staff', 'boss', 'system_admin');

-- User Roles table - maps auth users to application roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Requests table - parent container for line items
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Request Items table - individual line items with status tracking
CREATE TABLE request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    job_bag_number VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    boss_status boss_status_enum,
    staff_status staff_status_enum,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on job_bag_number for fast lookups
CREATE INDEX idx_request_items_job_bag_number ON request_items(job_bag_number);
CREATE INDEX idx_request_items_boss_status ON request_items(boss_status);
CREATE INDEX idx_request_items_staff_status ON request_items(staff_status);
CREATE INDEX idx_request_items_manufacturer ON request_items(manufacturer);

-- Audit Logs table - immutable status change history
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    field_changed VARCHAR(50) NOT NULL CHECK (field_changed IN ('boss_status', 'staff_status')),
    old_value VARCHAR(50),
    new_value VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_request_item_id ON audit_logs(request_item_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on request_items
CREATE TRIGGER update_request_items_updated_at
    BEFORE UPDATE ON request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role_enum AS $$
    SELECT role FROM user_roles WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is boss
CREATE OR REPLACE FUNCTION is_boss(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid AND role = 'boss'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- USER_ROLES POLICIES
-- ============================================

-- Users can read their own role
CREATE POLICY "Users can read own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Boss can read all roles
CREATE POLICY "Boss can read all roles"
    ON user_roles FOR SELECT
    USING (is_boss(auth.uid()));

-- ============================================
-- REQUESTS POLICIES
-- ============================================

-- All authenticated users can read all requests
CREATE POLICY "Authenticated users can read all requests"
    ON requests FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can create requests
CREATE POLICY "Authenticated users can create requests"
    ON requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- ============================================
-- REQUEST_ITEMS POLICIES
-- ============================================

-- All authenticated users can read all items
CREATE POLICY "Authenticated users can read all items"
    ON request_items FOR SELECT
    TO authenticated
    USING (true);

-- Staff can create items (items they create)
CREATE POLICY "Staff can create items"
    ON request_items FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Boss can update boss_status only
CREATE POLICY "Boss can update boss_status"
    ON request_items FOR UPDATE
    TO authenticated
    USING (is_boss(auth.uid()))
    WITH CHECK (is_boss(auth.uid()));

-- Staff can update staff_status (with restrictions handled in app layer)
-- Note: Fine-grained column-level restrictions are enforced in the application
CREATE POLICY "Staff can update items"
    ON request_items FOR UPDATE
    TO authenticated
    USING (NOT is_boss(auth.uid()))
    WITH CHECK (NOT is_boss(auth.uid()));

-- ============================================
-- AUDIT_LOGS POLICIES
-- ============================================

-- All authenticated users can read all audit logs
CREATE POLICY "Authenticated users can read audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (true);

-- All authenticated users can create audit logs
CREATE POLICY "Authenticated users can create audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = changed_by);
