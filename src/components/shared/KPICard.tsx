import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorClass?: string;
  bgClass?: string;
  trend?: { value: number; label: string };
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  colorClass = 'text-primary',
  bgClass = 'bg-primary/10',
  trend,
  onClick,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className={cn('mt-1.5 text-3xl font-bold tabular-nums', colorClass)}>{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-muted-foreground">{trend.label}</p>
          )}
        </div>
        <div className={cn('flex-shrink-0 rounded-xl p-3', bgClass)}>
          <Icon className={cn('h-6 w-6', colorClass)} />
        </div>
      </div>
      {/* Decorative gradient */}
      <div className={cn('absolute bottom-0 right-0 h-16 w-16 rounded-full opacity-5 blur-2xl', bgClass)} />
    </div>
  );
}
