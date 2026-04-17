// src/components/ui/StatsCard.jsx
import React from 'react';
import { cardClass } from '../../styles/common';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'var(--accent)', loading }) {
  if (loading) {
    return (
      <div style={{ ...cardClass, minHeight: '120px' }}>
        <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '32px', width: '45%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '12px', width: '40%' }} />
      </div>
    );
  }

  return (
    <div style={{
      ...cardClass,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.18s ease, transform 0.18s ease',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Accent strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '3px', background: color, borderRadius: 'var(--radius) var(--radius) 0 0',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '6px' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          {title}
        </p>
        {Icon && (
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={color} />
          </div>
        )}
      </div>

      <p style={{
        fontSize: '1.9rem', fontWeight: '700', color: 'var(--text-primary)',
        letterSpacing: '-0.03em', lineHeight: '1',
      }}>
        {value ?? '—'}
      </p>

      {subtitle && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '400' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
