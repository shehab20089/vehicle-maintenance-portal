import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type User, type UserRole } from '@/types';
import { MOCK_USERS, DEMO_CREDENTIALS, getUserByEmployeeId } from '@/data/mockUsers';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (employeeId: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchToUser: (userId: string) => void;
  getAllUsers: () => User[];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,

      login: (employeeId: string, password: string) => {
        const expectedPassword = DEMO_CREDENTIALS[employeeId];
        if (!expectedPassword || expectedPassword !== password) return false;
        const user = getUserByEmployeeId(employeeId);
        if (!user) return false;
        set({ currentUser: user, isAuthenticated: true });
        return true;
      },

      logout: () => set({ currentUser: null, isAuthenticated: false }),

      switchRole: (role: UserRole) => {
        const user = MOCK_USERS.find((u) => u.role === role);
        if (user) set({ currentUser: user });
      },

      switchToUser: (userId: string) => {
        const user = MOCK_USERS.find((u) => u.id === userId);
        if (user) set({ currentUser: user, isAuthenticated: true });
      },

      getAllUsers: () => MOCK_USERS,
    }),
    { name: 'auth-storage' }
  )
);
