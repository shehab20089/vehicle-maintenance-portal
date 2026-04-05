import { useNotificationStore } from '@/store/notificationStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { NOTIFICATION_TYPE_LABELS } from '@/utils/arabicLabels';
import { formatRelativeTime } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/types';

const typeColors: Record<NotificationType, string> = {
  request_submitted: 'bg-blue-100 text-blue-600',
  request_approved: 'bg-emerald-100 text-emerald-600',
  request_rejected: 'bg-red-100 text-red-600',
  request_returned: 'bg-orange-100 text-orange-600',
  request_routed: 'bg-indigo-100 text-indigo-600',
  request_in_execution: 'bg-teal-100 text-teal-600',
  maintenance_scheduled: 'bg-cyan-100 text-cyan-600',
  supply_items_requested: 'bg-amber-100 text-amber-700',
  maintenance_report_ready: 'bg-green-100 text-green-600',
  final_approved: 'bg-emerald-100 text-emerald-700',
  final_result_available: 'bg-purple-100 text-purple-600',
};

export function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, unreadCount, isLoading } = useNotificationStore();
  const navigate = useNavigate();

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="الإشعارات"
        description="جميع إشعارات طلبات الصيانة"
        breadcrumbs={[{ label: 'الإشعارات' }]}
        actions={
          unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              تعيين الكل كمقروء
            </button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading && notifications.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">جاري تحميل الإشعارات...</div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={Bell} title="لا توجد إشعارات" description="ستظهر إشعارات طلباتك هنا" />
        ) : (
          <div className="divide-y divide-border">
            {sorted.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) void markAsRead(notif.id);
                  if (notif.requestId) navigate(`/requests/${notif.requestId}`);
                }}
                className={cn(
                  'flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-muted/30',
                  !notif.read && 'bg-primary/5'
                )}
              >
                {/* Icon */}
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', typeColors[notif.type])}>
                  <Bell className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn('text-sm', !notif.read ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                      {notif.requestNumber && (
                        <span className="mt-1 inline-block text-[10px] font-mono font-bold text-primary/80">{notif.requestNumber}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(notif.createdAt)}
                      </time>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                      {notif.read && (
                        <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {NOTIFICATION_TYPE_LABELS[notif.type]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
