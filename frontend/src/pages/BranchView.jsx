// src/pages/BranchView.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GitBranch, X } from 'lucide-react';
import BranchCard from '../components/branch/BranchCard';
import BranchMap from '../components/branch/BranchMap';
import Badge from '../components/ui/Badge';
import { branchAPI, jobAPI, resumeAPI } from '../api/api';
import { cardClass, pageTitleClass, headingClass, inputClass } from '../styles/common';

export default function BranchView() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    branchAPI.getAll()
      .then(r => setBranches(r.data || []))
      .catch(() => setError('Failed to load branches.'))
      .finally(() => setLoading(false));
  }, []);

  const handleBranchClick = async (branch) => {
    setSelected(branch);
    setDetailLoading(true);
    try {
      const [jobRes, resumeRes] = await Promise.all([
        jobAPI.getByBranch(branch.id),
        resumeAPI.getByBranch(branch.id),
      ]);
      setJobs(jobRes.data || []);
      setResumes(resumeRes.data || []);
    } catch {
      setJobs([]);
      setResumes([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = branches.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.location?.toLowerCase().includes(search.toLowerCase()) ||
    b.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container animate-fadeUp">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={pageTitleClass}>Branches</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Manage and explore all hiring branches worldwide.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          marginBottom: '20px', fontSize: '0.82rem', color: 'var(--danger)',
        }}>
          {error}
        </div>
      )}

      {/* Map */}
      <div style={{ marginBottom: '24px' }}>
        <BranchMap branches={branches} />
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '360px' }}>
        <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          placeholder="Search branches…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputClass, paddingLeft: '36px', paddingRight: search ? '36px' : '14px' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={14} color="var(--text-tertiary)" />
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '20px', alignItems: 'start' }}>
        {/* Branch grid */}
        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ ...cardClass, height: '160px' }}>
                  <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...cardClass, textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
              <GitBranch size={28} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.85rem' }}>No branches found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {filtered.map(b => (
                <div key={b.id} style={{ outline: selected?.id === b.id ? '2px solid var(--accent)' : 'none', borderRadius: 'var(--radius)', transition: 'outline 0.15s' }}>
                  <BranchCard branch={b} onClick={handleBranchClick} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Branch header */}
            <div style={cardClass}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>{selected.code}</span>
                  <h2 style={{ ...headingClass, fontSize: '1.1rem' }}>{selected.name}</h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selected.location}, {selected.country}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={16} color="var(--text-tertiary)" />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: '500', marginBottom: '2px' }}>RESUMES</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                    {detailLoading ? '…' : resumes.length}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: '500', marginBottom: '2px' }}>OPEN ROLES</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                    {detailLoading ? '…' : jobs.filter(j => j.is_open).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Jobs */}
            <div style={cardClass}>
              <h3 style={{ ...headingClass, marginBottom: '14px' }}>Job Roles ({jobs.length})</h3>
              {detailLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '8px' }} />)}
                </div>
              ) : jobs.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No roles for this branch.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  {jobs.map(j => (
                    <div key={j.id} style={{
                      padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-2)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{j.title}</p>
                        <Badge variant={j.is_open ? 'success' : 'default'} size="sm">{j.is_open ? 'Open' : 'Closed'}</Badge>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {j.min_experience_years}–{j.max_experience_years} yrs · {j.current_applications}/{j.target_headcount} apps
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumes preview */}
            <div style={cardClass}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={headingClass}>Recent Resumes</h3>
                <button onClick={() => navigate('/resumes')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '500' }}>
                  View all →
                </button>
              </div>
              {detailLoading ? (
                <div className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />
              ) : resumes.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No resumes yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                  {resumes.slice(0, 6).map(r => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-2)', cursor: 'pointer',
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent)', flexShrink: 0,
                      }}>
                        {r.candidate_name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-primary)' }} className="truncate">{r.candidate_name}</p>
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.82rem', color: r.overall_score >= 80 ? 'var(--success)' : r.overall_score >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                        {r.overall_score ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
