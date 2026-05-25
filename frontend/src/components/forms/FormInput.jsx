// src/components/forms/FormInput.jsx
import React from 'react';
import clsx from 'clsx';

export default function FormInput({
  label,
  id,
  error,
  hint,
  required,
  icon: Icon,
  className = '',
  inputClassName = '',
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
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}
        <input
          id={id}
          className={clsx(
            'w-full rounded-lg border bg-white text-sm text-gray-900 placeholder-gray-400',
            'transition focus:outline-none focus:ring-2 focus:ring-[#212d74]/30 focus:border-[#212d74]',
            Icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2',
            error ? 'border-rose-400' : 'border-gray-200 hover:border-gray-300',
            inputClassName,
          )}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
