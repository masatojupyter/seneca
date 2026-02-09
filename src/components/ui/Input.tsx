'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
  helperText?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
    const normalClasses = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    const errorClasses = 'border-red-500 focus:border-red-500 focus:ring-red-500';
    const disabledClasses = 'disabled:bg-gray-100 disabled:cursor-not-allowed';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseClasses} ${hasError ? errorClasses : normalClasses} ${disabledClasses} ${className}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
