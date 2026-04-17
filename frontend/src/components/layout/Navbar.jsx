// src/components/layout/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, ChevronDown } from 'lucide-react';
import { navbarClass } from '../../styles/common';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const displayName = user?.full_name || user?.email || 'HR Manager';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav style={navbarClass}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '240px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '-0.02em' }}>TA</span>
        </div>
        <span style={{ fontWeight: '600', fontSize: '0.95rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          TalentOS
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Notification bell */}
        <button style={{
          width: '34px', height: '34px', borderRadius: '8px',
          border: '1px solid var(--border-subtle)', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Bell size={15} />
        </button>

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 10px 5px 6px',
          border: '1px solid var(--border-subtle)', borderRadius: '20px',
          cursor: 'default',
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: '600', color: '#fff',
          }}>
            {initials}
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            {displayName.split(' ')[0] || 'HR'}
          </span>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={{
          width: '34px', height: '34px', borderRadius: '8px',
          border: '1px solid var(--border-subtle)', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', transition: 'all 0.15s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--danger-light)';
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </nav>
  );
}
