import React from 'react';
import { AppError } from '@/hooks/useErrorHandler';

interface ErrorToastProps {
  errors: AppError[];
  onDismiss: (id: string) => void;
  onRetry?: (error: AppError) => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ errors, onDismiss, onRetry }) => {
  if (errors.length === 0) return null;

  const getErrorIcon = (type: AppError['type']) => {
    switch (type) {
      case 'network':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
      case 'permission':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 bg-white ${
            error.type === 'network' ? 'border-l-orange-500' :
            error.type === 'permission' ? 'border-l-yellow-500' :
            'border-l-red-500'
          }`}
        >
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${
              error.type === 'network' ? 'text-orange-500' :
              error.type === 'permission' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {getErrorIcon(error.type)}
            </div>
            
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {error.message}
              </h4>
              {error.details && (
                <p className="mt-1 text-sm text-gray-600">
                  {error.details}
                </p>
              )}
              
              <div className="mt-2 flex space-x-2">
                {error.retry && (
                  <button
                    onClick={() => onRetry?.(error)}
                    className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => onDismiss(error.id)}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            
            <button
              onClick={() => onDismiss(error.id)}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ErrorToast;