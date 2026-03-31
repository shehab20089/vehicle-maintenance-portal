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
  traffic_officer: 'bg-blue-500',
  admin_director: 'bg-purple-500',
  transport_maintenance_director: 'bg-orange-500',
  routing_director: 'bg-teal-500',
  maintenance_officer: 'bg-green-500',
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
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4 shadow-sm">
      {/* Right: Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <span className="hidden sm:inline">التبديل بين الأدوار</span>
            <span className={cn('h-2 w-2 rounded-full', roleColors[currentUser.role])} />
            <span className="hidden md:inline text-muted-foreground">{ROLE_LABELS[currentUser.role]}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {showRoleSwitcher && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleSwitcher(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground">تبديل دور المستخدم (وضع العرض التجريبي)</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {MOCK_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => { switchRole(user.role); setShowRoleSwitcher(false); }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right transition-colors',
                        currentUser.role === user.role
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
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
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
