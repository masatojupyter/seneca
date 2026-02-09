import { HTMLAttributes, forwardRef, ReactNode } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
};

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', title, children, onClose, className = '', ...props }, ref) => {
    const config = variantConfig[variant];

    return (
      <div
        ref={ref}
        className={`${config.bg} ${config.border} ${config.text} border rounded-lg p-4 ${className}`}
        role="alert"
        {...props}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
            <div className="text-sm">{children}</div>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${config.text} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                <span className="sr-only">閉じる</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
