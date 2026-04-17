// src/pages/Resumes.jsx  (acts as the full resume list + detail entry)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, SlidersHorizontal, X } from 'lucide-react';
import ResumeCard from '../components/resume/ResumeCard';
import Badge from '../components/ui/Badge';
import { branchAPI } from '../api/api';
import useResumeStore from '../store/resumeStore';
import useAuthStore from '../store/authStore';
import { cardClass, pageTitleClass, headingClass, inputClass } from '../styles/common';

export default function Resumes() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { resumes, loading, error, fetchResumes, setSelectedResume } = useResumeStore();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(user?.branch_id || '');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date | score
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    branchAPI.getAll().then(r => {
      const data = r.data || [];
      setBranches(data);
      if (!selectedBranch && data.length) setSelectedBranch(String(data[0].id));
    });
  }, []);

  useEffect(() => {
    if (selectedBranch) fetchResumes(selectedBranch);
  }, [selectedBranch]);

  const handleClick = (resume) => {
    setSelectedResume(resume);
    navigate('/analysis');
  };

  const filtered = resumes
    .filter(r => {
      const matchSearch =
        r.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.candidate_email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' ? true : filterStatus === 'shortlisted' ? r.is_shortlisted : r.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.overall_score || 0) - (a.overall_score || 0);
      return new Date(b.uploaded_at) - new Date(a.uploaded_at);
    });

  const statuses = ['all', 'pending', 'analysed', 'shortlisted', 'rejected'];

  return (
    <div className="page-container animate-fadeUp">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={pageTitleClass}>Resumes</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {filtered.length} of {resumes.length} candidates
          </p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--text-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)',
            padding: '9px 16px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer',
          }}
        >
          + Upload Resume
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Branch */}
        <select
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
          style={{
            ...inputClass, width: 'auto', minWidth: '160px',
            appearance: 'none', paddingRight: '28px',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236e6e73' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
          }}
        >
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={13} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search candidates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputClass, paddingLeft: '30px' }}
          />
        </div>

        {/* Sort */}
        <button
          onClick={() => setSortBy(s => s === 'date' ? 'score' : 'date')}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '9px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={13} />
          {sortBy === 'date' ? 'By Date' : 'By Score'}
        </button>

        {/* Status pills */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 12px', borderRadius: '20px', border: '1px solid',
                borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
                background: filterStatus === s ? 'var(--accent-light)' : 'transparent',
                color: filterStatus === s ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          marginBottom: '16px', fontSize: '0.82rem', color: 'var(--danger)',
        }}>
          {error}
        </div>
      )}

      {/* Resume list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ ...cardClass, height: '80px' }}>
              <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-sm)' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardClass, textAlign: 'center', padding: '56px 24px', color: 'var(--text-tertiary)' }}>
          <FileText size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
            {resumes.length === 0 ? 'No resumes uploaded yet.' : 'No matches found.'}
          </p>
          {resumes.length === 0 && (
            <button
              onClick={() => navigate('/upload')}
              style={{
                marginTop: '14px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-sm)',
                padding: '8px 18px', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
              }}
            >
              Upload First Resume
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(r => (
            <ResumeCard key={r.id} resume={r} onClick={handleClick} />
          ))}
        </div>
      )}
    </div>
  );
}
