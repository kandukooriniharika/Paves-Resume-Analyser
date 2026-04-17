// src/components/branch/BranchCard.jsx
import React from 'react';
import { MapPin, Users, Briefcase, ArrowRight } from 'lucide-react';
import Badge from '../ui/Badge';
import { cardClass } from '../../styles/common';

export default function BranchCard({ branch, onClick, stats }) {
  const { name, code, location, country, is_active, timezone } = branch;

  return (
    <div
      onClick={() => onClick?.(branch)}
      style={{
        ...cardClass,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: '600',
              color: 'var(--text-tertiary)', letterSpacing: '0.04em',
            }}>
              {code}
            </span>
            <Badge variant={is_active ? 'success' : 'default'} size="sm">
              {is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {name}
          </h3>
        </div>
        <ArrowRight size={16} color="var(--text-tertiary)" />
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '16px' }}>
        <MapPin size={12} color="var(--text-tertiary)" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {location}, {country}
        </span>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', paddingTop: '14px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: '500', marginBottom: '2px' }}>
            RESUMES
          </p>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {stats?.total_resumes ?? '—'}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: '500', marginBottom: '2px' }}>
            OPEN ROLES
          </p>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {stats?.open_roles ?? '—'}
          </p>
        </div>
      </div>

      {/* Timezone */}
      {timezone && (
        <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '10px', fontFamily: 'var(--font-mono)' }}>
          {timezone}
        </p>
      )}
    </div>
  );
}
