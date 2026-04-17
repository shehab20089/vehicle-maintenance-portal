import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  ClipboardList, Plus, Clock, RotateCcw, Wrench, CheckCircle, XCircle, Eye
} from 'lucide-react';
import { formatRelativeTime, formatDate } from '@/utils/formatters';
import { UserRole } from '@/types';
import { useState } from 'react';

export function DashboardPage() {
  const { requests, getStats } = useRequestStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const stats = getStats();
  const [searchQuery, setSearchQuery] = useState('');

  // Recent requests (last 8)
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)
    .filter((r) =>
      searchQuery === '' ||
      r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vehicle.make.includes(searchQuery) ||
      r.requester.name.includes(searchQuery)
    );

  const kpiCards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.total,
      icon: ClipboardList,
      colorClass: 'text-primary-icon',
      bgClass: 'bg-primary-soft',
    },
    {
      title: 'بانتظار إجراء مني',
      value: stats.pendingMyAction,
      icon: Clock,
      colorClass: 'text-primary-dark',
      bgClass: 'bg-secondary',
    },
    {
      title: 'الطلبات المعادة',
      value: stats.returned,
      icon: RotateCcw,
      colorClass: 'text-status-returned',
      bgClass: 'bg-status-returned-bg',
    },
    {
      title: 'تحت الصيانة',
      value: stats.inMaintenance,
      icon: Wrench,
      colorClass: 'text-primary-icon',
      bgClass: 'bg-primary-soft',
    },
    {
      title: 'المكتملة',
      value: stats.completed,
      icon: CheckCircle,
      colorClass: 'text-status-completed',
      bgClass: 'bg-status-completed-bg',
    },
    {
      title: 'المرفوضة',
      value: stats.rejected,
      icon: XCircle,
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50',
    },
  ];

  // Recent activity from all timelines
  const recentActivity = requests
    .flatMap((r) => r.timeline.map((t) => ({ ...t, requestNumber: r.requestNumber, requestId: r.id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 7);

  return (
    <div className="max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1 text-right">
          {currentUser?.name && (
            <p className="text-sm font-medium text-primary-dark">
              مرحباً، {currentUser.name}
            </p>
          )}
          <h1 className="text-2xl font-bold text-foreground md:text-[1.9rem]">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">
            ملخص الطلبات الحالية وآخر النشاطات في نظام المركبات.
          </p>
        </div>
        {currentUser?.role === UserRole.TRAFFIC_OFFICER && (
          <button
            onClick={() => navigate('/requests/new')}
            className="flex items-center gap-2 self-start rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-all hover:bg-primary-dark md:self-auto"
          >
            <Plus className="h-4 w-4" />
            طلب صيانة جديد
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card) => (
          <KPICard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            colorClass={card.colorClass}
            bgClass={card.bgClass}
            onClick={() => navigate('/requests')}
          />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 surface-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">أحدث الطلبات</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 rounded-2xl border border-input bg-input-surface px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <button
                onClick={() => navigate('/requests')}
                className="text-xs text-primary hover:underline font-medium"
              >
                عرض الكل
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {recentRequests.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="لا توجد طلبات"
                description="لم يتم تقديم أي طلبات صيانة بعد"
                className="py-10"
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-input-surface">
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">رقم الطلب</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">المركبة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">الأولوية</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-border/50 last:border-0 hover:bg-sidebar-active transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-primary">{req.requestNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{req.vehicle.make} {req.vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{req.vehicle.vehicleNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={req.priority} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/requests/${req.id}`)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">آخر النشاطات</h2>
          </div>
          <div className="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <EmptyState icon={Clock} title="لا توجد نشاطات" className="py-8" />
            ) : (
              recentActivity.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => navigate(`/requests/${activity.requestId}`)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-right hover:bg-sidebar-active transition-colors"
                >
                  <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary/60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.requestNumber}</p>
                    <p className="text-xs text-muted-foreground/70">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
