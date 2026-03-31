import { RequestStatus, UserRole, type WorkflowTransition } from '@/types';

export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // مسؤول الحركة submits
  {
    from: RequestStatus.DRAFT,
    to: RequestStatus.SUBMITTED,
    action: 'submit',
    actionLabel: 'تقديم الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  // مسؤول الحركة resubmits after return
  {
    from: RequestStatus.RETURNED_BY_ADMIN,
    to: RequestStatus.SUBMITTED,
    action: 'resubmit',
    actionLabel: 'إعادة تقديم الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  {
    from: RequestStatus.RETURNED_BY_MAINTENANCE,
    to: RequestStatus.SUBMITTED,
    action: 'resubmit',
    actionLabel: 'إعادة تقديم الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  // System auto-routes submitted → admin review
  {
    from: RequestStatus.SUBMITTED,
    to: RequestStatus.UNDER_ADMIN_REVIEW,
    action: 'route_to_admin',
    actionLabel: 'إحالة للمراجعة الإدارية',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  // مدير الشؤون الإدارية actions
  {
    from: RequestStatus.UNDER_ADMIN_REVIEW,
    to: RequestStatus.UNDER_TRANSPORT_MAINTENANCE_REVIEW,
    action: 'admin_approve',
    actionLabel: 'موافقة وإحالة للنقل والصيانة',
    allowedRoles: [UserRole.ADMIN_DIRECTOR],
    requiresNotes: true,
    requiresReason: false,
  },
  {
    from: RequestStatus.UNDER_ADMIN_REVIEW,
    to: RequestStatus.RETURNED_BY_ADMIN,
    action: 'admin_return',
    actionLabel: 'إعادة للاستكمال',
    allowedRoles: [UserRole.ADMIN_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
  },
  {
    from: RequestStatus.UNDER_ADMIN_REVIEW,
    to: RequestStatus.REJECTED_BY_ADMIN,
    action: 'admin_reject',
    actionLabel: 'رفض الطلب',
    allowedRoles: [UserRole.ADMIN_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
  },
  // مدير شعبة النقل والصيانة actions
  {
    from: RequestStatus.UNDER_TRANSPORT_MAINTENANCE_REVIEW,
    to: RequestStatus.UNDER_ROUTING_REVIEW,
    action: 'transport_approve',
    actionLabel: 'موافقة وإحالة للتوجيه',
    allowedRoles: [UserRole.TRANSPORT_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: false,
  },
  {
    from: RequestStatus.UNDER_TRANSPORT_MAINTENANCE_REVIEW,
    to: RequestStatus.REJECTED_BY_TRANSPORT_MAINTENANCE,
    action: 'transport_reject',
    actionLabel: 'رفض الطلب',
    allowedRoles: [UserRole.TRANSPORT_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
  },
  // مدير الإدارة والنقل والورش actions
  {
    from: RequestStatus.UNDER_ROUTING_REVIEW,
    to: RequestStatus.ROUTED_TO_MAINTENANCE,
    action: 'route_to_maintenance',
    actionLabel: 'تحويل لمسؤول الصيانة',
    allowedRoles: [UserRole.ROUTING_DIRECTOR],
    requiresNotes: true,
    requiresReason: false,
  },
  {
    from: RequestStatus.UNDER_ROUTING_REVIEW,
    to: RequestStatus.REJECTED_BY_ROUTING,
    action: 'routing_reject',
    actionLabel: 'رفض الطلب',
    allowedRoles: [UserRole.ROUTING_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
  },
  // مسؤول الصيانة actions
  {
    from: RequestStatus.ROUTED_TO_MAINTENANCE,
    to: RequestStatus.IN_EXECUTION,
    action: 'start_execution',
    actionLabel: 'بدء التنفيذ',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  {
    from: RequestStatus.ROUTED_TO_MAINTENANCE,
    to: RequestStatus.RETURNED_BY_MAINTENANCE,
    action: 'maintenance_return',
    actionLabel: 'إعادة لطلب معلومات',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: true,
  },
  {
    from: RequestStatus.ROUTED_TO_MAINTENANCE,
    to: RequestStatus.REJECTED_BY_MAINTENANCE,
    action: 'maintenance_reject',
    actionLabel: 'رفض الطلب',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: true,
  },
  {
    from: RequestStatus.IN_EXECUTION,
    to: RequestStatus.AWAITING_FINAL_DECISION,
    action: 'complete_execution',
    actionLabel: 'إنهاء التنفيذ',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: false,
  },
  // Final decisions
  {
    from: RequestStatus.AWAITING_FINAL_DECISION,
    to: RequestStatus.COMPLETED,
    action: 'final_completed',
    actionLabel: 'مكتمل',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: false,
  },
  {
    from: RequestStatus.AWAITING_FINAL_DECISION,
    to: RequestStatus.NEEDS_FOLLOW_UP,
    action: 'final_follow_up',
    actionLabel: 'يحتاج متابعة',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: true,
  },
  {
    from: RequestStatus.AWAITING_FINAL_DECISION,
    to: RequestStatus.COULD_NOT_COMPLETE,
    action: 'final_could_not_complete',
    actionLabel: 'تعذر الإكمال',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: true,
  },
  // Closure
  {
    from: RequestStatus.COMPLETED,
    to: RequestStatus.CLOSED,
    action: 'close',
    actionLabel: 'إغلاق الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  {
    from: RequestStatus.COULD_NOT_COMPLETE,
    to: RequestStatus.CLOSED,
    action: 'close',
    actionLabel: 'إغلاق الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  {
    from: RequestStatus.NEEDS_FOLLOW_UP,
    to: RequestStatus.IN_EXECUTION,
    action: 'resume_execution',
    actionLabel: 'استئناف التنفيذ',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
];

export function getAllowedTransitions(
  currentStatus: RequestStatus,
  userRole: UserRole
): WorkflowTransition[] {
  return WORKFLOW_TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
}

export function canPerformAction(
  currentStatus: RequestStatus,
  action: string,
  userRole: UserRole
): boolean {
  return WORKFLOW_TRANSITIONS.some(
    (t) => t.from === currentStatus && t.action === action && t.allowedRoles.includes(userRole)
  );
}

export function getNextStatus(currentStatus: RequestStatus, action: string): RequestStatus | null {
  const transition = WORKFLOW_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.action === action
  );
  return transition ? transition.to : null;
}

export function getStatusOwner(status: RequestStatus): UserRole {
  switch (status) {
    case RequestStatus.DRAFT:
    case RequestStatus.RETURNED_BY_ADMIN:
    case RequestStatus.RETURNED_BY_MAINTENANCE:
    case RequestStatus.REJECTED_BY_ADMIN:
    case RequestStatus.REJECTED_BY_TRANSPORT_MAINTENANCE:
    case RequestStatus.REJECTED_BY_ROUTING:
    case RequestStatus.REJECTED_BY_MAINTENANCE:
    case RequestStatus.COMPLETED:
    case RequestStatus.COULD_NOT_COMPLETE:
    case RequestStatus.CLOSED:
      return UserRole.TRAFFIC_OFFICER;
    case RequestStatus.SUBMITTED:
    case RequestStatus.UNDER_ADMIN_REVIEW:
      return UserRole.ADMIN_DIRECTOR;
    case RequestStatus.UNDER_TRANSPORT_MAINTENANCE_REVIEW:
      return UserRole.TRANSPORT_MAINTENANCE_DIRECTOR;
    case RequestStatus.UNDER_ROUTING_REVIEW:
      return UserRole.ROUTING_DIRECTOR;
    case RequestStatus.ROUTED_TO_MAINTENANCE:
    case RequestStatus.IN_EXECUTION:
    case RequestStatus.AWAITING_FINAL_DECISION:
    case RequestStatus.NEEDS_FOLLOW_UP:
      return UserRole.MAINTENANCE_OFFICER;
    default:
      return UserRole.TRAFFIC_OFFICER;
  }
}
