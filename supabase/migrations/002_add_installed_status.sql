-- Migration to add 'installed' status and 'system_admin' role

-- Add 'installed' to staff_status_enum
ALTER TYPE staff_status_enum ADD VALUE IF NOT EXISTS 'installed';

-- Add installed_at column to track when item was installed
ALTER TABLE request_items ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ;

-- Add 'system_admin' to user_role_enum
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'system_admin';

-- Create index on installed_at for performance
CREATE INDEX IF NOT EXISTS idx_request_items_installed_at ON request_items(installed_at);
