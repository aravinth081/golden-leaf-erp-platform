// ──────────────────────────────────────────────────
// Golden Leaf Finance — Audit Log Types
// ──────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  timestamp: Date;
  actorId: string;            // UID of the user who performed the action
  actorName: string;          // Denormalized for display
  actorRole: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName?: string;        // e.g., customer name, loan ID
  branchId?: string;
  before?: Record<string, unknown>;  // Document state before change
  after?: Record<string, unknown>;   // Document state after change
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'soft_delete'
  | 'restore'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'disburse'
  | 'collect'
  | 'close'
  | 'verify'
  | 'role_change'
  | 'status_change'
  | 'force_logout'
  | 'export';

export type AuditEntity =
  | 'customer'
  | 'loan'
  | 'collection'
  | 'employee'
  | 'branch'
  | 'loan_plan'
  | 'attendance'
  | 'kyc'
  | 'settings'
  | 'auth'
  | 'report';

export interface AuditLogFilters {
  actorId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
  branchId?: string;
  dateRange?: { start: Date; end: Date };
}
