import {
  type RequestStatus,
  type Priority,
  type IssueCategory,
  type UserRole,
  type VehicleCondition,
  type NotificationType,
  type FinalDecision,
} from '@/types';

// ==========================================
// Arabic labels for all enums and UI strings
// ==========================================

export const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'مسودة',
  submitted: 'تم التقديم',
  under_admin_review: 'تحت مراجعة الشؤون الإدارية',
  returned_by_admin: 'معاد من الشؤون الإدارية',
  rejected_by_admin: 'مرفوض من الشؤون الإدارية',
  under_transport_maintenance_review: 'تحت مراجعة النقل والصيانة',
  rejected_by_transport_maintenance: 'مرفوض من النقل والصيانة',
  under_routing_review: 'تحت مراجعة التوجيه',
  rejected_by_routing: 'مرفوض من التوجيه',
  routed_to_maintenance: 'محول لمسؤول الصيانة',
  returned_by_maintenance: 'معاد من الصيانة',
  rejected_by_maintenance: 'مرفوض من الصيانة',
  in_execution: 'تحت التنفيذ',
  awaiting_final_decision: 'بانتظار القرار النهائي',
  completed: 'مكتمل',
  needs_follow_up: 'يحتاج متابعة',
  could_not_complete: 'تعذر الإكمال',
  closed: 'مغلق',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: 'عاجل',
  high: 'مرتفع',
  medium: 'متوسط',
  low: 'منخفض',
};

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  engine: 'محرك',
  brakes: 'فرامل',
  electrical: 'كهرباء',
  tires: 'إطارات',
  ac: 'تكييف',
  body: 'هيكل',
  suspension: 'تعليق',
  transmission: 'ناقل حركة',
  oil_change: 'تغيير زيت',
  general: 'عام',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  traffic_officer: 'مسؤول الحركة',
  admin_director: 'مدير الشؤون الإدارية',
  transport_maintenance_director: 'مدير شعبة النقل والصيانة',
  routing_director: 'مدير الإدارة والنقل والورش',
  maintenance_officer: 'مسؤول الصيانة',
};

export const VEHICLE_CONDITION_LABELS: Record<VehicleCondition, string> = {
  operational: 'تعمل',
  partially: 'تعمل جزئياً',
  non_operational: 'لا تعمل',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  request_submitted: 'تم تقديم طلب',
  request_approved: 'تمت الموافقة',
  request_rejected: 'تم الرفض',
  request_returned: 'تمت الإعادة',
  request_routed: 'تم التحويل',
  request_in_execution: 'تحت التنفيذ',
  request_completed: 'مكتمل',
  final_result_available: 'النتيجة النهائية متاحة',
};

export const FINAL_DECISION_LABELS: Record<FinalDecision, string> = {
  completed: 'مكتمل',
  needs_follow_up: 'يحتاج متابعة',
  could_not_complete: 'تعذر الإكمال',
};

// Status color mapping for styling
export type StatusColorType = 'pending' | 'approved' | 'returned' | 'rejected' | 'inprogress' | 'completed';

export const STATUS_COLOR_MAP: Record<RequestStatus, StatusColorType> = {
  draft: 'pending',
  submitted: 'pending',
  under_admin_review: 'pending',
  returned_by_admin: 'returned',
  rejected_by_admin: 'rejected',
  under_transport_maintenance_review: 'pending',
  rejected_by_transport_maintenance: 'rejected',
  under_routing_review: 'pending',
  rejected_by_routing: 'rejected',
  routed_to_maintenance: 'inprogress',
  returned_by_maintenance: 'returned',
  rejected_by_maintenance: 'rejected',
  in_execution: 'inprogress',
  awaiting_final_decision: 'inprogress',
  completed: 'completed',
  needs_follow_up: 'returned',
  could_not_complete: 'rejected',
  closed: 'completed',
};

// Workflow stages for stepper
export const WORKFLOW_STAGES = [
  { key: 'submitted', label: 'تقديم الطلب' },
  { key: 'admin_review', label: 'مراجعة الشؤون الإدارية' },
  { key: 'transport_review', label: 'مراجعة النقل والصيانة' },
  { key: 'routing', label: 'التوجيه' },
  { key: 'maintenance', label: 'التنفيذ' },
  { key: 'final_decision', label: 'القرار النهائي' },
  { key: 'closed', label: 'الإغلاق' },
] as const;

export function getWorkflowStageIndex(status: RequestStatus): number {
  switch (status) {
    case 'draft':
    case 'submitted':
      return 0;
    case 'under_admin_review':
    case 'returned_by_admin':
    case 'rejected_by_admin':
      return 1;
    case 'under_transport_maintenance_review':
    case 'rejected_by_transport_maintenance':
      return 2;
    case 'under_routing_review':
    case 'rejected_by_routing':
      return 3;
    case 'routed_to_maintenance':
    case 'returned_by_maintenance':
    case 'rejected_by_maintenance':
    case 'in_execution':
      return 4;
    case 'awaiting_final_decision':
    case 'completed':
    case 'needs_follow_up':
    case 'could_not_complete':
      return 5;
    case 'closed':
      return 6;
    default:
      return 0;
  }
}
