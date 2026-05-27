// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, PlusCircle, ChevronRight,
  FileText, Users, Search, Upload, GitBranch,
} from 'lucide-react';
import { sidebarClass } from '../../styles/common';
import useAuthStore from '../../store/authStore';

const ALL_NAV = [
  { path: '/screening',                   label: 'Dashboard',    icon: LayoutDashboard, exact: true, roles: ['HR_ADMIN','RECRUITER','HIRING_MANAGER'] },
  { path: '/screening/job-roles',         label: 'Campaigns',    icon: Briefcase,                    roles: ['HR_ADMIN','RECRUITER','HIRING_MANAGER'] },
  { path: '/screening/job-roles/new',     label: 'New Campaign', icon: PlusCircle,                   roles: ['HR_ADMIN'] },
  { path: '/screening/jd',               label: 'JD Library',   icon: FileText,                     roles: ['HR_ADMIN','RECRUITER','HIRING_MANAGER'] },
  { path: '/screening/jd/upload',        label: 'Upload JD',    icon: Upload,                       roles: ['HR_ADMIN'] },
  { path: '/screening/workflow',          label: 'Pipeline',     icon: GitBranch,                    roles: ['HR_ADMIN','RECRUITER','HIRING_MANAGER'] },
  { path: '/screening/talent-pool',       label: 'Talent Pool',  icon: Users,                        roles: ['HR_ADMIN','RECRUITER'] },
  { path: '/screening/talent-pool/search',label: 'AI Search',    icon: Search,                       roles: ['HR_ADMIN','RECRUITER'] },
];

function mapRole(role) {
  if (!role) return 'RECRUITER';
  if (['HR_ADMIN','RECRUITER','HIRING_MANAGER'].includes(role)) return role;
  if (role === 'HEAD' || role === 'ADMIN') return 'HR_ADMIN';
  if (role === 'HR' || role === 'ACQUISITION') return 'RECRUITER';
  return 'RECRUITER';
}

const NavItem = ({ item }) => {
  const { path, label, icon: Icon, exact } = item;
  return (
    <NavLink to={path} end={exact} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '2px',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            color: isActive ? 'var(--accent-nav)' : 'var(--text-secondary)',
            fontWeight: isActive ? '600' : '400', fontSize: '0.85rem',
            transition: 'all 0.15s ease', cursor: 'pointer',
          }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
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
  const user = useAuthStore(s => s.user);
  const role = mapRole(user?.role);
  const visibleItems = ALL_NAV.filter(item => item.roles.includes(role));

  return (
    <aside style={sidebarClass}>
      <p style={{
        fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 6px',
      }}>
        AI Screening
      </p>

      {visibleItems.map(item => <NavItem key={item.path} item={item} />)}

      <div style={{
        position: 'absolute', bottom: '16px', left: '12px', right: '12px',
        padding: '12px', borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)', border: '1px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
          TalentOS v2.0
        </p>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
          {role.replace('_', ' ')}
        </p>
      </div>
    </aside>
  );
}
