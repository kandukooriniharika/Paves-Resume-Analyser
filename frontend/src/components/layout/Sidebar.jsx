// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, PlusCircle, ChevronRight } from 'lucide-react';
import { sidebarClass } from '../../styles/common';

const navItems = [
  { path: '/screening',               label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { path: '/screening/job-roles',     label: 'Job Roles',    icon: Briefcase },
  { path: '/screening/job-roles/new', label: 'New Job Role', icon: PlusCircle },
];

const NavItem = ({ item }) => {
  const { path, label, icon: Icon, exact } = item;
  return (
    <NavLink
      to={path}
      end={exact}
      style={{ textDecoration: 'none' }}
    >
      {({ isActive }) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '2px',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            color: isActive ? 'var(--accent-nav)' : 'var(--text-secondary)',
            fontWeight: isActive ? '600' : '400',
            fontSize: '0.85rem',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.background = 'var(--surface-2)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
          <span style={{ flex: 1, letterSpacing: '-0.01em' }}>{label}</span>
          {isActive && <ChevronRight size={12} />}
        </div>
      )}
    </NavLink>
  );
};

export default function Sidebar() {
  return (
    <aside style={sidebarClass}>
      <p style={{
        fontSize: '0.68rem',
        fontWeight: '600',
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '8px 12px 6px',
      }}>
        AI Screening
      </p>

      {navItems.map(item => (
        <NavItem key={item.path} item={item} />
      ))}

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '12px',
        right: '12px',
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
          TalentOS v1.0
        </p>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
          AI Resume Screening
        </p>
      </div>
    </aside>
  );
}
