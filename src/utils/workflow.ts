import { RequestStatus, UserRole, type WorkflowTransition } from '@/types';

// ==========================================
// CONFIG FLAGS (isolate ambiguous decisions)
// ==========================================

/**
 * If true, final-stage "إرجاع" returns to مسؤول الحركة first (standard flow).
 * If false, it goes directly back to the maintenance officer who executed.
 * TODO: Change to false when client confirms direct-return-to-maintenance behavior.
 */
export const FINAL_RETURN_VIA_REQUESTER = true;

// ==========================================
// WORKFLOW TRANSITIONS — New 7-Role Spec
// ==========================================
// Flow:
// DRAFT → SUBMITTED → ADMIN_NOTIFIED[auto] → UNDER_TRANSPORT_REVIEW
//   → [approve] UNDER_SUPPLY_REVIEW
//   → [approve] UNDER_MAINTENANCE_DIRECTOR_REVIEW
//   → [route] ROUTED_TO_MAINTENANCE
//   → [execute] IN_EXECUTION
//   → EXECUTION_COMPLETE → UNDER_FINAL_REVIEW
//   → [اعتماد نهائي] APPROVED_FINAL → CLOSED
// Returns go back to مسؤول الحركة, then back to the same role.
// ==========================================

export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [

  // ── مسؤول الحركة: initial submit ──
  {
    from: RequestStatus.DRAFT,
    to: RequestStatus.SUBMITTED,
    action: 'submit',
    actionLabel: 'تقديم الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },

  // ── مسؤول الحركة: resubmit after ANY return ──
  {
    from: RequestStatus.RETURNED_BY_TRANSPORT,
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
  {
    from: RequestStatus.RETURNED_BY_SPECIALIZED,
    to: RequestStatus.SUBMITTED,
    action: 'resubmit',
    actionLabel: 'إعادة تقديم الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  {
    from: RequestStatus.RETURNED_FROM_FINAL,
    to: RequestStatus.SUBMITTED,
    action: 'resubmit',
    actionLabel: 'إعادة تقديم الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },

  // ── Auto: SUBMITTED → ADMIN_NOTIFIED ──
  // (System dispatches notification to مدير الشؤون الإدارية then auto-routes)
  {
    from: RequestStatus.SUBMITTED,
    to: RequestStatus.ADMIN_NOTIFIED,
    action: 'notify_admin',
    actionLabel: 'إشعار مدير الشؤون الإدارية',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
    isAuto: true,
  },

  // ── Auto: ADMIN_NOTIFIED → UNDER_TRANSPORT_REVIEW ──
  {
    from: RequestStatus.ADMIN_NOTIFIED,
    to: RequestStatus.UNDER_TRANSPORT_REVIEW,
    action: 'route_to_transport',
    actionLabel: 'إحالة لمدير شعبة النقل والصيانة',
    allowedRoles: [UserRole.ADMIN_DIRECTOR],
    requiresNotes: false,
    requiresReason: false,
    isAuto: true,
  },

  // ── Stage 1: مدير شعبة النقل والصيانة (initial review) ──
  {
    from: RequestStatus.UNDER_TRANSPORT_REVIEW,
    to: RequestStatus.UNDER_SUPPLY_REVIEW,
    action: 'transport_approve',
    actionLabel: 'قبول وإحالة لمدير الإمداد والصيانة',
    allowedRoles: [UserRole.TRANSPORT_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: false,
  },
  {
    from: RequestStatus.UNDER_TRANSPORT_REVIEW,
    to: RequestStatus.REJECTED_BY_TRANSPORT,
    action: 'transport_reject',
    actionLabel: 'رفض الطلب',
    allowedRoles: [UserRole.TRANSPORT_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
  },
  {
    from: RequestStatus.UNDER_TRANSPORT_REVIEW,
    to: RequestStatus.RETURNED_BY_TRANSPORT,
    action: 'transport_return',
    actionLabel: 'إرجاع الطلب للاستكمال',
    allowedRoles: [UserRole.TRANSPORT_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
    isReturn: true,
  },

  // ── Stage 2: مدير الإمداد والصيانة ──
  {
    from: RequestStatus.UNDER_SUPPLY_REVIEW,
    to: RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW,
    action: 'supply_approve',
    actionLabel: 'قبول وإحالة لمدير الصيانة',
    allowedRoles: [UserRole.SUPPLY_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: false,
  },
  {
    from: RequestStatus.UNDER_SUPPLY_REVIEW,
    to: RequestStatus.REJECTED_BY_SUPPLY,
    action: 'supply_reject',
    actionLabel: 'رفض الطلب',
    allowedRoles: [UserRole.SUPPLY_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
  },

  // ── Stage 3: مدير الصيانة (routing) ──
  {
    from: RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW,
    to: RequestStatus.ROUTED_TO_MAINTENANCE,
    action: 'route_to_maintenance',
    actionLabel: 'توجيه إلى مسؤول الصيانة',
    allowedRoles: [UserRole.MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: false,
  },
  {
    from: RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW,
    to: RequestStatus.REJECTED_BY_MAINTENANCE_DIRECTOR,
    action: 'maintenance_director_reject',
    actionLabel: 'رفض الطلب',
    allowedRoles: [UserRole.MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
  },

  // ── Stage 4a: مسؤول الصيانة (primary officer) ──
  {
    from: RequestStatus.ROUTED_TO_MAINTENANCE,
    to: RequestStatus.IN_EXECUTION,
    action: 'start_execution',
    actionLabel: 'تنفيذ',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: false,
    requiresReason: false,
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
    from: RequestStatus.ROUTED_TO_MAINTENANCE,
    to: RequestStatus.RETURNED_BY_MAINTENANCE,
    action: 'maintenance_return',
    actionLabel: 'إرجاع الطلب',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: true,
    isReturn: true,
  },
  {
    from: RequestStatus.ROUTED_TO_MAINTENANCE,
    to: RequestStatus.ROUTED_TO_SPECIALIZED,
    action: 'route_to_specialized',
    actionLabel: 'توجيه إلى مسؤول صيانة آخر مختص',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: false,
  },

  // ── Stage 4b: مسؤول صيانة آخر مختص (same MAINTENANCE_OFFICER role, different person) ──
  {
    from: RequestStatus.ROUTED_TO_SPECIALIZED,
    to: RequestStatus.IN_EXECUTION,
    action: 'specialized_execute',
    actionLabel: 'تنفيذ',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
  {
    from: RequestStatus.ROUTED_TO_SPECIALIZED,
    to: RequestStatus.REJECTED_BY_SPECIALIZED,
    action: 'specialized_reject',
    actionLabel: 'رفض الطلب',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: true,
  },
  {
    from: RequestStatus.ROUTED_TO_SPECIALIZED,
    to: RequestStatus.RETURNED_BY_SPECIALIZED,
    action: 'specialized_return',
    actionLabel: 'إرجاع الطلب',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: true,
    isReturn: true,
  },

  // ── Execution complete (any maintenance officer) ──
  {
    from: RequestStatus.IN_EXECUTION,
    to: RequestStatus.EXECUTION_COMPLETE,
    action: 'complete_execution',
    actionLabel: 'إتمام التنفيذ وتقديم النتيجة',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: true,
    requiresReason: false,
  },

  // ── Auto: EXECUTION_COMPLETE → UNDER_FINAL_REVIEW ──
  {
    from: RequestStatus.EXECUTION_COMPLETE,
    to: RequestStatus.UNDER_FINAL_REVIEW,
    action: 'send_to_final_review',
    actionLabel: 'إحالة للمراجعة النهائية',
    allowedRoles: [UserRole.MAINTENANCE_OFFICER],
    requiresNotes: false,
    requiresReason: false,
    isAuto: true,
  },

  // ── Stage 5: Final Review by مدير شعبة النقل والصيانة ──
  {
    from: RequestStatus.UNDER_FINAL_REVIEW,
    to: RequestStatus.APPROVED_FINAL,
    action: 'final_approve',
    actionLabel: 'اعتماد نهائي',
    allowedRoles: [UserRole.TRANSPORT_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: false,
  },
  {
    from: RequestStatus.UNDER_FINAL_REVIEW,
    to: RequestStatus.RETURNED_FROM_FINAL,
    action: 'final_return',
    actionLabel: 'إرجاع للمراجعة',
    allowedRoles: [UserRole.TRANSPORT_MAINTENANCE_DIRECTOR],
    requiresNotes: true,
    requiresReason: true,
    isReturn: true,
  },

  // ── Closure by مسؤول الحركة ──
  {
    from: RequestStatus.APPROVED_FINAL,
    to: RequestStatus.CLOSED,
    action: 'close',
    actionLabel: 'إغلاق الطلب',
    allowedRoles: [UserRole.TRAFFIC_OFFICER],
    requiresNotes: false,
    requiresReason: false,
  },
];

// ==========================================
// Helper Functions
// ==========================================

export function getAllowedTransitions(
  currentStatus: RequestStatus,
  userRole: UserRole
): WorkflowTransition[] {
  return WORKFLOW_TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole) && !t.isAuto
  );
}

export function canPerformAction(
  currentStatus: RequestStatus,
  action: string,
  userRole: UserRole
): boolean {
  return WORKFLOW_TRANSITIONS.some(
    (t) => t.from === currentStatus && t.action === action && t.allowedRoles.includes(userRole) && !t.isAuto
  );
}

export function getNextStatus(currentStatus: RequestStatus, action: string): RequestStatus | null {
  const transition = WORKFLOW_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.action === action
  );
  return transition ? transition.to : null;
}

/**
 * Determine the canonical owner role for a given status.
 * Used to set currentOwnerRole on the request after a transition.
 */
export function getStatusOwner(status: RequestStatus): UserRole {
  switch (status) {
    // Requester owns draft and all returned/rejected terminal states
    case RequestStatus.DRAFT:
    case RequestStatus.RETURNED_BY_TRANSPORT:
    case RequestStatus.RETURNED_BY_MAINTENANCE:
    case RequestStatus.RETURNED_BY_SPECIALIZED:
    case RequestStatus.RETURNED_FROM_FINAL:
    case RequestStatus.REJECTED_BY_TRANSPORT:
    case RequestStatus.REJECTED_BY_SUPPLY:
    case RequestStatus.REJECTED_BY_MAINTENANCE_DIRECTOR:
    case RequestStatus.REJECTED_BY_MAINTENANCE:
    case RequestStatus.REJECTED_BY_SPECIALIZED:
    case RequestStatus.APPROVED_FINAL:
    case RequestStatus.CLOSED:
      return UserRole.TRAFFIC_OFFICER;

    // Submitted & admin notified — admin director is the notified party
    case RequestStatus.SUBMITTED:
    case RequestStatus.ADMIN_NOTIFIED:
      return UserRole.ADMIN_DIRECTOR;

    // Stage 1 & final review
    case RequestStatus.UNDER_TRANSPORT_REVIEW:
    case RequestStatus.UNDER_FINAL_REVIEW:
      return UserRole.TRANSPORT_MAINTENANCE_DIRECTOR;

    // Stage 2
    case RequestStatus.UNDER_SUPPLY_REVIEW:
      return UserRole.SUPPLY_MAINTENANCE_DIRECTOR;

    // Stage 3
    case RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW:
      return UserRole.MAINTENANCE_DIRECTOR;

    // Stage 4 — maintenance officer (both primary & specialized are same role)
    case RequestStatus.ROUTED_TO_MAINTENANCE:
    case RequestStatus.ROUTED_TO_SPECIALIZED:
    case RequestStatus.IN_EXECUTION:
    case RequestStatus.EXECUTION_COMPLETE:
      return UserRole.MAINTENANCE_OFFICER;

    default:
      return UserRole.TRAFFIC_OFFICER;
  }
}

/**
 * Determine which role should receive the request after it is resubmitted
 * following a return. Uses the pendingReturnToRole stored on the request.
 * Returns the status the request should transition to after resubmission.
 */
export function getReturnTargetStatus(pendingReturnToRole: UserRole): RequestStatus {
  switch (pendingReturnToRole) {
    case UserRole.TRANSPORT_MAINTENANCE_DIRECTOR:
      return RequestStatus.UNDER_TRANSPORT_REVIEW;
    case UserRole.MAINTENANCE_OFFICER:
      // Could be from primary or specialized path — route back to maintenance
      return RequestStatus.ROUTED_TO_MAINTENANCE;
    default:
      // Fallback: restart from transport review
      return RequestStatus.UNDER_TRANSPORT_REVIEW;
  }
}

/**
 * Check if a transition is a "return" type (sends request back to requester).
 */
export function isReturnTransition(action: string): boolean {
  const transition = WORKFLOW_TRANSITIONS.find((t) => t.action === action);
  return transition?.isReturn === true;
}
