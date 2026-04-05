import {
  type RequestStatus,
  type Priority,
  type IssueCategory,
  type UserRole,
  type VehicleCondition,
  type NotificationType,
  type OutcomeType,
} from '@/types';

// ==========================================
// Arabic labels for all enums and UI strings
// ==========================================

export const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'مسودة',
  submitted: 'تم التقديم',
  admin_notified: 'تم إشعار الشؤون الإدارية',
  under_transport_review: 'تحت مراجعة النقل والصيانة',
  returned_by_transport: 'معاد من النقل والصيانة',
  rejected_by_transport: 'مرفوض من النقل والصيانة',
  under_supply_review: 'تحت مراجعة الإمداد والصيانة',
  rejected_by_supply: 'مرفوض من الإمداد والصيانة',
  under_maintenance_director_review: 'تحت مراجعة مدير الصيانة',
  rejected_by_maintenance_director: 'مرفوض من مدير الصيانة',
  routed_to_maintenance: 'محول لمسؤول الصيانة',
  returned_by_maintenance: 'معاد من مسؤول الصيانة',
  rejected_by_maintenance: 'مرفوض من مسؤول الصيانة',
  routed_to_specialized: 'محول لمسؤول صيانة مختص',
  returned_by_specialized: 'معاد من مسؤول الصيانة المختص',
  rejected_by_specialized: 'مرفوض من مسؤول الصيانة المختص',
  in_execution: 'تحت التنفيذ',
  execution_complete: 'اكتمل التنفيذ',
  under_final_review: 'تحت المراجعة النهائية',
  returned_from_final: 'معاد من المراجعة النهائية',
  approved_final: 'تم الاعتماد النهائي',
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
  supply_maintenance_director: 'مدير الإمداد والصيانة',
  maintenance_director: 'مدير الصيانة',
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
  maintenance_scheduled: 'إشعار بموعد الصيانة',
  supply_items_requested: 'إشعار بطلب الأصناف',
  maintenance_report_ready: 'تقرير الصيانة جاهز',
  final_approved: 'تم الاعتماد النهائي',
  final_result_available: 'النتيجة النهائية متاحة',
};

export const OUTCOME_TYPE_LABELS: Record<OutcomeType, string> = {
  maintenance_completed: 'تمت الصيانة + التقرير النهائي',
  maintenance_scheduled: 'إشعار بموعد الصيانة',
  supply_items_requested: 'إشعار بطلب الأصناف',
};

// ==========================================
// Status color mapping for badge styling
// ==========================================
export type StatusColorType = 'pending' | 'approved' | 'returned' | 'rejected' | 'inprogress' | 'completed' | 'notified';

export const STATUS_COLOR_MAP: Record<RequestStatus, StatusColorType> = {
  draft: 'pending',
  submitted: 'pending',
  admin_notified: 'notified',
  under_transport_review: 'pending',
  returned_by_transport: 'returned',
  rejected_by_transport: 'rejected',
  under_supply_review: 'pending',
  rejected_by_supply: 'rejected',
  under_maintenance_director_review: 'pending',
  rejected_by_maintenance_director: 'rejected',
  routed_to_maintenance: 'inprogress',
  returned_by_maintenance: 'returned',
  rejected_by_maintenance: 'rejected',
  routed_to_specialized: 'inprogress',
  returned_by_specialized: 'returned',
  rejected_by_specialized: 'rejected',
  in_execution: 'inprogress',
  execution_complete: 'inprogress',
  under_final_review: 'pending',
  returned_from_final: 'returned',
  approved_final: 'approved',
  closed: 'completed',
};

// ==========================================
// Workflow stages for stepper (9 stages)
// ==========================================
export const WORKFLOW_STAGES = [
  { key: 'submitted', label: 'التقديم' },
  { key: 'admin_notified', label: 'الإشعار' },
  { key: 'transport_review', label: 'مراجعة النقل' },
  { key: 'supply_review', label: 'مراجعة الإمداد' },
  { key: 'maintenance_director', label: 'توجيه الصيانة' },
  { key: 'execution', label: 'التنفيذ' },
  { key: 'final_review', label: 'المراجعة النهائية' }
] as const;

export function getWorkflowStageIndex(status: RequestStatus): number {
  switch (status) {
    case 'draft':
    case 'submitted':
      return 0;
    case 'admin_notified':
      return 1;
    case 'under_transport_review':
    case 'returned_by_transport':
    case 'rejected_by_transport':
      return 2;
    case 'under_supply_review':
    case 'rejected_by_supply':
      return 3;
    case 'under_maintenance_director_review':
    case 'rejected_by_maintenance_director':
    case 'routed_to_maintenance':
    case 'returned_by_maintenance':
    case 'rejected_by_maintenance':
    case 'routed_to_specialized':
    case 'returned_by_specialized':
    case 'rejected_by_specialized':
      return 4;
    case 'in_execution':
    case 'execution_complete':
      return 5;
    case 'under_final_review':
    case 'returned_from_final':
    case 'approved_final':
      return 7;
    case 'closed':
      return 7;
    default:
      return 0;
  }
}

/**
 * Returns true for statuses that represent a terminal rejection.
 */
export function isRejectedStatus(status: RequestStatus): boolean {
  return [
    'rejected_by_transport',
    'rejected_by_supply',
    'rejected_by_maintenance_director',
    'rejected_by_maintenance',
    'rejected_by_specialized',
  ].includes(status);
}

/**
 * Returns true for statuses where the request is waiting on مسؤول الحركة to resubmit.
 */
export function isReturnedStatus(status: RequestStatus): boolean {
  return [
    'returned_by_transport',
    'returned_by_maintenance',
    'returned_by_specialized',
    'returned_from_final',
  ].includes(status);
}
