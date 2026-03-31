import { create } from 'zustand';
import { type MaintenanceRequest, type TimelineEntry, type Comment, RequestStatus, UserRole } from '@/types';
import { MOCK_REQUESTS } from '@/data/mockRequests';
import { getNextStatus, getStatusOwner } from '@/utils/workflow';
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
    performedByRole: UserRole,
    notes?: string,
    additionalData?: Partial<MaintenanceRequest>
  ) => boolean;
  addComment: (requestId: string, text: string, author: string, authorRole: UserRole) => void;
  getStats: () => {
    total: number;
    pendingMyAction: number;
    returned: number;
    inMaintenance: number;
    completed: number;
    rejected: number;
  };
}

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
      vehicle: data.vehicle ?? {
        vehicleNumber: '',
        plateNumber: '',
        vehicleType: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        currentCondition: 'operational' as const,
      },
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
      timeline: [
        {
          id: generateId(),
          action: 'إنشاء الطلب',
          description: 'تم إنشاء طلب الصيانة',
          performedBy: data.requester?.name ?? '',
          performedByRole: UserRole.TRAFFIC_OFFICER,
          timestamp: now,
          toStatus: RequestStatus.DRAFT,
        },
      ],
      finalDocuments: [],
      notes: data.notes,
    };
    set((state) => ({ requests: [...state.requests, request] }));
    return request;
  },

  updateRequest: (id, data) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
      ),
    }));
  },

  performAction: (requestId, action, performedBy, performedByRole, notes, additionalData) => {
    const request = get().getRequestById(requestId);
    if (!request) return false;

    const nextStatus = getNextStatus(request.status, action);
    if (!nextStatus) return false;

    const nextOwnerRole = getStatusOwner(nextStatus);
    const nextOwner = MOCK_USERS.find((u) => u.role === nextOwnerRole);

    const actionLabels: Record<string, string> = {
      submit: 'تقديم الطلب',
      resubmit: 'إعادة تقديم الطلب',
      route_to_admin: 'إحالة للمراجعة الإدارية',
      admin_approve: 'موافقة إدارية وإحالة للنقل والصيانة',
      admin_return: 'إعادة للاستكمال',
      admin_reject: 'رفض إداري',
      transport_approve: 'موافقة النقل والصيانة وإحالة للتوجيه',
      transport_reject: 'رفض من النقل والصيانة',
      route_to_maintenance: 'تحويل لمسؤول الصيانة',
      routing_reject: 'رفض من التوجيه',
      start_execution: 'بدء التنفيذ',
      maintenance_return: 'إعادة لطلب معلومات إضافية',
      maintenance_reject: 'رفض من الصيانة',
      complete_execution: 'إنهاء التنفيذ',
      final_completed: 'مكتمل',
      final_follow_up: 'يحتاج متابعة',
      final_could_not_complete: 'تعذر الإكمال',
      close: 'إغلاق الطلب',
      resume_execution: 'استئناف التنفيذ',
    };

    const timelineEntry: TimelineEntry = {
      id: generateId(),
      action: actionLabels[action] ?? action,
      description: `تم تنفيذ الإجراء بواسطة ${performedBy} (${ROLE_LABELS[performedByRole]})`,
      performedBy,
      performedByRole,
      timestamp: new Date().toISOString(),
      fromStatus: request.status,
      toStatus: nextStatus,
      notes,
    };

    const stageLabels: Record<RequestStatus, string> = {
      draft: 'مسودة',
      submitted: 'تم التقديم',
      under_admin_review: 'مراجعة الشؤون الإدارية',
      returned_by_admin: 'معاد للاستكمال',
      rejected_by_admin: 'مرفوض إداريًا',
      under_transport_maintenance_review: 'مراجعة النقل والصيانة',
      rejected_by_transport_maintenance: 'مرفوض من النقل والصيانة',
      under_routing_review: 'مراجعة التوجيه',
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

    set((state) => ({
      requests: state.requests.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          status: nextStatus,
          currentStage: stageLabels[nextStatus],
          currentOwnerRole: nextOwnerRole,
          currentOwnerName: nextOwner?.name ?? '',
          updatedAt: new Date().toISOString(),
          timeline: [...r.timeline, timelineEntry],
          ...(action === 'submit' || action === 'resubmit' ? { submittedAt: new Date().toISOString() } : {}),
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
        r.status === 'under_admin_review' || r.status === 'under_transport_maintenance_review' ||
        r.status === 'under_routing_review' || r.status === 'routed_to_maintenance'
      ).length,
      returned: requests.filter((r) =>
        r.status === 'returned_by_admin' || r.status === 'returned_by_maintenance'
      ).length,
      inMaintenance: requests.filter((r) =>
        r.status === 'in_execution' || r.status === 'awaiting_final_decision'
      ).length,
      completed: requests.filter((r) =>
        r.status === 'completed' || r.status === 'closed'
      ).length,
      rejected: requests.filter((r) =>
        r.status === 'rejected_by_admin' || r.status === 'rejected_by_transport_maintenance' ||
        r.status === 'rejected_by_routing' || r.status === 'rejected_by_maintenance'
      ).length,
    };
  },
}));
