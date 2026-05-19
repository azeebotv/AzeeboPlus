import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
}) => {
  const spinnerSizes = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-black/50 z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div
        className={`${spinnerSizes[size]} border-4 border-gray-600 border-t-primary rounded-full animate-spin`}
      />
      {message && (
        <p className="mt-4 text-textSecondary text-sm">{message}</p>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const WebEmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && <div className="mb-4 text-textSecondary">{icon}</div>}
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {message && <p className="text-sm text-textSecondary mb-4 max-w-md">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  errorCode?: string;
}

export const WebErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  errorCode,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-error">
        <svg
          className="w-16 h-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-textSecondary mb-4 max-w-md">{message}</p>
      {errorCode && (
        <p className="text-xs text-textTertiary mb-4">Error code: {errorCode}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
};

interface SuccessStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-success">
        {icon || (
          <svg
            className="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {message && <p className="text-sm text-textSecondary mb-4 max-w-md">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

interface StateHandlerProps<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null | undefined;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  successComponent?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
}

export function StateHandler<T>({
  isLoading,
  error,
  data,
  loadingComponent,
  emptyComponent,
  errorComponent,
  successComponent,
  children,
  emptyTitle = 'No data',
  emptyMessage = 'There is nothing to display here.',
  onRetry,
}: StateHandlerProps<T>) {
  if (isLoading) {
    return loadingComponent || <Loading message="Loading..." />;
  }

  if (error) {
    return errorComponent || (
      <WebErrorState
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || (
      <WebEmptyState
        title={emptyTitle}
        message={emptyMessage}
        action={onRetry ? { label: 'Refresh', onClick: onRetry } : undefined}
      />
    );
  }

  if (successComponent) {
    return <>{successComponent}</>;
  }

  return <>{children(data)}</>;
}

export { WebErrorState as ErrorState };
export { WebEmptyState as EmptyState };

export default {
  Loading,
  WebEmptyState,
  WebErrorState,
  SuccessState,
  StateHandler,
};
