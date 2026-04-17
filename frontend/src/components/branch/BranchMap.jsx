// src/components/branch/BranchMap.jsx
import React from 'react';
import { MapPin } from 'lucide-react';
import { cardClass } from '../../styles/common';

export default function BranchMap({ branches = [] }) {
  // Placeholder map — replace with a real map library (e.g., react-simple-maps) if needed
  return (
    <div style={{
      ...cardClass,
      background: 'var(--surface-2)',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      border: '1px dashed var(--border)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        opacity: 0.5,
      }} />

      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        {branches.map((b) => (
          <div key={b.id} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'var(--surface)', border: '1px solid var(--border-subtle)',
            borderRadius: '20px', padding: '5px 12px',
          }}>
            <MapPin size={11} color="var(--accent)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              {b.name}
            </span>
          </div>
        ))}
      </div>

      <p style={{ position: 'relative', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
        {branches.length} branches worldwide
      </p>
    </div>
  );
}
