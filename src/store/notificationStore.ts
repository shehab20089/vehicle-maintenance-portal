import { create } from 'zustand';
import { type Notification } from '@/types';
import { notificationApi } from '@/lib/api';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  loadNotifications: (force?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  loadNotifications: async (force = false) => {
    if (!force && get().notifications.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const notifications = await notificationApi.list();
      set({
        notifications,
        unreadCount: notifications.filter((item) => !item.read).length,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'تعذر تحميل الإشعارات.',
      });
    }
  },

  markAsRead: async (id) => {
    try {
      const updatedNotification = await notificationApi.markAsRead(id);
      set((state) => {
        const notifications = state.notifications.map((item) =>
          item.id === id ? updatedNotification : item
        );

        return {
          notifications,
          unreadCount: notifications.filter((item) => !item.read).length,
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'تعذر تحديث الإشعار.' });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((item) => ({ ...item, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'تعذر تحديث الإشعارات.' });
    }
  },

  addNotification: (n) =>
    set((state) => {
      const newNotif: Notification = {
        ...n,
        id: `notif-${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),
}));
