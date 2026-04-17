import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const variantStyles = {
  danger: {
    icon: 'bg-status-rejected-bg text-status-rejected',
    button: 'bg-status-rejected text-white hover:brightness-95',
  },
  warning: {
    icon: 'bg-status-returned-bg text-status-returned',
    button: 'bg-status-returned text-white hover:brightness-95',
  },
  primary: {
    icon: 'bg-primary-soft text-primary-icon',
    button: 'bg-primary text-white hover:bg-primary-dark',
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'primary',
  isLoading = false,
  children,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="surface-card relative z-10 w-full max-w-md border p-0 shadow-[var(--shadow-float)]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', styles.icon)}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-active hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {children && (
          <div className="px-6 pt-4">{children}</div>
        )}

        {/* Actions */}
        <div className="flex gap-2 p-6">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:opacity-50',
              styles.button
            )}
          >
            {isLoading ? 'جارٍ المعالجة...' : confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
