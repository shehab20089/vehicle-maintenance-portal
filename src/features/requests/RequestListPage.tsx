import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { RequestStatus, Priority, type MaintenanceRequest, UserRole } from '@/types';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/utils/arabicLabels';
import { formatDate } from '@/utils/formatters';
import { Search, Filter, ChevronRight, Plus, SlidersHorizontal, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'requestNumber';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function RequestListPage() {
  const { requests } = useRequestStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let list = [...requests];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.requestNumber.toLowerCase().includes(q) ||
          r.vehicle.vehicleNumber.toLowerCase().includes(q) ||
          r.vehicle.make.includes(search) ||
          r.vehicle.model.includes(search) ||
          r.requester.name.includes(search) ||
          r.issueDescription.includes(search)
      );
    }

    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    if (priorityFilter) list = list.filter((r) => r.priority === priorityFilter);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        case 'updatedAt': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
        case 'priority': cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'requestNumber': cmp = a.requestNumber.localeCompare(b.requestNumber); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [requests, search, statusFilter, priorityFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIndicator = ({ field }: { field: SortField }) =>
    sortField === field ? (
      <span className="text-primary">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
    ) : null;

  const statuses = Object.values(RequestStatus);
  const priorities = Object.values(Priority);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <PageHeader
        title="الطلبات"
        description="قائمة بجميع طلبات الصيانة"
        breadcrumbs={[{ label: 'الطلبات' }]}
        actions={
          currentUser?.role === UserRole.TRAFFIC_OFFICER && (
            <button
              onClick={() => navigate('/requests/new')}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all"
            >
              <Plus className="h-4 w-4" />
              طلب جديد
            </button>
          )
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="البحث برقم الطلب أو المركبة أو الموظف..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-lg border border-input bg-background py-2 pr-9 pl-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              showFilters ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:bg-muted'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            فلتر
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">الحالة:</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as RequestStatus | ''); setCurrentPage(1); }}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">الكل</option>
                {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">الأولوية:</label>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value as Priority | ''); setCurrentPage(1); }}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">الكل</option>
                {priorities.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            {(statusFilter || priorityFilter || search) && (
              <button
                onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSearch(''); setCurrentPage(1); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        عرض {paginated.length} من أصل {filtered.length} طلب
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="لا توجد نتائج"
            description="لم يتم العثور على طلبات تطابق بحثك"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('requestNumber')} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                      رقم الطلب <SortIndicator field="requestNumber" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">المركبة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">الفئة</th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('priority')} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                      الأولوية <SortIndicator field="priority" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('status')} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                      الحالة <SortIndicator field="status" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">المسؤول الحالي</th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('updatedAt')} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                      آخر تحديث <SortIndicator field="updatedAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-primary">{req.requestNumber}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">{req.vehicle.make} {req.vehicle.model}</p>
                        <p className="text-xs text-muted-foreground">{req.vehicle.plateNumber} · {req.vehicle.vehicleNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{req.issueCategory === 'engine' ? 'محرك' : req.issueCategory === 'brakes' ? 'فرامل' : req.issueCategory === 'electrical' ? 'كهرباء' : req.issueCategory === 'tires' ? 'إطارات' : req.issueCategory === 'ac' ? 'تكييف' : 'عام'}</td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={req.priority} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{req.currentOwnerName}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{formatDate(req.updatedAt)}</td>
                    <td className="px-4 py-3.5">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            السابق
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                p === currentPage ? 'bg-primary text-white' : 'border border-border hover:bg-muted'
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
