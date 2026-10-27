interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = 'Loading...' }: LoadingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400"
        role="status"
        aria-label="Loading"
      />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}
