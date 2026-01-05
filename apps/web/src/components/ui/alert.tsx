import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'default', children, className }: AlertProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex items-start gap-2 p-4 rounded-lg border',
        variant === 'destructive' && 'border-red-200 bg-red-50 text-red-800',
        variant === 'default' && 'border-gray-200 bg-gray-50 text-gray-800',
        className
      )}
    >
      <AlertCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', variant === 'destructive' && 'text-red-600')} />
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

