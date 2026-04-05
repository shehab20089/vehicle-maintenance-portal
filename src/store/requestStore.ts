import { create } from 'zustand';
import {
  type DashboardStats,
  type MaintenanceRequest,
  RequestStatus,
  UserRole,
} from '@/types';
import { requestApi } from '@/lib/api';

interface RequestStore {
  requests: MaintenanceRequest[];
  stats: DashboardStats;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  loadRequests: (force?: boolean) => Promise<void>;
  getRequestById: (id: string) => MaintenanceRequest | undefined;
  getRequestsByStatus: (status: RequestStatus) => MaintenanceRequest[];
  createRequest: (data: Partial<MaintenanceRequest>) => Promise<MaintenanceRequest>;
  updateRequest: (id: string, data: Partial<MaintenanceRequest>) => void;
  performAction: (
    requestId: string,
    action: string,
    performedBy: string,
    performedByRole: UserRole,
    notes?: string,
    additionalData?: Partial<MaintenanceRequest>
  ) => Promise<boolean>;
  addComment: (requestId: string, text: string, author: string, authorRole: UserRole) => Promise<void>;
  getStats: () => DashboardStats;
}

const EMPTY_STATS: DashboardStats = {
  total: 0,
  pendingMyAction: 0,
  returned: 0,
  inMaintenance: 0,
  completed: 0,
  rejected: 0,
};

function calculateStats(requests: MaintenanceRequest[]): DashboardStats {
  return {
    total: requests.length,
    pendingMyAction: requests.filter((request) =>
      request.status === 'under_transport_review' ||
      request.status === 'under_supply_review' ||
      request.status === 'under_maintenance_director_review' ||
      request.status === 'routed_to_maintenance' ||
      request.status === 'routed_to_specialized' ||
      request.status === 'under_final_review'
    ).length,
    returned: requests.filter((request) =>
      request.status === 'returned_by_transport' ||
      request.status === 'returned_by_maintenance' ||
      request.status === 'returned_by_specialized' ||
      request.status === 'returned_from_final'
    ).length,
    inMaintenance: requests.filter((request) =>
      request.status === 'in_execution' || request.status === 'execution_complete'
    ).length,
    completed: requests.filter((request) =>
      request.status === 'approved_final' || request.status === 'closed'
    ).length,
    rejected: requests.filter((request) =>
      request.status === 'rejected_by_transport' ||
      request.status === 'rejected_by_supply' ||
      request.status === 'rejected_by_maintenance_director' ||
      request.status === 'rejected_by_maintenance' ||
      request.status === 'rejected_by_specialized'
    ).length,
  };
}

export const useRequestStore = create<RequestStore>()((set, get) => ({
  requests: [],
  stats: EMPTY_STATS,
  isLoading: false,
  isMutating: false,
  error: null,

  loadRequests: async (force = false) => {
    if (!force && get().requests.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const requests = await requestApi.list();
      set({ requests, stats: calculateStats(requests), isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'تعذر تحميل الطلبات.',
      });
    }
  },

  getRequestById: (id) => get().requests.find((request) => request.id === id),

  getRequestsByStatus: (status) => get().requests.filter((request) => request.status === status),

  createRequest: async (data) => {
    set({ isMutating: true, error: null });

    try {
      const request = await requestApi.create(data);
      set((state) => {
        const requests = [...state.requests, request];
        return { requests, stats: calculateStats(requests), isMutating: false };
      });

      return request;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر إنشاء الطلب.';
      set({ isMutating: false, error: message });
      throw error;
    }
  },

  updateRequest: (id, data) => {
    set((state) => {
      const requests = state.requests.map((request) =>
        request.id === id ? { ...request, ...data, updatedAt: new Date().toISOString() } : request
      );
      return { requests, stats: calculateStats(requests) };
    });
  },

  performAction: async (requestId, action, performedBy, performedByRole, notes, additionalData) => {
    set({ isMutating: true, error: null });

    try {
      const updatedRequest = await requestApi.applyAction(requestId, {
        action,
        performedBy,
        performedByRole,
        notes,
        additionalData,
      });

      set((state) => {
        const requests = state.requests.map((item) =>
          item.id === requestId ? updatedRequest : item
        );

        return {
          requests,
          stats: calculateStats(requests),
          isMutating: false,
        };
      });

      return true;
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'تعذر تنفيذ الإجراء.',
      });
      return false;
    }
  },

  addComment: async (requestId, text, author, authorRole) => {
    set({ isMutating: true, error: null });

    try {
      const updatedRequest = await requestApi.addComment(requestId, { text, author, authorRole });

      set((state) => {
        const requests = state.requests.map((request) =>
          request.id === requestId ? updatedRequest : request
        );

        return {
          requests,
          stats: calculateStats(requests),
          isMutating: false,
        };
      });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'تعذر إضافة التعليق.',
      });
      throw error;
    }
  },

  getStats: () => get().stats,
}));
