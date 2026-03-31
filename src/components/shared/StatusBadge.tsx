import { cn } from '@/lib/utils';
import { type RequestStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLOR_MAP } from '@/utils/arabicLabels';

const colorClasses = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  returned: 'bg-orange-50 text-orange-700 border border-orange-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  inprogress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
};

const dotColors = {
  pending: 'bg-amber-400',
  approved: 'bg-emerald-400',
  returned: 'bg-orange-400',
  rejected: 'bg-red-400',
  inprogress: 'bg-blue-400',
  completed: 'bg-green-500',
};

interface StatusBadgeProps {
  status: RequestStatus;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showDot = true, className, size = 'md' }: StatusBadgeProps) {
  const colorType = STATUS_COLOR_MAP[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        colorClasses[colorType],
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[colorType])} />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
