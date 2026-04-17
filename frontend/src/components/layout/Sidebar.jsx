// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, GitBranch, Briefcase, FileText,
  Upload, Settings, ChevronRight,
} from 'lucide-react';
import { sidebarClass } from '../../styles/common';

const navItems = [
  { path: '/dashboard',        label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/branches',         label: 'Branches',     icon: GitBranch },
  { path: '/jobs',             label: 'Job Roles',    icon: Briefcase },
  { path: '/resumes',          label: 'Resumes',      icon: FileText },
  { path: '/upload',           label: 'Upload',       icon: Upload },
];

const NavItem = ({ item }) => {
  const { path, label, icon: Icon } = item;

  return (
    <NavLink to={path} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 12px', borderRadius: 'var(--radius-sm)',
          marginBottom: '2px',
          background: isActive ? 'var(--accent-light)' : 'transparent',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
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
      {/* Section label */}
      <p style={{
        fontSize: '0.68rem', fontWeight: '600',
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.08em', padding: '8px 12px 6px',
      }}>
        Navigation
      </p>

      {navItems.map((item) => (
        <NavItem key={item.path} item={item} />
      ))}

      <hr style={{
        border: 'none', borderTop: '1px solid var(--border-subtle)',
        margin: '16px 0',
      }} />

      <p style={{
        fontSize: '0.68rem', fontWeight: '600',
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.08em', padding: '0 12px 6px',
      }}>
        System
      </p>

      <NavLink to="/settings" style={{ textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: 'var(--radius-sm)',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: isActive ? '600' : '400',
            fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <Settings size={15} strokeWidth={1.8} />
            <span>Settings</span>
          </div>
        )}
      </NavLink>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '12px', right: '12px',
        padding: '12px', borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)', border: '1px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
          TalentOS v1.0
        </p>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
          AI Resume Intelligence
        </p>
      </div>
    </aside>
  );
}
