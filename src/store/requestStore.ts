import { create } from 'zustand';
import {
  type MaintenanceRequest, type TimelineEntry, type Comment,
  RequestStatus, UserRole, type UserRole as UserRoleType,
  type MaintenanceOutcome,
} from '@/types';
import { MOCK_REQUESTS } from '@/data/mockRequests';
import { getNextStatus, getStatusOwner, isReturnTransition, getReturnTargetStatus } from '@/utils/workflow';
import { generateId } from '@/utils/formatters';
import { ROLE_LABELS } from '@/utils/arabicLabels';
import { MOCK_USERS } from '@/data/mockUsers';

interface RequestStore {
  requests: MaintenanceRequest[];
  getRequestById: (id: string) => MaintenanceRequest | undefined;
  getRequestsByStatus: (status: RequestStatus) => MaintenanceRequest[];
  createRequest: (data: Partial<MaintenanceRequest>) => MaintenanceRequest;
  updateRequest: (id: string, data: Partial<MaintenanceRequest>) => void;
  performAction: (
    requestId: string,
    action: string,
    performedBy: string,
    performedByRole: UserRoleType,
    notes?: string,
    additionalData?: Partial<MaintenanceRequest>
  ) => boolean;
  addComment: (requestId: string, text: string, author: string, authorRole: UserRoleType) => void;
  getStats: () => {
    total: number;
    pendingMyAction: number;
    returned: number;
    inMaintenance: number;
    completed: number;
    rejected: number;
  };
}

const ACTION_LABELS: Record<string, string> = {
  submit: 'تقديم الطلب',
  resubmit: 'إعادة تقديم الطلب',
  notify_admin: 'إشعار مدير الشؤون الإدارية',
  route_to_transport: 'إحالة لمدير شعبة النقل والصيانة',
  transport_approve: 'موافقة شعبة النقل والصيانة',
  transport_reject: 'رفض من شعبة النقل والصيانة',
  transport_return: 'إرجاع من شعبة النقل والصيانة',
  supply_approve: 'موافقة مدير الإمداد والصيانة',
  supply_reject: 'رفض من مدير الإمداد والصيانة',
  route_to_maintenance: 'توجيه إلى مسؤول الصيانة',
  maintenance_director_reject: 'رفض من مدير الصيانة',
  start_execution: 'تنفيذ',
  maintenance_reject: 'رفض من مسؤول الصيانة',
  maintenance_return: 'إرجاع من مسؤول الصيانة',
  route_to_specialized: 'توجيه إلى مسؤول صيانة آخر مختص',
  specialized_execute: 'تنفيذ من مسؤول الصيانة المختص',
  specialized_reject: 'رفض من مسؤول الصيانة المختص',
  specialized_return: 'إرجاع من مسؤول الصيانة المختص',
  complete_execution: 'إتمام التنفيذ وتقديم النتيجة',
  send_to_final_review: 'إحالة للمراجعة النهائية',
  final_approve: 'اعتماد نهائي',
  final_return: 'إرجاع من المراجعة النهائية',
  close: 'إغلاق الطلب',
};

const STAGE_LABELS: Record<RequestStatus, string> = {
  draft: 'مسودة',
  submitted: 'تم التقديم',
  admin_notified: 'تم إشعار الشؤون الإدارية',
  under_transport_review: 'مراجعة شعبة النقل والصيانة',
  returned_by_transport: 'معاد من شعبة النقل والصيانة',
  rejected_by_transport: 'مرفوض من شعبة النقل والصيانة',
  under_supply_review: 'مراجعة الإمداد والصيانة',
  rejected_by_supply: 'مرفوض من الإمداد والصيانة',
  under_maintenance_director_review: 'مراجعة مدير الصيانة',
  rejected_by_maintenance_director: 'مرفوض من مدير الصيانة',
  routed_to_maintenance: 'محول لمسؤول الصيانة',
  returned_by_maintenance: 'معاد من مسؤول الصيانة',
  rejected_by_maintenance: 'مرفوض من مسؤول الصيانة',
  routed_to_specialized: 'محول لمسؤول صيانة مختص',
  returned_by_specialized: 'معاد من مسؤول الصيانة المختص',
  rejected_by_specialized: 'مرفوض من مسؤول الصيانة المختص',
  in_execution: 'تحت التنفيذ',
  execution_complete: 'اكتمل التنفيذ',
  under_final_review: 'المراجعة النهائية',
  returned_from_final: 'معاد من المراجعة النهائية',
  approved_final: 'تم الاعتماد النهائي',
  closed: 'مغلق',
};

export const useRequestStore = create<RequestStore>()((set, get) => ({
  requests: MOCK_REQUESTS,

  getRequestById: (id) => get().requests.find((r) => r.id === id),
  getRequestsByStatus: (status) => get().requests.filter((r) => r.status === status),

  createRequest: (data) => {
    const now = new Date().toISOString();
    const request: MaintenanceRequest = {
      id: generateId(),
      requestNumber: `MR-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      requester: data.requester ?? { name: '', employeeId: '', department: '' },
      vehicle: data.vehicle ?? { vehicleNumber: '', plateNumber: '', vehicleType: '', make: '', model: '', year: new Date().getFullYear(), color: '', currentCondition: 'operational' as const },
      issueCategory: data.issueCategory ?? 'general' as const,
      issueDescription: data.issueDescription ?? '',
      priority: data.priority ?? 'medium' as const,
      status: RequestStatus.DRAFT,
      currentStage: 'مسودة',
      currentOwnerRole: UserRole.TRAFFIC_OFFICER,
      currentOwnerName: data.requester?.name ?? '',
      createdAt: now,
      updatedAt: now,
      attachments: data.attachments ?? [],
      comments: [],
      timeline: [{
        id: generateId(),
        action: 'إنشاء الطلب',
        description: 'تم إنشاء طلب الصيانة',
        performedBy: data.requester?.name ?? '',
        performedByRole: UserRole.TRAFFIC_OFFICER,
        timestamp: now,
        toStatus: RequestStatus.DRAFT,
      }],
      finalDocuments: [],
      notes: data.notes,
    };
    set((state) => ({ requests: [...state.requests, request] }));
    return request;
  },

  updateRequest: (id, data) => {
    set((state) => ({
      requests: state.requests.map((r) => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r),
    }));
  },

  performAction: (requestId, action, performedBy, performedByRole, notes, additionalData) => {
    const request = get().getRequestById(requestId);
    if (!request) return false;

    const nextStatus = getNextStatus(request.status, action);
    if (!nextStatus) return false;

    const now = new Date().toISOString();
    const isReturn = isReturnTransition(action);

    // --- Return-to-same-role logic ---
    // When a role issues a return, record it as pendingReturnToRole
    // When resubmitting, route back to that role's stage
    let pendingReturnToRole: UserRoleType | undefined = undefined;
    let effectiveNextStatus = nextStatus;

    if (isReturn) {
      // Record the role that returned to send back to them after resubmission
      pendingReturnToRole = performedByRole;
    } else if (action === 'resubmit' && request.pendingReturnToRole) {
      // Route back to the stage of the role that returned it
      effectiveNextStatus = getReturnTargetStatus(request.pendingReturnToRole);
      pendingReturnToRole = undefined; // clear after routing
    }

    const nextOwnerRole = getStatusOwner(effectiveNextStatus);
    const nextOwner = MOCK_USERS.find((u) => u.role === nextOwnerRole);

    const timelineEntry: TimelineEntry = {
      id: generateId(),
      action: ACTION_LABELS[action] ?? action,
      description: `تم تنفيذ الإجراء بواسطة ${performedBy} (${ROLE_LABELS[performedByRole]})`,
      performedBy,
      performedByRole,
      timestamp: now,
      fromStatus: request.status,
      toStatus: effectiveNextStatus,
      notes,
    };

    // Auto-transitions: SUBMITTED → ADMIN_NOTIFIED → UNDER_TRANSPORT_REVIEW
    const autoEntries: TimelineEntry[] = [];
    let finalStatus = effectiveNextStatus;

    if (action === 'submit' || action === 'resubmit') {
      // Auto-notify admin
      autoEntries.push({
        id: generateId(),
        action: ACTION_LABELS['notify_admin'] ?? 'إشعار مدير الشؤون الإدارية',
        description: 'تم إشعار مدير الشؤون الإدارية تلقائياً بتقديم الطلب',
        performedBy: 'النظام',
        performedByRole: UserRole.ADMIN_DIRECTOR,
        timestamp: now,
        fromStatus: RequestStatus.SUBMITTED,
        toStatus: RequestStatus.ADMIN_NOTIFIED,
      });
      // Auto-route to transport
      autoEntries.push({
        id: generateId(),
        action: ACTION_LABELS['route_to_transport'] ?? 'إحالة لمدير شعبة النقل والصيانة',
        description: 'تم إحالة الطلب تلقائياً لمدير شعبة النقل والصيانة',
        performedBy: 'النظام',
        performedByRole: UserRole.ADMIN_DIRECTOR,
        timestamp: now,
        fromStatus: RequestStatus.ADMIN_NOTIFIED,
        toStatus: RequestStatus.UNDER_TRANSPORT_REVIEW,
      });
      finalStatus = request.pendingReturnToRole
        ? getReturnTargetStatus(request.pendingReturnToRole)
        : RequestStatus.UNDER_TRANSPORT_REVIEW;
    }

    // Auto: EXECUTION_COMPLETE → UNDER_FINAL_REVIEW
    if (action === 'complete_execution') {
      autoEntries.push({
        id: generateId(),
        action: ACTION_LABELS['send_to_final_review'] ?? 'إحالة للمراجعة النهائية',
        description: 'تم إحالة الطلب تلقائياً للمراجعة النهائية',
        performedBy: 'النظام',
        performedByRole: UserRole.MAINTENANCE_OFFICER,
        timestamp: now,
        fromStatus: RequestStatus.EXECUTION_COMPLETE,
        toStatus: RequestStatus.UNDER_FINAL_REVIEW,
      });
      finalStatus = RequestStatus.UNDER_FINAL_REVIEW;
    }

    const finalOwnerRole = getStatusOwner(finalStatus);
    const finalOwner = MOCK_USERS.find((u) => u.role === finalOwnerRole);

    set((state) => ({
      requests: state.requests.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          status: finalStatus,
          currentStage: STAGE_LABELS[finalStatus],
          currentOwnerRole: finalOwnerRole,
          currentOwnerName: finalOwner?.name ?? '',
          updatedAt: now,
          timeline: [...r.timeline, timelineEntry, ...autoEntries],
          ...(action === 'submit' || action === 'resubmit' ? { submittedAt: now } : {}),
          // Track pending return target
          pendingReturnToRole: isReturn ? pendingReturnToRole
            : (action === 'resubmit' ? undefined : r.pendingReturnToRole),
          ...additionalData,
        };
      }),
    }));
    return true;
  },

  addComment: (requestId, text, author, authorRole) => {
    const comment: Comment = {
      id: generateId(),
      text,
      author,
      authorRole,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, comments: [...r.comments, comment] } : r
      ),
    }));
  },

  getStats: () => {
    const { requests } = get();
    return {
      total: requests.length,
      pendingMyAction: requests.filter((r) =>
        r.status === 'under_transport_review' ||
        r.status === 'under_supply_review' ||
        r.status === 'under_maintenance_director_review' ||
        r.status === 'routed_to_maintenance' ||
        r.status === 'routed_to_specialized' ||
        r.status === 'under_final_review'
      ).length,
      returned: requests.filter((r) =>
        r.status === 'returned_by_transport' ||
        r.status === 'returned_by_maintenance' ||
        r.status === 'returned_by_specialized' ||
        r.status === 'returned_from_final'
      ).length,
      inMaintenance: requests.filter((r) =>
        r.status === 'in_execution' || r.status === 'execution_complete'
      ).length,
      completed: requests.filter((r) =>
        r.status === 'approved_final' || r.status === 'closed'
      ).length,
      rejected: requests.filter((r) =>
        r.status === 'rejected_by_transport' ||
        r.status === 'rejected_by_supply' ||
        r.status === 'rejected_by_maintenance_director' ||
        r.status === 'rejected_by_maintenance' ||
        r.status === 'rejected_by_specialized'
      ).length,
    };
  },
}));
