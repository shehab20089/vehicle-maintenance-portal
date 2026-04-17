import { cn } from '@/lib/utils';
import { type Priority } from '@/types';
import { PRIORITY_LABELS } from '@/utils/arabicLabels';
import { AlertCircle, AlertTriangle, ArrowUp, Minus } from 'lucide-react';

const priorityStyles = {
  urgent: {
    badge: 'bg-red-50 text-red-700 border border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  high: {
    badge: 'bg-status-returned-bg text-status-returned border border-status-returned/20',
    icon: AlertTriangle,
    iconColor: 'text-status-returned',
  },
  medium: {
    badge: 'bg-status-pending-bg text-status-pending border border-status-pending/20',
    icon: ArrowUp,
    iconColor: 'text-status-pending',
  },
  low: {
    badge: 'bg-primary-soft text-primary-dark border border-primary/20',
    icon: Minus,
    iconColor: 'text-primary-dark',
  },
};

interface PriorityBadgeProps {
  priority: Priority;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, showIcon = true, className, size = 'md' }: PriorityBadgeProps) {
  const { badge, icon: Icon, iconColor } = priorityStyles[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs',
        badge,
        className
      )}
    >
      {showIcon && <Icon className={cn('h-3 w-3', iconColor)} />}
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
