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
        'surface-card surface-card-hover flex min-h-[10rem] flex-col items-center justify-center px-4 py-5 text-center',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className={cn('icon-chip mb-4 size-12 rounded-[1rem]', bgClass)}>
        <Icon className={cn('h-5 w-5', colorClass)} />
      </div>
      <p className="font-mono text-[1.55rem] font-bold leading-none tracking-tight text-primary-dark tabular-nums">
        {value}
      </p>
      <p className="mt-3 max-w-[10ch] text-[0.95rem] font-bold leading-[1.7] text-foreground md:text-[1rem]">{title}</p>
      {trend && (
        <p className="mt-2 text-xs text-muted-foreground">{trend.label}</p>
      )}
    </div>
  );
}
