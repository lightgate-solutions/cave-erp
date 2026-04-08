"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 font-sans antialiased">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                role="img"
                aria-label="Error icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-50">
            Something went wrong
          </h1>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </p>
          {error.digest && (
            <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
              Error ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
