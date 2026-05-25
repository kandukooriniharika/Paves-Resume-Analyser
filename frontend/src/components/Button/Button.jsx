// src/components/Button/Button.jsx
import React from 'react';
import clsx from 'clsx';

const SIZES = {
  large:  'text-sm px-5 py-2.5',
  medium: 'text-sm px-4 py-2',
  small:  'text-xs px-3 py-1.5',
  icon:   'p-2',
};

const VARIANTS = {
  primary:     'bg-[#212d74] text-white hover:bg-[#1a2460] focus-visible:ring-[#212d74]/40',
  blue:        'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400',
  secondary:   'bg-[#d23369] text-white hover:bg-[#b82d5a] focus-visible:ring-[#d23369]/40',
  success:     'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400',
  danger:      'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-400',
  softDanger:  'bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300',
  outline:     'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-300',
  outlineBlue: 'border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-300',
  ghost:       'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-300',
  link:        'text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-300 !shadow-none',
};

function Spinner({ size }) {
  const sz = { large: 'h-4 w-4', medium: 'h-3.5 w-3.5', small: 'h-3 w-3', icon: 'h-4 w-4' }[size] ?? 'h-3.5 w-3.5';
  return (
    <svg className={clsx('animate-spin', sz)} fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function Button({
  children,
  size = 'medium',
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  loadingText,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 shadow-sm whitespace-nowrap',
        SIZES[size],
        VARIANTS[variant],
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <Spinner size={size} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
