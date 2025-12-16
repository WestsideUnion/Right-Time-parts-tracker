// Database types for Right Time Parts Tracker

export type UserRole = 'staff' | 'boss' | 'system_admin';

export type BossStatus = 'ordered' | 'backorder' | 'discontinued' | null;

export type StaffStatus = 'received' | 'part_defective' | 'installed' | null;

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Request {
  id: string;
  created_by: string;
  created_at: string;
  notes: string | null;
}

export interface RequestItem {
  id: string;
  request_id: string;
  job_bag_number: string;
  manufacturer: string;
  part_name: string;
  description: string | null;
  quantity: number;
  boss_status: BossStatus;
  staff_status: StaffStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  installed_at?: string;
}

export interface RequestItemWithRequest extends RequestItem {
  requests?: {
    created_at: string;
    notes: string | null;
  };
}

export interface AuditLog {
  id: string;
  request_item_id: string;
  field_changed: 'boss_status' | 'staff_status';
  old_value: string | null;
  new_value: string;
  changed_by: string;
  changed_at: string;
}

export interface AuditLogWithUser extends AuditLog {
  user_email?: string;
}

// Form input types
export interface RequestItemInput {
  job_bag_number: string;
  manufacturer: string;
  part_name: string;
  description?: string;
  quantity: number;
}

// Filter types
export interface ItemFilters {
  search?: string;
  job_bag_number?: string;
  manufacturer?: string;
  boss_status?: BossStatus | 'all' | '';
  staff_status?: StaffStatus | 'all' | '';
}
