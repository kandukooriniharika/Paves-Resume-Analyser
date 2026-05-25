// src/pages/screening/ScreeningDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, CheckCircle, TrendingUp, Clock, Loader, AlertCircle, BarChart2 } from 'lucide-react';
import { analyticsAPI } from '../../api/screeningApi';
import StatCard from '../../components/Cards/StatCard';
import StatusBadge from '../../components/status/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

function ScoreChip({ score }) {
  if (score == null) return <span className="text-gray-400">—</span>;
  const color =
    score >= 80
      ? 'bg-emerald-100 text-emerald-800'
      : score >= 60
      ? 'bg-amber-100 text-amber-800'
      : 'bg-rose-100 text-rose-800';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

export default function ScreeningDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await analyticsAPI.dashboard();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = data?.stats ?? {};
  const topCandidates = data?.topCandidates ?? [];
  const recentJobRoles = data?.recentCampaigns ?? data?.recentJobRoles ?? [];
  const pipelineHealth = data?.pipelineHealth ?? {};

  return (
    <div className="page-container animate-fadeUp">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          AI Screening Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Monitor your recruitment pipeline and screening results.
        </p>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px',
          marginBottom: '20px', fontSize: '0.85rem', color: 'var(--danger)',
        }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard label="Total Job Roles"     value={stats.totalJobRoles ?? stats.totalCampaigns}     icon={Briefcase}   tone="blue"   />
          <StatCard label="Active Screenings"   value={stats.activeScreenings ?? stats.activeCampaigns} icon={Loader}      tone="yellow" />
          <StatCard label="Total Screened"      value={stats.totalScreened ?? stats.totalResumes}        icon={Users}       tone="violet" />
          <StatCard label="Avg ATS Score"       value={stats.avgAtsScore != null ? `${stats.avgAtsScore}%` : '—'} icon={TrendingUp} tone="green" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Pipeline Health */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart2 size={16} color="var(--accent-nav)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>Pipeline Health</h2>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { label: 'Pending',    value: pipelineHealth.pending,    color: '#6e6e73' },
                { label: 'Processing', value: pipelineHealth.processing, color: '#f5a623' },
                { label: 'Completed',  value: pipelineHealth.completed,  color: '#28a745' },
                { label: 'Failed',     value: pipelineHealth.failed,     color: '#d32f2f' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: '700', color, marginTop: '2px' }}>{value ?? '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Job Roles */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Briefcase size={16} color="var(--accent-nav)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>Recent Job Roles</h2>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}
            </div>
          ) : recentJobRoles.length === 0 ? (
            <EmptyState icon={Briefcase} title="No job roles yet" description="Create your first job role to get started." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentJobRoles.slice(0, 5).map(role => (
                <div
                  key={role.id}
                  onClick={() => navigate(`/screening/job-roles/${role.id}/candidates`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                >
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>{role.roleName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{role.department || 'General'}</p>
                  </div>
                  <StatusBadge status={role.status} size="xs" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Candidates */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle size={16} color="var(--accent-nav)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>Recent Activity — Top Candidates</h2>
        </div>
        {loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        ) : topCandidates.length === 0 ? (
          <EmptyState icon={Users} title="No candidates yet" description="Run screening on a job role to see results here." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Candidate', 'Job Role', 'ATS Score', 'Recommendation', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCandidates.map((c, idx) => (
                  <tr
                    key={c.id ?? idx}
                    onClick={() => c.id && navigate(`/screening/results/${c.id}`)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: c.id ? 'pointer' : 'default',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{c.candidateName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.email}</p>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{c.roleName ?? c.campaignName ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }}><ScoreChip score={c.atsScore ?? c.finalScore} /></td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={c.recommendation} size="xs" /></td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={c.hrStatus ?? c.status} size="xs" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
