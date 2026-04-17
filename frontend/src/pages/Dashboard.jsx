// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Star, TrendingUp, Users,
  Clock, ArrowRight, BarChart2,
} from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import ResumeCard from '../components/resume/ResumeCard';
import Badge from '../components/ui/Badge';
import { branchAPI, resumeAPI } from '../api/api';
import useAuthStore from '../store/authStore';
import useResumeStore from '../store/resumeStore';
import { cardClass, pageTitleClass, headingClass } from '../styles/common';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { resumes, fetchResumes, setSelectedResume } = useResumeStore();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const branchId = user?.branch_id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [branchRes] = await Promise.all([
          branchAPI.getSummary(),
          branchId ? fetchResumes(branchId) : Promise.resolve(),
        ]);
        setBranches(branchRes.data || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [branchId]);

  // Compute stats
  const totalResumes = resumes.length;
  const shortlisted = resumes.filter(r => r.is_shortlisted).length;
  const avgScore = totalResumes
    ? Math.round(resumes.reduce((s, r) => s + (r.overall_score || 0), 0) / totalResumes)
    : 0;
  const pending = resumes.filter(r => r.status === 'pending').length;

  const recent = [...resumes]
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
    .slice(0, 5);

  const topScored = [...resumes]
    .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
    .slice(0, 3);

  const handleResumeClick = (resume) => {
    setSelectedResume(resume);
    navigate('/resumes');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-container animate-fadeUp">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: '500', marginBottom: '4px' }}>
          {greeting},
        </p>
        <h1 style={pageTitleClass}>
          {user?.full_name || 'HR Manager'} 👋
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Here's what's happening in your recruitment pipeline today.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px',
          marginBottom: '24px', fontSize: '0.82rem', color: 'var(--danger)',
        }}>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <StatsCard
          title="Total Resumes"
          value={totalResumes}
          subtitle="Across all roles"
          icon={FileText}
          color="var(--accent)"
          loading={loading}
        />
        <StatsCard
          title="Shortlisted"
          value={shortlisted}
          subtitle={`${totalResumes ? Math.round((shortlisted / totalResumes) * 100) : 0}% of total`}
          icon={Star}
          color="var(--warning)"
          loading={loading}
        />
        <StatsCard
          title="Avg. Score"
          value={avgScore ? `${avgScore}` : '—'}
          subtitle="Overall score avg."
          icon={TrendingUp}
          color="var(--success)"
          loading={loading}
        />
        <StatsCard
          title="Pending Review"
          value={pending}
          subtitle="Awaiting analysis"
          icon={Clock}
          color="var(--danger)"
          loading={loading}
        />
      </div>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

        {/* Recent resumes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={headingClass}>Recent Uploads</h2>
            <button
              onClick={() => navigate('/resumes')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', color: 'var(--accent)',
                fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
              }}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ ...cardClass, height: '72px' }}>
                  <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div style={{
              ...cardClass, textAlign: 'center', padding: '48px 24px',
              color: 'var(--text-tertiary)',
            }}>
              <FileText size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.85rem' }}>No resumes uploaded yet.</p>
              <button
                onClick={() => navigate('/upload')}
                style={{
                  marginTop: '12px', background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
                }}
              >
                Upload First Resume
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recent.map((r) => (
                <ResumeCard key={r.id} resume={r} onClick={handleResumeClick} compact />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Top scored */}
          <div style={cardClass}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BarChart2 size={15} color="var(--accent)" />
              <h3 style={headingClass}>Top Candidates</h3>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : topScored.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
                No candidates yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topScored.map((r, idx) => (
                  <div
                    key={r.id}
                    onClick={() => handleResumeClick(r)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-sm)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: '700',
                      color: idx === 0 ? 'var(--warning)' : 'var(--text-tertiary)',
                      width: '18px', flexShrink: 0,
                    }}>
                      #{idx + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }} className="truncate">
                        {r.candidate_name}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }} className="truncate">
                        {r.candidate_email}
                      </p>
                    </div>
                    <span style={{
                      fontWeight: '700', fontSize: '0.9rem',
                      color: r.overall_score >= 80 ? 'var(--success)' : r.overall_score >= 60 ? 'var(--warning)' : 'var(--danger)',
                    }}>
                      {r.overall_score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Branches summary */}
          <div style={cardClass}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Users size={15} color="var(--accent)" />
              <h3 style={headingClass}>Branches</h3>
            </div>
            {branches.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
                No branches found
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {branches.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => navigate('/branches')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--text-primary)' }}>{b.name}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{b.location}</p>
                    </div>
                    <Badge variant={b.is_active ? 'success' : 'default'} size="sm">
                      {b.is_active ? 'Active' : 'Off'}
                    </Badge>
                  </div>
                ))}
                {branches.length > 5 && (
                  <button
                    onClick={() => navigate('/branches')}
                    style={{
                      width: '100%', textAlign: 'center', padding: '8px',
                      background: 'none', border: 'none', color: 'var(--accent)',
                      fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer',
                    }}
                  >
                    +{branches.length - 5} more →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
