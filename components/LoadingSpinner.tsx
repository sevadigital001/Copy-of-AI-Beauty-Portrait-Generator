import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <div
      className={`${className} animate-spin rounded-full border-4 border-solid border-white border-t-transparent`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
