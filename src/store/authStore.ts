import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type User, type UserRole } from '@/types';
import { authApi, userApi } from '@/lib/api';

interface AuthState {
  users: User[];
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loadUsers: (force?: boolean) => Promise<User[]>;
  login: (employeeId: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole, userId?: string) => Promise<void>;
  getAllUsers: () => User[];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loadUsers: async (force = false) => {
        if (!force && get().users.length > 0) {
          return get().users;
        }

        set({ isLoading: true, error: null });

        try {
          const users = await userApi.list();
          const currentUserId = get().currentUser?.id;
          const syncedCurrentUser = currentUserId
            ? users.find((user) => user.id === currentUserId) ?? get().currentUser
            : null;

          set({
            users,
            currentUser: syncedCurrentUser,
            isAuthenticated: Boolean(syncedCurrentUser ?? get().isAuthenticated),
            isLoading: false,
          });

          return users;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'تعذر تحميل المستخدمين.';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      login: async (employeeId: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { token, user } = await authApi.login(employeeId, password);
          const users = get().users.length > 0 ? get().users : await get().loadUsers();
          const resolvedUser = users.find((item) => item.id === user.id) ?? user;

          set({
            users,
            currentUser: resolvedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'رقم الموظف أو كلمة المرور غير صحيحة.';
          set({
            isLoading: false,
            error: message,
          });
          return false;
        }
      },

      logout: () => set({ currentUser: null, token: null, isAuthenticated: false, error: null }),

      switchRole: async (role: UserRole, userId?: string) => {
        const users = get().users.length > 0 ? get().users : await get().loadUsers();
        const user = userId
          ? users.find((item) => item.id === userId && item.role === role)
          : users.find((item) => item.role === role);

        if (user) {
          set({ currentUser: user, isAuthenticated: true });
        }
      },

      getAllUsers: () => get().users,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
