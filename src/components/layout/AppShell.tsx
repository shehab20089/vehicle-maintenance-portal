import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-[1440px] px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
