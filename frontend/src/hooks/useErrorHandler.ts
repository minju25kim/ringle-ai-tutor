import { useState, useCallback } from 'react';

export interface AppError {
  id: string;
  type: 'network' | 'api' | 'validation' | 'permission' | 'unknown';
  message: string;
  details?: string;
  timestamp: Date;
  retry?: () => void;
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: Omit<AppError, 'id' | 'timestamp'>) => {
    const newError: AppError = {
      ...error,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    setErrors(prev => [...prev, newError]);
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== newError.id));
    }, 5000);
    
    return newError.id;
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleApiError = useCallback((error: any, context: string, retryFn?: () => void) => {
    console.error(`${context}:`, error);
    
    let errorType: AppError['type'] = 'unknown';
    let message = 'An unexpected error occurred';
    let details = '';

    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorType = 'network';
      message = 'Network connection failed';
      details = 'Please check your internet connection and try again';
    } else if (error.status === 401) {
      errorType = 'api';
      message = 'Authentication failed';
      details = 'Please refresh the page and try again';
    } else if (error.status === 403) {
      errorType = 'permission';
      message = 'Access denied';
      details = 'You don\'t have permission to perform this action';
    } else if (error.status === 404) {
      errorType = 'api';
      message = 'Resource not found';
      details = 'The requested resource could not be found';
    } else if (error.status >= 500) {
      errorType = 'api';
      message = 'Server error';
      details = 'Our servers are experiencing issues. Please try again later';
    } else if (error.message) {
      message = error.message;
      errorType = 'api';
    }

    return addError({
      type: errorType,
      message,
      details,
      retry: retryFn,
    });
  }, [addError]);

  const handleNetworkError = useCallback((retryFn?: () => void) => {
    return addError({
      type: 'network',
      message: 'Connection lost',
      details: 'Please check your internet connection',
      retry: retryFn,
    });
  }, [addError]);

  return {
    errors,
    addError,
    removeError,
    clearAllErrors,
    handleApiError,
    handleNetworkError,
  };
};