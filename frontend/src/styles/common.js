// src/styles/common.js
// Apple-style design token helpers — inline style objects & class name strings

export const cardClass = {
  background: 'var(--surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius)',
  padding: '24px',
  boxShadow: 'var(--shadow)',
};

export const cardHoverStyle = {
  ...cardClass,
  transition: 'box-shadow var(--transition), transform var(--transition)',
};

export const pageTitleClass = {
  fontSize: '1.6rem',
  fontWeight: '600',
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  lineHeight: '1.2',
};

export const headingClass = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};

export const subheadingClass = {
  fontSize: '0.8rem',
  fontWeight: '500',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

export const labelClass = {
  fontSize: '0.78rem',
  fontWeight: '500',
  color: 'var(--text-secondary)',
};

export const primaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '9px 18px',
  fontSize: '0.85rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background var(--transition), transform var(--transition)',
  letterSpacing: '-0.01em',
};

export const secondaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background var(--transition)',
};

export const ghostBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'transparent',
  color: 'var(--accent)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 12px',
  fontSize: '0.85rem',
  fontWeight: '500',
  cursor: 'pointer',
};

export const inputClass = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 14px',
  fontSize: '0.9rem',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color var(--transition)',
};

export const navbarClass = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 'var(--navbar-height)',
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid var(--border-subtle)',
  display: 'flex',
  alignItems: 'center',
  paddingInline: '24px',
  zIndex: 1000,
};

export const sidebarClass = {
  position: 'fixed',
  top: 'var(--navbar-height)',
  left: 0,
  width: 'var(--sidebar-width)',
  height: 'calc(100vh - var(--navbar-height))',
  background: 'var(--surface)',
  borderRight: '1px solid var(--border-subtle)',
  overflowY: 'auto',
  zIndex: 900,
  padding: '16px 12px',
};

export const dividerClass = {
  border: 'none',
  borderTop: '1px solid var(--border-subtle)',
  margin: '16px 0',
};

// Score color helpers
export const getScoreColor = (score) => {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
};

export const getScoreBg = (score) => {
  if (score >= 80) return 'var(--success-light)';
  if (score >= 60) return 'var(--warning-light)';
  return 'var(--danger-light)';
};

export const getStatusStyle = (status) => {
  const map = {
    shortlisted: { color: 'var(--success)', background: 'var(--success-light)' },
    pending:     { color: 'var(--warning)', background: 'var(--warning-light)' },
    rejected:    { color: 'var(--danger)',  background: 'var(--danger-light)'  },
    analysed:    { color: 'var(--accent)',  background: 'var(--accent-light)'  },
  };
  return map[status?.toLowerCase()] || { color: 'var(--text-secondary)', background: 'var(--surface-2)' };
};
