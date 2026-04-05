// ==========================================
// Enums (as const objects for TS erasableSyntaxOnly)
// ==========================================

import type { CamundaFormSchema } from './camunda';

export const UserRole = {
  // 1. مسؤول الحركة — request creator & resubmitter
  TRAFFIC_OFFICER: 'traffic_officer',
  // 2. مدير الشؤون الإدارية — notification only, no decisions
  ADMIN_DIRECTOR: 'admin_director',
  // 3. مدير شعبة النقل والصيانة — first & final decision maker
  TRANSPORT_MAINTENANCE_DIRECTOR: 'transport_maintenance_director',
  // 4. مدير الإمداد والصيانة — new role, second approval stage
  SUPPLY_MAINTENANCE_DIRECTOR: 'supply_maintenance_director',
  // 5. مدير الصيانة — routing authority (was routing_director)
  MAINTENANCE_DIRECTOR: 'maintenance_director',
  // 6. مسؤول الصيانة — operational executor (primary & specialized are same role, different users)
  MAINTENANCE_OFFICER: 'maintenance_officer',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const RequestStatus = {
  // ── Requester side ──
  DRAFT: 'draft',
  SUBMITTED: 'submitted',

  // ── Notification stage (auto-moves, no decision) ──
  ADMIN_NOTIFIED: 'admin_notified',

  // ── Stage 1: مدير شعبة النقل والصيانة (initial review) ──
  UNDER_TRANSPORT_REVIEW: 'under_transport_review',
  RETURNED_BY_TRANSPORT: 'returned_by_transport',
  REJECTED_BY_TRANSPORT: 'rejected_by_transport',

  // ── Stage 2: مدير الإمداد والصيانة ──
  UNDER_SUPPLY_REVIEW: 'under_supply_review',
  REJECTED_BY_SUPPLY: 'rejected_by_supply',

  // ── Stage 3: مدير الصيانة (routing) ──
  UNDER_MAINTENANCE_DIRECTOR_REVIEW: 'under_maintenance_director_review',
  REJECTED_BY_MAINTENANCE_DIRECTOR: 'rejected_by_maintenance_director',

  // ── Stage 4: مسؤول الصيانة (primary execution) ──
  ROUTED_TO_MAINTENANCE: 'routed_to_maintenance',
  RETURNED_BY_MAINTENANCE: 'returned_by_maintenance',
  REJECTED_BY_MAINTENANCE: 'rejected_by_maintenance',

  // ── Stage 4b: مسؤول صيانة آخر مختص (specialized) ──
  ROUTED_TO_SPECIALIZED: 'routed_to_specialized',
  RETURNED_BY_SPECIALIZED: 'returned_by_specialized',
  REJECTED_BY_SPECIALIZED: 'rejected_by_specialized',

  // ── Execution ──
  IN_EXECUTION: 'in_execution',
  EXECUTION_COMPLETE: 'execution_complete',

  // ── Stage 5: Final review by مدير شعبة النقل والصيانة ──
  UNDER_FINAL_REVIEW: 'under_final_review',
  RETURNED_FROM_FINAL: 'returned_from_final',

  // ── Terminal states ──
  APPROVED_FINAL: 'approved_final',
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
  MAINTENANCE_SCHEDULED: 'maintenance_scheduled',
  SUPPLY_ITEMS_REQUESTED: 'supply_items_requested',
  MAINTENANCE_REPORT_READY: 'maintenance_report_ready',
  FINAL_APPROVED: 'final_approved',
  FINAL_RESULT_AVAILABLE: 'final_result_available',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// ── Flexible maintenance outcome type ──
export const OutcomeType = {
  MAINTENANCE_COMPLETED: 'maintenance_completed',     // تمت الصيانة + تقرير نهائي
  MAINTENANCE_SCHEDULED: 'maintenance_scheduled',     // إشعار بموعد الصيانة
  SUPPLY_ITEMS_REQUESTED: 'supply_items_requested',   // إشعار بطلب الأصناف
} as const;
export type OutcomeType = typeof OutcomeType[keyof typeof OutcomeType];

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
  assignedOfficerRole?: UserRole;
  specializedOfficer?: string;
  startDate?: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  workDescription?: string;
  partsUsed?: string[];
  remarks?: string;
  evidenceAttachments?: RequestAttachment[];
  actionLogs?: MaintenanceActionLog[];
  checklist?: MaintenanceChecklistItem[];
  scheduledDate?: string;
  supplyItemsRequested?: string[];
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
  type: 'maintenance_report' | 'final_report' | 'maintenance_record' | 'technical_inspection' | 'supply_request' | 'schedule_notice' | 'other';
  generatedAt: string;
  url: string;
  linkedOutcomeType?: OutcomeType;
}

// ── Flexible maintenance outcome ──
export interface MaintenanceOutcome {
  outcomeType: OutcomeType;
  outcomeLabel: string;
  reportNotes?: string;
  scheduledDate?: string;
  supplyItemsRequested?: string[];
  documents?: FinalDocument[];
}

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
  // Flexible outcome model (replaces old FinalDecision enum)
  maintenanceOutcome?: MaintenanceOutcome;
  finalNotes?: string;
  finalDocuments: FinalDocument[];
  notes?: string;
  requestedService?: string;
  region?: string;
  mobileNumber?: string;
  vehiclePlate?: string;
  vehicleCategory?: string;
  vehicleName?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  batterySize?: string;
  tireSize?: string;
  tireCount?: string;
  otherServiceDescription?: string;
  requestStatus?: string;
  rejectionReason?: string;
  returnReason?: string;
  finalReturnReason?: string;
  faultDescription?: string;
  requiredItem?: string;
  itemQuantity?: string;
  vehicleEntryDate?: string;
  maintenanceAppointmentDate?: string;
  itemRequestReceivedDate?: string;
  itemsReceivedDate?: string;
  warehouseKeeper?: string;
  warehouseSectionManager?: string;
  orderNumber?: string;
  vehicleReceiptDate?: string;
  vehicleReceiverName?: string;
  washingDone?: boolean;
  batteryChanged?: boolean;
  oilChanged?: boolean;
  tiresChanged?: boolean;
  tiresChangedCount?: string;
  otherActionDone?: boolean;
  otherActionDescription?: string;
  workflow?: RequestWorkflow;
  // ── Return-to-same-role tracking ──
  // When a role returns the request, we record where to send it back after resubmission
  pendingReturnToRole?: UserRole;
  pendingReturnToUserId?: string;
}

export interface RequestWorkflow {
  bpmnProcessId?: string;
  processDefinitionKey?: number;
  processInstanceKey?: number;
  processVersion?: number;
  currentTaskId?: string;
  currentTaskName?: string;
  currentTaskGroup?: string;
  currentTaskRole?: UserRole;
  currentFormId?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowTask {
  id: string;
  name: string;
  role: UserRole;
  candidateGroup?: string;
  formId?: string;
}

export interface WorkflowForm {
  id: string;
  schema: CamundaFormSchema;
  variables?: Record<string, unknown>;
}

export interface RequestStartFormContext {
  form: WorkflowForm;
}

export interface RequestWorkflowContext {
  enabled: boolean;
  workflow?: RequestWorkflow;
  task?: WorkflowTask;
  form?: WorkflowForm;
  timeline?: Array<Record<string, unknown>>;
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

export interface DashboardStats {
  total: number;
  pendingMyAction: number;
  returned: number;
  inMaintenance: number;
  completed: number;
  rejected: number;
}

export interface WorkflowTransition {
  from: RequestStatus;
  to: RequestStatus;
  action: string;
  actionLabel: string;
  allowedRoles: UserRole[];
  requiresNotes: boolean;
  requiresReason: boolean;
  // If true, this transition triggers a return-to-requester then back to same role
  isReturn?: boolean;
  // If true, this auto-transition happens without user action
  isAuto?: boolean;
}
