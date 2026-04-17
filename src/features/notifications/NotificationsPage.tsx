import { useNotificationStore } from '@/store/notificationStore';
import { EmptyState } from '@/components/shared/EmptyState';
import { NOTIFICATION_TYPE_LABELS } from '@/utils/arabicLabels';
import { formatRelativeTime } from '@/utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/types';

const typeColors: Record<NotificationType, string> = {
  request_submitted: 'bg-input-surface text-primary-dark',
  request_approved: 'bg-secondary text-primary-dark',
  request_rejected: 'bg-status-rejected-bg text-status-rejected',
  request_returned: 'bg-status-returned-bg text-status-returned',
  request_routed: 'bg-input-surface text-primary-dark',
  request_in_execution: 'bg-input-surface text-primary-dark',
  maintenance_scheduled: 'bg-input-surface text-primary-dark',
  supply_items_requested: 'bg-status-pending-bg text-status-pending',
  maintenance_report_ready: 'bg-input-surface text-primary-dark',
  final_approved: 'bg-secondary text-primary-dark',
  final_result_available: 'bg-input-surface text-primary-dark',
};

export function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-[920px] space-y-4">
      <div className="space-y-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/dashboard" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <span className="flex items-center gap-1.5">
            <ChevronLeft className="h-3.5 w-3.5 opacity-40" />
            <span className="font-medium text-foreground">الإشعارات</span>
          </span>
        </nav>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">الإشعارات</h1>
            <p className="text-sm text-muted-foreground">آخر تحديثات طلبات الصيانة والحالات التي تحتاج إلى متابعة.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <span className="rounded-full border border-border bg-input-surface px-3 py-1.5 text-xs font-semibold text-primary-dark">
                {unreadCount} غير مقروءة
              </span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold text-primary-dark transition-colors hover:bg-sidebar-active"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                تعيين الكل كمقروء
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState icon={Bell} title="لا توجد إشعارات" description="ستظهر إشعارات طلباتك هنا" />
        ) : (
          <div className="divide-y divide-border/60">
            {sorted.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id);
                  if (notif.requestId) navigate(`/requests/${notif.requestId}`);
                }}
                className={cn(
                  'flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-sidebar-active',
                  'bg-card'
                )}
              >
                <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl', typeColors[notif.type])}>
                  <Bell className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn('text-sm leading-6', !notif.read ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {notif.message}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        {notif.requestNumber && (
                          <span className="rounded-full bg-input-surface px-2.5 py-1 font-mono font-semibold text-primary-dark">
                            {notif.requestNumber}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {NOTIFICATION_TYPE_LABELS[notif.type]}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2 whitespace-nowrap text-xs text-muted-foreground">
                      <time>{formatRelativeTime(notif.createdAt)}</time>
                      {notif.read ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Check className="h-3 w-3" />
                          تمت القراءة
                        </span>
                      ) : (
                        <span className="rounded-full border border-border bg-input-surface px-2.5 py-1 font-semibold text-primary-dark">
                          جديد
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
