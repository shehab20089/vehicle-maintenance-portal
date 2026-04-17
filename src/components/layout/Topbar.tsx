import { Link } from 'react-router-dom';
import { Bell, Menu, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { ROLE_LABELS } from '@/utils/arabicLabels';
import { UserRole } from '@/types';
import { MOCK_USERS } from '@/data/mockUsers';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const roleColors: Record<UserRole, string> = {
  traffic_officer: 'bg-primary',
  admin_director: 'bg-primary-dark',
  transport_maintenance_director: 'bg-[#4E8A71]',
  supply_maintenance_director: 'bg-[#5C9E83]',
  maintenance_director: 'bg-primary-icon',
  maintenance_officer: 'bg-[#2F7A5B]',
};

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { currentUser, switchRole } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  if (!currentUser) return null;

  const initials = currentUser.name.split(' ').slice(0, 2).map((w) => w[0]).join('');

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-card/95 px-4 shadow-[var(--shadow-soft)]">
      {/* Right: Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground hover:bg-primary-soft hover:text-primary-dark transition-colors"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Left: Actions + User */}
      <div className="flex items-center gap-2">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher((prev) => !prev)}
            className="flex items-center gap-2 rounded-2xl border border-sidebar-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary-soft transition-colors"
          >
            <span className="hidden sm:inline">التبديل بين الأدوار</span>
            <span className={cn('h-2 w-2 rounded-full', roleColors[currentUser.role])} />
            <span className="hidden md:inline text-muted-foreground">{ROLE_LABELS[currentUser.role]}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {showRoleSwitcher && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleSwitcher(false)} />
              <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-[1.5rem] border border-sidebar-border bg-card shadow-[var(--shadow-float)]">
                <div className="border-b border-sidebar-border px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground">تبديل دور المستخدم (وضع العرض التجريبي)</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {MOCK_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => { switchRole(user.role); setShowRoleSwitcher(false); }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition-colors',
                        currentUser.role === user.role
                          ? 'bg-primary-soft text-primary-dark'
                          : 'hover:bg-sidebar-active text-foreground'
                      )}
                    >
                      <div className={cn('h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold', roleColors[user.role])}>
                        {user.name.split(' ').slice(0, 1)[0]?.[0] ?? ''}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{ROLE_LABELS[user.role]}</p>
                      </div>
                      {currentUser.role === user.role && (
                        <span className="text-xs text-primary font-medium">الحالي</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground hover:bg-primary-soft hover:text-primary-dark transition-colors"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold',
              roleColors[currentUser.role]
            )}
          >
            {initials}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-foreground leading-tight">{currentUser.name.split(' ').slice(0, 2).join(' ')}</p>
            <p className="text-xs text-muted-foreground leading-tight">{currentUser.employeeId}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
