import { cn } from '@/lib/utils';
import { type RequestStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLOR_MAP } from '@/utils/arabicLabels';

const colorClasses = {
  pending: 'bg-status-pending-bg text-status-pending border border-status-pending/20',
  approved: 'bg-status-approved-bg text-status-approved border border-status-approved/20',
  returned: 'bg-status-returned-bg text-status-returned border border-status-returned/20',
  rejected: 'bg-status-rejected-bg text-status-rejected border border-status-rejected/20',
  inprogress: 'bg-status-inprogress-bg text-status-inprogress border border-status-inprogress/20',
  completed: 'bg-status-completed-bg text-status-completed border border-status-completed/20',
  notified: 'bg-primary-soft text-primary-dark border border-primary/20',
};

const dotColors = {
  pending: 'bg-status-pending',
  approved: 'bg-status-approved',
  returned: 'bg-status-returned',
  rejected: 'bg-status-rejected',
  inprogress: 'bg-status-inprogress',
  completed: 'bg-status-completed',
  notified: 'bg-primary',
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
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
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
