import { cn } from '@/lib/utils';
import { Check, X, Bell } from 'lucide-react';
import { WORKFLOW_STAGES, getWorkflowStageIndex, isRejectedStatus } from '@/utils/arabicLabels';
import { type RequestStatus } from '@/types';

interface WorkflowStepperProps {
  currentStatus: RequestStatus;
  className?: string;
}

export function WorkflowStepper({ currentStatus, className }: WorkflowStepperProps) {
  const currentIdx = getWorkflowStageIndex(currentStatus);
  const isRejected = isRejectedStatus(currentStatus);

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="flex min-w-max items-center justify-between gap-0">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isCurrentRejected = isCurrent && isRejected;
          // Stage 1 is "notification" — use bell icon
          const isNotif = stage.key === 'admin_notified';

          return (
            <div key={stage.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all',
                    isDone && 'border-primary bg-primary text-white',
                    isCurrent && !isCurrentRejected && 'border-primary bg-primary text-white shadow-[var(--shadow-float)]',
                    isCurrentRejected && 'border-red-500 bg-red-500 text-white',
                    !isDone && !isCurrent && 'border-slate-200 bg-card text-muted-foreground'
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrentRejected ? (
                    <X className="h-4 w-4" />
                  ) : isNotif ? (
                    <Bell className="h-3.5 w-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] whitespace-nowrap font-medium max-w-[72px] text-center leading-tight',
                    isDone && 'text-primary-dark',
                    isCurrent && !isCurrentRejected && 'text-primary',
                    isCurrentRejected && 'text-red-600',
                    !isDone && !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {stage.label}
                </span>
              </div>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <div
                  className={cn(
                    'mx-1.5 h-0.5 w-10 flex-shrink-0',
                    idx < currentIdx ? 'bg-primary/60' : 'bg-slate-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
