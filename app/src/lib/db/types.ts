export type MembershipRole = "owner" | "admin" | "setter" | "closer" | "viewer";
export type DealStage = "new" | "qualified" | "booked" | "show" | "won" | "lost";

export interface DbAuthUser {
  id: string;
  email?: string;
}

export interface DbContext {
  user: DbAuthUser;
  organizationId: string;
  role: MembershipRole;
  accessToken: string;
}

export interface LeadRow {
  id: string;
  organization_id: string;
  assigned_to_user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  source: string;
  score: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DealRow {
  id: string;
  organization_id: string;
  lead_id: string;
  owner_user_id: string | null;
  stage: DealStage;
  value: number;
  currency: string;
  notes: string;
  objections: string[];
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_value: string | null;
  trigger_window_minutes: number | null;
  conditions: unknown[];
  actions: unknown[];
  active: boolean;
  execution_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}
