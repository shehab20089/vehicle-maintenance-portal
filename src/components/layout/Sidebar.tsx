import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import {
  LayoutDashboard, Plus, ClipboardList, Bell, LogOut, Car, ChevronRight
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/requests/new', label: 'طلب صيانة جديد', icon: Plus, roles: [UserRole.TRAFFIC_OFFICER] },
  { href: '/requests', label: 'الطلبات', icon: ClipboardList },
  { href: '/notifications', label: 'الإشعارات', icon: Bell },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { currentUser, logout } = useAuthStore();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-l border-sidebar-border bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 border-b border-sidebar-border',
        collapsed ? 'justify-center px-3 py-4' : 'px-5 py-4'
      )}>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-soft">
          <Car className="h-5 w-5 text-primary-icon" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">بوابة الصيانة</p>
            <p className="truncate text-xs text-muted-foreground">إدارة طلبات المركبات</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all',
                collapsed && 'justify-center',
                isActive
                  ? 'border-primary/35 bg-primary-soft text-primary-dark'
                  : 'border-transparent text-sidebar-foreground hover:border-primary/20 hover:bg-sidebar-active hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-4.5 w-4.5 flex-shrink-0', isActive ? 'text-primary-dark' : 'text-muted-foreground')} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {currentUser && (
        <div className={cn(
          'border-t border-sidebar-border p-3',
          collapsed ? 'flex flex-col items-center gap-2' : ''
        )}>
          {!collapsed && (
            <div className="mb-2 px-2 py-1.5">
              <p className="truncate text-sm font-semibold text-foreground">{currentUser.name}</p>
              <p className="truncate text-xs text-muted-foreground">{currentUser.employeeId}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors',
              collapsed ? 'w-10 justify-center' : 'w-full'
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
