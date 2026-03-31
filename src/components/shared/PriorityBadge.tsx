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
    badge: 'bg-orange-50 text-orange-700 border border-orange-200',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
  },
  medium: {
    badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    icon: ArrowUp,
    iconColor: 'text-yellow-500',
  },
  low: {
    badge: 'bg-gray-50 text-gray-600 border border-gray-200',
    icon: Minus,
    iconColor: 'text-gray-400',
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
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        badge,
        className
      )}
    >
      {showIcon && <Icon className={cn('h-3 w-3', iconColor)} />}
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
