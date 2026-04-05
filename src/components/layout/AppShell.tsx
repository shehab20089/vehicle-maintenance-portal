import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '@/store/authStore';
import { useRequestStore } from '@/store/requestStore';
import { useNotificationStore } from '@/store/notificationStore';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { loadUsers } = useAuthStore();
  const { loadRequests } = useRequestStore();
  const { loadNotifications } = useNotificationStore();

  useEffect(() => {
    void loadUsers();
    void loadRequests();
    void loadNotifications();
  }, [loadNotifications, loadRequests, loadUsers]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
