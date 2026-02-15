import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

export function Alert({ children, variant = 'info', className }: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-lg p-4',
        {
          'bg-blue-50 text-blue-800': variant === 'info',
          'bg-green-50 text-green-800': variant === 'success',
          'bg-yellow-50 text-yellow-800': variant === 'warning',
          'bg-red-50 text-red-800': variant === 'error',
        },
        className,
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="text-sm">{children}</div>
    </div>
  );
}
