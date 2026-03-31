import { cn } from '@/lib/utils';
import { type TimelineEntry, UserRole } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { ROLE_LABELS } from '@/utils/arabicLabels';
import {
  CheckCircle2, XCircle, RotateCcw, Send, FileText, Wrench, ArrowRightLeft, Clock, PlayCircle, Flag
} from 'lucide-react';

const actionIcons: Record<string, React.ElementType> = {
  'إنشاء الطلب': FileText,
  'تقديم الطلب': Send,
  'إعادة تقديم الطلب': RotateCcw,
  'موافقة إدارية وإحالة للنقل والصيانة': CheckCircle2,
  'موافقة إدارية': CheckCircle2,
  'الموافقة': CheckCircle2,
  'إعادة للاستكمال': RotateCcw,
  'رفض إداري': XCircle,
  'رفض': XCircle,
  'موافقة النقل والصيانة': CheckCircle2,
  'موافقة النقل والصيانة وإحالة للتوجيه': CheckCircle2,
  'تحويل لمسؤول الصيانة': ArrowRightLeft,
  'بدء التنفيذ': PlayCircle,
  'إنهاء التنفيذ': CheckCircle2,
  'مكتمل': Flag,
};

const actionIconColors: Record<string, string> = {
  'إنشاء الطلب': 'bg-gray-100 text-gray-500 ring-gray-200',
  'تقديم الطلب': 'bg-blue-100 text-blue-600 ring-blue-200',
  'إعادة تقديم الطلب': 'bg-orange-100 text-orange-600 ring-orange-200',
  'موافقة إدارية وإحالة للنقل والصيانة': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  'موافقة إدارية': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  'الموافقة': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  'إعادة للاستكمال': 'bg-orange-100 text-orange-600 ring-orange-200',
  'رفض إداري': 'bg-red-100 text-red-600 ring-red-200',
  'رفض': 'bg-red-100 text-red-600 ring-red-200',
  'موافقة النقل والصيانة وإحالة للتوجيه': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  'تحويل لمسؤول الصيانة': 'bg-blue-100 text-blue-600 ring-blue-200',
  'بدء التنفيذ': 'bg-indigo-100 text-indigo-600 ring-indigo-200',
  'إنهاء التنفيذ': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  'مكتمل': 'bg-green-100 text-green-600 ring-green-200',
};

interface TimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

function getIconColors(action: string): string {
  return actionIconColors[action] ?? 'bg-gray-100 text-gray-500 ring-gray-200';
}

function getIcon(action: string): React.ElementType {
  return actionIcons[action] ?? Clock;
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
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-2',
                  iconColors
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && (
                <div className="mt-1 w-px flex-1 bg-gradient-to-b from-border to-transparent min-h-[24px]" />
              )}
            </div>

            {/* Content */}
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
