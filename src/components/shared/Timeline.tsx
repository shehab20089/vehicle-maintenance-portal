import { cn } from '@/lib/utils';
import { type TimelineEntry, UserRole } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { ROLE_LABELS } from '@/utils/arabicLabels';
import {
  CheckCircle2, XCircle, RotateCcw, Send, FileText, Wrench,
  ArrowRightLeft, Clock, PlayCircle, Flag, Bell, Star, Package,
} from 'lucide-react';

const actionIcons: Record<string, React.ElementType> = {
  'إنشاء الطلب': FileText,
  'تقديم الطلب': Send,
  'إعادة تقديم الطلب': Send,
  'إشعار مدير الشؤون الإدارية': Bell,
  'إحالة لمدير شعبة النقل والصيانة': ArrowRightLeft,
  'موافقة شعبة النقل والصيانة': CheckCircle2,
  'إرجاع من شعبة النقل والصيانة': RotateCcw,
  'رفض من شعبة النقل والصيانة': XCircle,
  'موافقة مدير الإمداد والصيانة': CheckCircle2,
  'رفض من مدير الإمداد والصيانة': XCircle,
  'توجيه إلى مسؤول الصيانة': ArrowRightLeft,
  'رفض من مدير الصيانة': XCircle,
  'تنفيذ': PlayCircle,
  'إرجاع من مسؤول الصيانة': RotateCcw,
  'رفض من مسؤول الصيانة': XCircle,
  'توجيه إلى مسؤول صيانة آخر مختص': ArrowRightLeft,
  'تنفيذ من مسؤول الصيانة المختص': PlayCircle,
  'رفض من مسؤول الصيانة المختص': XCircle,
  'إرجاع من مسؤول الصيانة المختص': RotateCcw,
  'إتمام التنفيذ وتقديم النتيجة': Flag,
  'إحالة للمراجعة النهائية': ArrowRightLeft,
  'اعتماد نهائي': Star,
  'إرجاع من المراجعة النهائية': RotateCcw,
  'إغلاق الطلب': CheckCircle2,
  // Legacy / common
  'قبول وإحالة لمدير الإمداد والصيانة': CheckCircle2,
  'قبول من النقل والصيانة': CheckCircle2,
  'قبول من الإمداد والصيانة': CheckCircle2,
  'إشعار الشؤون الإدارية': Bell,
};

const actionIconColors: Record<string, string> = {
  'إنشاء الطلب': 'bg-muted text-muted-foreground ring-border/40',
  'تقديم الطلب': 'bg-primary-soft text-primary-icon ring-primary/15',
  'إعادة تقديم الطلب': 'bg-primary-soft text-primary-icon ring-primary/15',
  'إشعار مدير الشؤون الإدارية': 'bg-secondary text-primary-dark ring-primary/10',
  'إحالة لمدير شعبة النقل والصيانة': 'bg-secondary text-primary-dark ring-primary/10',
  'موافقة شعبة النقل والصيانة': 'bg-status-approved-bg text-status-approved ring-status-approved/15',
  'إرجاع من شعبة النقل والصيانة': 'bg-status-returned-bg text-status-returned ring-status-returned/15',
  'رفض من شعبة النقل والصيانة': 'bg-status-rejected-bg text-status-rejected ring-status-rejected/15',
  'موافقة مدير الإمداد والصيانة': 'bg-status-approved-bg text-status-approved ring-status-approved/15',
  'رفض من مدير الإمداد والصيانة': 'bg-status-rejected-bg text-status-rejected ring-status-rejected/15',
  'توجيه إلى مسؤول الصيانة': 'bg-secondary text-primary-dark ring-primary/10',
  'رفض من مدير الصيانة': 'bg-status-rejected-bg text-status-rejected ring-status-rejected/15',
  'تنفيذ': 'bg-status-inprogress-bg text-status-inprogress ring-status-inprogress/15',
  'إرجاع من مسؤول الصيانة': 'bg-status-returned-bg text-status-returned ring-status-returned/15',
  'رفض من مسؤول الصيانة': 'bg-status-rejected-bg text-status-rejected ring-status-rejected/15',
  'توجيه إلى مسؤول صيانة آخر مختص': 'bg-secondary text-primary-dark ring-primary/10',
  'تنفيذ من مسؤول الصيانة المختص': 'bg-status-inprogress-bg text-status-inprogress ring-status-inprogress/15',
  'رفض من مسؤول الصيانة المختص': 'bg-status-rejected-bg text-status-rejected ring-status-rejected/15',
  'إرجاع من مسؤول الصيانة المختص': 'bg-status-returned-bg text-status-returned ring-status-returned/15',
  'إتمام التنفيذ وتقديم النتيجة': 'bg-status-completed-bg text-status-completed ring-status-completed/15',
  'إحالة للمراجعة النهائية': 'bg-secondary text-primary-dark ring-primary/10',
  'اعتماد نهائي': 'bg-status-approved-bg text-status-completed ring-status-approved/15',
  'إرجاع من المراجعة النهائية': 'bg-status-returned-bg text-status-returned ring-status-returned/15',
  'إغلاق الطلب': 'bg-status-completed-bg text-status-completed ring-status-completed/15',
};

interface TimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

function getIcon(action: string): React.ElementType {
  return actionIcons[action] ?? Clock;
}

function getIconColors(action: string): string {
  return actionIconColors[action] ?? 'bg-muted text-muted-foreground ring-border/40';
}

export function Timeline({ entries, className }: TimelineProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={cn('space-y-0', className)}>
      {sorted.map((entry, idx) => {
        const Icon = getIcon(entry.action);
        const iconColors = getIconColors(entry.action);
        const isLast = idx === sorted.length - 1;

        return (
          <div key={entry.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div className={cn('relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-2', iconColors)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-gradient-to-b from-border to-transparent min-h-[24px]" />}
            </div>
            <div className={cn('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{entry.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                  {entry.notes && (
                    <div className="mt-2 rounded-2xl border border-border/70 bg-sidebar-active px-3 py-2">
                      <p className="text-xs text-foreground/80">{entry.notes}</p>
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{entry.performedBy}</span>
                    <span>•</span>
                    <span>{ROLE_LABELS[entry.performedByRole]}</span>
                  </div>
                </div>
                <time className="flex-shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(entry.timestamp)}
                </time>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
