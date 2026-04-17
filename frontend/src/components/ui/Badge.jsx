// src/components/ui/Badge.jsx
import React from 'react';

const variants = {
  default:     { color: 'var(--text-secondary)', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' },
  accent:      { color: 'var(--accent)',          background: 'var(--accent-light)',   border: 'none' },
  success:     { color: 'var(--success)',         background: 'var(--success-light)',  border: 'none' },
  warning:     { color: 'var(--warning)',         background: 'var(--warning-light)',  border: 'none' },
  danger:      { color: 'var(--danger)',          background: 'var(--danger-light)',   border: 'none' },
  mono:        { color: 'var(--text-primary)',    background: 'var(--surface-3)',      border: 'none', fontFamily: 'var(--font-mono)' },
};

const sizes = {
  sm:  { fontSize: '0.7rem',  padding: '2px 8px',   borderRadius: '20px' },
  md:  { fontSize: '0.75rem', padding: '3px 10px',  borderRadius: '20px' },
  lg:  { fontSize: '0.8rem',  padding: '4px 12px',  borderRadius: '20px' },
};

export default function Badge({ children, variant = 'default', size = 'md', style: extraStyle }) {
  const v = variants[variant] || variants.default;
  const s = sizes[size] || sizes.md;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: '500',
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      ...v,
      ...s,
      ...extraStyle,
    }}>
      {children}
    </span>
  );
}
