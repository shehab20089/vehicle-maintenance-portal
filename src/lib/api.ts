import type { MaintenanceRequest, Notification, RequestStartFormContext, RequestWorkflowContext, User } from '@/types';

export interface DashboardStats {
  total: number;
  pendingMyAction: number;
  returned: number;
  inMaintenance: number;
  completed: number;
  rejected: number;
}

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function normalizeApiBaseUrl(rawBaseUrl?: string): string {
  const fallbackBaseUrl = 'http://localhost:8080/api';
  const baseUrl = (rawBaseUrl ?? fallbackBaseUrl).replace(/\/$/, '');
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const raw = await response.text();
  const data = raw ? (JSON.parse(raw) as unknown) : null;

  if (!response.ok) {
    const payload = typeof data === 'object' && data !== null ? (data as ApiErrorPayload) : null;
    const message = payload?.message ?? payload?.error ?? 'تعذر إتمام الطلب. حاول مرة أخرى.';
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const authApi = {
  login: (employeeId: string, password: string) =>
    apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employeeId, password }),
    }),
};

export const userApi = {
  list: () => apiRequest<User[]>('/users'),
};

export const requestApi = {
  list: () => apiRequest<MaintenanceRequest[]>('/requests'),
  getStartForm: () => apiRequest<RequestStartFormContext>('/requests/start-form'),
  create: (payload: Partial<MaintenanceRequest>) =>
    apiRequest<MaintenanceRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  applyAction: (
    requestId: string,
    payload: {
      action: string;
      performedBy: string;
      performedByRole: string;
      notes?: string;
      additionalData?: Partial<MaintenanceRequest>;
    }
  ) =>
    apiRequest<MaintenanceRequest>(`/requests/${requestId}/actions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addComment: (
    requestId: string,
    payload: {
      text: string;
      author: string;
      authorRole: string;
    }
  ) =>
    apiRequest<MaintenanceRequest>(`/requests/${requestId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getWorkflowContext: (requestId: string, role: string) =>
    apiRequest<RequestWorkflowContext>(`/requests/${requestId}/workflow-context?role=${encodeURIComponent(role)}`),
  submitWorkflowTask: (
    requestId: string,
    payload: {
      performedBy: string;
      performedByRole: string;
      variables: Record<string, unknown>;
    }
  ) =>
    apiRequest<MaintenanceRequest>(`/requests/${requestId}/workflow/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export type LookupsData = Record<string, Array<{ label: string; value: string }>>;

export const lookupsApi = {
  getAll: () => apiRequest<LookupsData>('/lookups'),
};

export const notificationApi = {
  list: () => apiRequest<Notification[]>('/notifications'),
  markAsRead: (notificationId: string) =>
    apiRequest<Notification>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }),
  markAllAsRead: () =>
    apiRequest<{ updated: number }>('/notifications/read-all', {
      method: 'POST',
    }),
};

export const dashboardApi = {
  getStats: () => apiRequest<DashboardStats>('/dashboard/stats'),
};

export { ApiError };