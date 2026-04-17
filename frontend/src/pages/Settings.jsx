import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Building2, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { cardClass, pageTitleClass, headingClass, primaryBtn, secondaryBtn } from '../styles/common';

function DetailRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '16px',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: '500', textAlign: 'right' }}>
        {value || '-'}
      </span>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-container animate-fadeUp">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={pageTitleClass}>Settings</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Review your signed-in account details and session status.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <section style={cardClass}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={16} color="var(--accent)" />
            <h2 style={headingClass}>Profile</h2>
          </div>
          <DetailRow label="Full Name" value={user?.full_name || user?.email} />
          <DetailRow label="Email" value={user?.email} />
          <DetailRow label="Role" value={user?.role} />
        </section>

        <section style={cardClass}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Building2 size={16} color="var(--accent)" />
            <h2 style={headingClass}>Branch</h2>
          </div>
          <DetailRow label="Branch ID" value={user?.branch_id ? String(user.branch_id) : '-'} />
          <DetailRow label="User ID" value={user?.id ? String(user.id) : '-'} />
          <DetailRow label="Workspace" value="TalentOS Dashboard" />
        </section>

        <section style={cardClass}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={16} color="var(--accent)" />
            <h2 style={headingClass}>Session</h2>
          </div>
          <DetailRow label="Authentication" value={token ? 'Active' : 'Signed out'} />
          <DetailRow label="Access Type" value={token ? 'Bearer token' : '-'} />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '16px', lineHeight: '1.6' }}>
            Password, profile editing, and notification preferences can be added here when those backend endpoints are ready.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard')} style={secondaryBtn}>
              Back to Dashboard
            </button>
            <button onClick={handleLogout} style={primaryBtn}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
