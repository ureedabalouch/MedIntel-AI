export type ViewType = 'landing' | 'dashboard' | 'documents' | 'assistant' | 'search' | 'analytics' | 'settings' | 'support' | 'supabase';

export type UserRole = 'Administrator' | 'Doctor' | 'Researcher' | 'Medical Student' | 'Nurse' | 'Hospital Staff';

export type MemberRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';

export type OrgType = 'Hospital' | 'Clinic' | 'University' | 'Research Institute' | 'Other';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string; // matches user.id
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrgType;
  country: string;
  timezone: string;
  is_personal: boolean;
  created_at: string;
  join_code: string;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  organization_id: string;
  uploaded_by: string;
  uploaded_by_id: string;
  date: string;
  last_modified: string;
  size: string;
  file_type: string;
  version: string;
  status: 'Ready' | 'Indexing' | 'Failed' | 'Draft';
  compliance: 'HIPAA compliant' | 'GDPR compliant';
  patientId?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  organization_id: string | null; // null for system defaults, string for organization-specific custom ones
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  category: 'RAG Query' | 'Doc Ingest' | 'Auth' | 'System';
  status: 'Success' | 'Warning' | 'Error';
}

export interface MetricCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
}
