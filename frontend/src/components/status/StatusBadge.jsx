// src/components/status/StatusBadge.jsx
import React from 'react';
import clsx from 'clsx';

const STYLES = {
  // Campaign statuses
  DRAFT:      'bg-gray-100 text-gray-600 ring-gray-200',
  ACTIVE:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PAUSED:     'bg-amber-50 text-amber-700 ring-amber-200',
  COMPLETED:  'bg-blue-50 text-blue-700 ring-blue-200',
  // Result statuses
  PENDING:    'bg-gray-100 text-gray-500 ring-gray-200',
  PARSING:    'bg-sky-50 text-sky-600 ring-sky-200',
  LAYER1:     'bg-indigo-50 text-indigo-600 ring-indigo-200',
  LAYER2:     'bg-violet-50 text-violet-600 ring-violet-200',
  AI_SCORING: 'bg-orange-50 text-orange-600 ring-orange-200',
  FAILED:     'bg-rose-50 text-rose-600 ring-rose-200',
  // Recommendations
  STRONGLY_RECOMMENDED: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  RECOMMENDED:          'bg-green-50 text-green-700 ring-green-200',
  MAYBE:                'bg-amber-50 text-amber-700 ring-amber-200',
  REJECT:               'bg-rose-50 text-rose-700 ring-rose-200',
  // HR actions
  SHORTLISTED: 'bg-teal-50 text-teal-700 ring-teal-200',
  REJECTED:    'bg-red-50 text-red-700 ring-red-200',
};

const LABELS = {
  STRONGLY_RECOMMENDED: 'Strong Fit',
  RECOMMENDED:          'Recommended',
  MAYBE:                'Maybe',
  REJECT:               'Not a Fit',
  AI_SCORING:           'AI Scoring',
  LAYER1:               'Layer 1',
  LAYER2:               'Layer 2',
};

const SIZES = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

export default function StatusBadge({ status, size = 'sm', className = '' }) {
  if (!status) return null;
  const key = String(status).toUpperCase();
  const style = STYLES[key] ?? 'bg-gray-100 text-gray-600 ring-gray-200';
  const label = LABELS[key] ?? key.replace(/_/g, ' ');
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        SIZES[size],
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
