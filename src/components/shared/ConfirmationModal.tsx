import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  isLoading?: boolean;
  hideCancel?: boolean;
  dismissible?: boolean;
  children?: React.ReactNode;
}

const variantStyles = {
  danger: {
    icon: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  primary: {
    icon: 'bg-blue-100 text-blue-600',
    button: 'bg-primary hover:bg-primary/90 text-white',
  },
  success: {
    icon: 'bg-emerald-100 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

const variantIcons = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  primary: AlertTriangle,
  success: CheckCircle2,
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
  hideCancel = false,
  dismissible = true,
  children,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', styles.icon)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {dismissible && (
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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
              'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
              styles.button
            )}
          >
            {isLoading ? 'جارٍ المعالجة...' : confirmLabel}
          </button>
          {!hideCancel && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
