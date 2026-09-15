'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Next.js Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 dark:bg-red-950/20">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-200 dark:border-red-900/50">
        <div className="flex items-center gap-4 text-red-600 dark:text-red-400 mb-6">
          <span className="material-symbols-outlined text-4xl">error</span>
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
        </div>
        
        <div className="bg-gray-100 dark:bg-black/50 p-4 rounded-xl mb-6 overflow-auto">
          <p className="font-mono text-sm text-red-600 dark:text-red-400 font-bold mb-2">
            {error.name}: {error.message}
          </p>
          <pre className="font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {error.stack}
          </pre>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
