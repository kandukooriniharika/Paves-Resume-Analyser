// src/pages/JobRoles.jsx
import React, { useEffect, useState } from 'react';
import { Briefcase, Search, ChevronDown, ChevronUp, Users, Clock, X } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { branchAPI, jobAPI } from '../api/api';
import { cardClass, pageTitleClass, headingClass, inputClass } from '../styles/common';

function JobCard({ job, expanded, onToggle }) {
  const {
    title, description, required_skills = [], nice_to_have_skills = [],
    min_experience_years, max_experience_years,
    is_open, target_headcount, current_applications,
  } = job;

  const fillPct = target_headcount ? Math.round((current_applications / target_headcount) * 100) : 0;

  return (
    <div style={{
      ...cardClass,
      padding: 0,
      overflow: 'hidden',
      transition: 'box-shadow 0.18s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 20px', cursor: 'pointer',
        }}
      >
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: is_open ? 'var(--success-light)' : 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Briefcase size={16} color={is_open ? 'var(--success)' : 'var(--text-tertiary)'} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {title}
            </p>
            <Badge variant={is_open ? 'success' : 'default'} size="sm">
              {is_open ? 'Open' : 'Closed'}
            </Badge>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {min_experience_years}–{max_experience_years} yrs experience
          </p>
        </div>

        {/* Application progress */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            {current_applications} <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>/ {target_headcount}</span>
          </p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>applicants</p>
        </div>

        {expanded ? <ChevronUp size={16} color="var(--text-tertiary)" /> : <ChevronDown size={16} color="var(--text-tertiary)" />}
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--surface-3)', margin: '0 20px' }}>
        <div style={{
          height: '100%', width: `${Math.min(fillPct, 100)}%`,
          background: fillPct >= 80 ? 'var(--danger)' : fillPct >= 50 ? 'var(--warning)' : 'var(--success)',
          borderRadius: '4px', transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }} className="animate-fadeIn">
          {description && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
              {description}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {required_skills.length > 0 && (
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Required Skills
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {required_skills.map((s, i) => <Badge key={i} variant="accent" size="sm">{s}</Badge>)}
                </div>
              </div>
            )}
            {nice_to_have_skills.length > 0 && (
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Nice to Have
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {nice_to_have_skills.map((s, i) => <Badge key={i} variant="default" size="sm">{s}</Badge>)}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={12} color="var(--text-tertiary)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {current_applications} of {target_headcount} target
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={12} color="var(--text-tertiary)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {min_experience_years}–{max_experience_years} years exp.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobRoles() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    branchAPI.getAll()
      .then(r => {
        const data = r.data || [];
        setBranches(data);
        if (data.length) setSelectedBranch(String(data[0].id));
      })
      .finally(() => setBranchLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;
    setLoading(true);
    jobAPI.getByBranch(selectedBranch)
      .then(r => setJobs(r.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [selectedBranch]);

  const filtered = jobs.filter(j => {
    const matchSearch = j.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' ? true : filterStatus === 'open' ? j.is_open : !j.is_open;
    return matchSearch && matchStatus;
  });

  const openCount = jobs.filter(j => j.is_open).length;

  return (
    <div className="page-container animate-fadeUp">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={pageTitleClass}>Job Roles</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Browse and manage open positions across branches.
        </p>
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        alignItems: 'center', marginBottom: '20px',
      }}>
        {/* Branch selector */}
        <select
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
          disabled={branchLoading}
          style={{
            ...inputClass, width: 'auto', minWidth: '180px',
            appearance: 'none', paddingRight: '32px',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236e6e73' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          }}
        >
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
          <Search size={13} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search roles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputClass, paddingLeft: '30px' }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'open', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '7px 14px', borderRadius: '20px',
                border: '1px solid',
                borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
                background: filterStatus === s ? 'var(--accent-light)' : 'transparent',
                color: filterStatus === s ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="accent">{openCount} open</Badge>
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...cardClass, height: '80px' }}>
              <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-sm)' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardClass, textAlign: 'center', padding: '56px 24px', color: 'var(--text-tertiary)' }}>
          <Briefcase size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>No job roles found.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Try adjusting your filters or selecting a different branch.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(j => (
            <JobCard
              key={j.id}
              job={j}
              expanded={expandedId === j.id}
              onToggle={() => setExpandedId(expandedId === j.id ? null : j.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
