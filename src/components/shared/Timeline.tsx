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
  'إنشاء الطلب': 'bg-gray-100 text-gray-500 ring-gray-200',
  'تقديم الطلب': 'bg-blue-100 text-blue-600 ring-blue-200',
  'إعادة تقديم الطلب': 'bg-blue-100 text-blue-600 ring-blue-200',
  'إشعار مدير الشؤون الإدارية': 'bg-purple-100 text-purple-600 ring-purple-200',
  'إحالة لمدير شعبة النقل والصيانة': 'bg-slate-100 text-slate-600 ring-slate-200',
  'موافقة شعبة النقل والصيانة': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  'إرجاع من شعبة النقل والصيانة': 'bg-orange-100 text-orange-600 ring-orange-200',
  'رفض من شعبة النقل والصيانة': 'bg-red-100 text-red-600 ring-red-200',
  'موافقة مدير الإمداد والصيانة': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  'رفض من مدير الإمداد والصيانة': 'bg-red-100 text-red-600 ring-red-200',
  'توجيه إلى مسؤول الصيانة': 'bg-blue-100 text-blue-600 ring-blue-200',
  'رفض من مدير الصيانة': 'bg-red-100 text-red-600 ring-red-200',
  'تنفيذ': 'bg-indigo-100 text-indigo-600 ring-indigo-200',
  'إرجاع من مسؤول الصيانة': 'bg-orange-100 text-orange-600 ring-orange-200',
  'رفض من مسؤول الصيانة': 'bg-red-100 text-red-600 ring-red-200',
  'توجيه إلى مسؤول صيانة آخر مختص': 'bg-violet-100 text-violet-600 ring-violet-200',
  'تنفيذ من مسؤول الصيانة المختص': 'bg-indigo-100 text-indigo-600 ring-indigo-200',
  'رفض من مسؤول الصيانة المختص': 'bg-red-100 text-red-600 ring-red-200',
  'إرجاع من مسؤول الصيانة المختص': 'bg-orange-100 text-orange-600 ring-orange-200',
  'إتمام التنفيذ وتقديم النتيجة': 'bg-teal-100 text-teal-600 ring-teal-200',
  'إحالة للمراجعة النهائية': 'bg-slate-100 text-slate-600 ring-slate-200',
  'اعتماد نهائي': 'bg-amber-100 text-amber-600 ring-amber-200',
  'إرجاع من المراجعة النهائية': 'bg-orange-100 text-orange-600 ring-orange-200',
  'إغلاق الطلب': 'bg-green-100 text-green-600 ring-green-200',
};

interface TimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

function getIcon(action: string): React.ElementType {
  return actionIcons[action] ?? Clock;
}

function getIconColors(action: string): string {
  return actionIconColors[action] ?? 'bg-gray-100 text-gray-500 ring-gray-200';
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
                    <div className="mt-2 rounded-md bg-muted/60 border border-border px-3 py-2">
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
