// ==========================================
// Enums (as const objects for TS5.9 erasableSyntaxOnly)
// ==========================================

export const UserRole = {
  TRAFFIC_OFFICER: 'traffic_officer',
  ADMIN_DIRECTOR: 'admin_director',
  TRANSPORT_MAINTENANCE_DIRECTOR: 'transport_maintenance_director',
  ROUTING_DIRECTOR: 'routing_director',
  MAINTENANCE_OFFICER: 'maintenance_officer',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const RequestStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_ADMIN_REVIEW: 'under_admin_review',
  RETURNED_BY_ADMIN: 'returned_by_admin',
  REJECTED_BY_ADMIN: 'rejected_by_admin',
  UNDER_TRANSPORT_MAINTENANCE_REVIEW: 'under_transport_maintenance_review',
  REJECTED_BY_TRANSPORT_MAINTENANCE: 'rejected_by_transport_maintenance',
  UNDER_ROUTING_REVIEW: 'under_routing_review',
  REJECTED_BY_ROUTING: 'rejected_by_routing',
  ROUTED_TO_MAINTENANCE: 'routed_to_maintenance',
  RETURNED_BY_MAINTENANCE: 'returned_by_maintenance',
  REJECTED_BY_MAINTENANCE: 'rejected_by_maintenance',
  IN_EXECUTION: 'in_execution',
  AWAITING_FINAL_DECISION: 'awaiting_final_decision',
  COMPLETED: 'completed',
  NEEDS_FOLLOW_UP: 'needs_follow_up',
  COULD_NOT_COMPLETE: 'could_not_complete',
  CLOSED: 'closed',
} as const;
export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];

export const Priority = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type Priority = typeof Priority[keyof typeof Priority];

export const IssueCategory = {
  ENGINE: 'engine',
  BRAKES: 'brakes',
  ELECTRICAL: 'electrical',
  TIRES: 'tires',
  AC: 'ac',
  BODY: 'body',
  SUSPENSION: 'suspension',
  TRANSMISSION: 'transmission',
  OIL_CHANGE: 'oil_change',
  GENERAL: 'general',
} as const;
export type IssueCategory = typeof IssueCategory[keyof typeof IssueCategory];

export const VehicleCondition = {
  OPERATIONAL: 'operational',
  PARTIALLY: 'partially',
  NON_OPERATIONAL: 'non_operational',
} as const;
export type VehicleCondition = typeof VehicleCondition[keyof typeof VehicleCondition];

export const NotificationType = {
  REQUEST_SUBMITTED: 'request_submitted',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_REJECTED: 'request_rejected',
  REQUEST_RETURNED: 'request_returned',
  REQUEST_ROUTED: 'request_routed',
  REQUEST_IN_EXECUTION: 'request_in_execution',
  REQUEST_COMPLETED: 'request_completed',
  FINAL_RESULT_AVAILABLE: 'final_result_available',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// ==========================================
// Domain Types
// ==========================================

export interface User {
  id: string;
  name: string;
  employeeId: string;
  role: UserRole;
  department: string;
  email: string;
  avatar?: string;
}

export interface Vehicle {
  vehicleNumber: string;
  plateNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  color: string;
  currentCondition: VehicleCondition;
}

export interface RequestAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TimelineEntry {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  performedByRole: UserRole;
  timestamp: string;
  notes?: string;
  fromStatus?: RequestStatus;
  toStatus?: RequestStatus;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorRole: UserRole;
  createdAt: string;
}

export interface MaintenanceExecutionDetails {
  assignedOfficer: string;
  startDate?: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  workDescription?: string;
  partsUsed?: string[];
  remarks?: string;
  evidenceAttachments?: RequestAttachment[];
  actionLogs?: MaintenanceActionLog[];
  checklist?: MaintenanceChecklistItem[];
}

export interface MaintenanceActionLog {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface MaintenanceChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
}

export interface FinalDocument {
  id: string;
  title: string;
  type: 'maintenance_report' | 'maintenance_record' | 'technical_inspection' | 'other';
  generatedAt: string;
  url: string;
}

export type FinalDecision = 'completed' | 'needs_follow_up' | 'could_not_complete';

export interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  requester: {
    name: string;
    employeeId: string;
    department: string;
    phone?: string;
    email?: string;
  };
  vehicle: Vehicle;
  issueCategory: IssueCategory;
  issueDescription: string;
  priority: Priority;
  status: RequestStatus;
  currentStage: string;
  currentOwnerRole: UserRole;
  currentOwnerName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  attachments: RequestAttachment[];
  comments: Comment[];
  timeline: TimelineEntry[];
  maintenanceExecution?: MaintenanceExecutionDetails;
  finalDecision?: FinalDecision;
  finalNotes?: string;
  finalDocuments: FinalDocument[];
  notes?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  requestId?: string;
  requestNumber?: string;
  read: boolean;
  createdAt: string;
}

export interface WorkflowTransition {
  from: RequestStatus;
  to: RequestStatus;
  action: string;
  actionLabel: string;
  allowedRoles: UserRole[];
  requiresNotes: boolean;
  requiresReason: boolean;
}
