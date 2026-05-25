// src/components/forms/FormTextArea.jsx
import React from 'react';
import clsx from 'clsx';

export default function FormTextArea({
  label,
  id,
  error,
  hint,
  required,
  rows = 3,
  className = '',
  textareaClassName = '',
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={clsx(
          'w-full rounded-lg border bg-white text-sm text-gray-900 placeholder-gray-400 px-3 py-2',
          'transition focus:outline-none focus:ring-2 focus:ring-[#212d74]/30 focus:border-[#212d74]',
          'resize-y',
          error ? 'border-rose-400' : 'border-gray-200 hover:border-gray-300',
          textareaClassName,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
