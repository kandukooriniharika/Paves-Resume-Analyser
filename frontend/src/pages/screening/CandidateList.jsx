// src/pages/screening/CandidateList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, ChevronUp, ChevronDown, Eye, UserCheck,
  UserX, AlertCircle, Users, ArrowUpDown,
} from 'lucide-react';
import { screeningAPI, campaignAPI } from '../../api/screeningApi';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/status/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/Pagination/Pagination';
import SearchInput from '../../components/SearchInput/SearchInput';

const PAGE_SIZE = 10;

const RECOMMENDATION_OPTIONS = [
  { value: '', label: 'All Recommendations' },
  { value: 'STRONGLY_RECOMMENDED', label: 'Strong Fit' },
  { value: 'RECOMMENDED', label: 'Recommended' },
  { value: 'MAYBE', label: 'Maybe' },
  { value: 'REJECT', label: 'Not a Fit' },
];

const HR_STATUS_OPTIONS = [
  { value: '', label: 'All HR Statuses' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PENDING', label: 'Pending' },
];

function ScoreCell({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';
  const bg = score >= 80 ? 'var(--success-light)' : score >= 60 ? 'var(--warning-light)' : 'var(--danger-light)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '99px', fontSize: '0.78rem', fontWeight: '700',
      color, background: bg,
    }}>
      {score}
    </span>
  );
}

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 14px' }}>
          <div className="skeleton" style={{ height: '14px', borderRadius: '4px', width: i === 0 ? '120px' : '80px' }} />
        </td>
      ))}
    </tr>
  );
}

export default function CandidateList() {
  const navigate = useNavigate();
  const { id: campaignId } = useParams();
  const [roleInfo, setRoleInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [recFilter, setRecFilter] = useState('');
  const [hrFilter, setHrFilter] = useState('');
  const [sortField, setSortField] = useState('finalScore');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [actioning, setActioning] = useState(null);
  const [exporting, setExporting] = useState(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resultsRes, roleRes] = await Promise.allSettled([
        screeningAPI.getResults(campaignId),
        campaignAPI.getById(campaignId),
      ]);
      if (resultsRes.status === 'fulfilled') {
        setResults(resultsRes.value.data?.content ?? []);
      } else {
        setError(resultsRes.reason?.response?.data?.message || 'Failed to load candidates.');
      }
      if (roleRes.status === 'fulfilled') setRoleInfo(roleRes.value.data);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Filter + sort
  const filtered = results.filter(r => {
    const name = r.candidateName ?? r.name ?? '';
    const email = r.candidateEmail ?? r.email ?? '';
    const matchSearch = !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase());
    const matchRec = !recFilter || r.recommendation === recFilter;
    const matchHr = !hrFilter || (r.hrStatus ?? r.status) === hrFilter;
    return matchSearch && matchRec && matchHr;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    if (sortField === 'name') {
      av = (a.candidateName ?? '').toLowerCase();
      bv = (b.candidateName ?? '').toLowerCase();
    } else if (sortField === 'recommendation') {
      const order = { STRONGLY_RECOMMENDED: 0, RECOMMENDED: 1, MAYBE: 2, REJECT: 3 };
      av = order[a.recommendation] ?? 9;
      bv = order[b.recommendation] ?? 9;
    } else {
      av = a.overallScore ?? a.atsScore ?? 0;
      bv = b.overallScore ?? b.atsScore ?? 0;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const handleShortlist = async (e, resultId) => {
    e.stopPropagation();
    setActioning(resultId);
    try {
      await screeningAPI.shortlist(resultId);
      setResults(rs => rs.map(r => r.id === resultId ? { ...r, hrStatus: 'SHORTLISTED' } : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to shortlist.');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (e, resultId) => {
    e.stopPropagation();
    setActioning(resultId);
    try {
      await screeningAPI.reject(resultId);
      setResults(rs => rs.map(r => r.id === resultId ? { ...r, hrStatus: 'REJECTED' } : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActioning(null);
    }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await screeningAPI.export(campaignId, format);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates-${campaignId}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || `Export to ${format} failed.`);
    } finally {
      setExporting(null);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const thStyle = (field) => ({
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '0.72rem',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    cursor: field ? 'pointer' : 'default',
    userSelect: 'none',
  });

  return (
    <div className="page-container animate-fadeUp">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/screening/job-roles')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'none', border: 'none', marginBottom: '12px', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Job Roles
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {roleInfo?.roleName ?? 'AI Screening Results'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              AI Screening Results · {sorted.length} candidate{sorted.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="small"
              loading={exporting === 'CSV'}
              onClick={() => handleExport('CSV')}
            >
              <Download size={13} /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="small"
              loading={exporting === 'XLSX'}
              onClick={() => handleExport('XLSX')}
            >
              <Download size={13} /> Export XLSX
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px',
          marginBottom: '16px', fontSize: '0.85rem', color: 'var(--danger)',
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(0); }}
          placeholder="Search by name or email…"
          className="flex-1"
          style={{ minWidth: '180px' }}
        />
        <select
          value={recFilter}
          onChange={e => { setRecFilter(e.target.value); setPage(0); }}
          style={{
            padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem', color: 'var(--text-primary)', background: 'var(--surface)',
          }}
        >
          {RECOMMENDATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={hrFilter}
          onChange={e => { setHrFilter(e.target.value); setPage(0); }}
          style={{
            padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem', color: 'var(--text-primary)', background: 'var(--surface)',
          }}
        >
          {HR_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <tr>
                <th style={thStyle(null)}>#</th>
                <th style={thStyle('name')} onClick={() => toggleSort('name')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Candidate <SortIcon field="name" />
                  </span>
                </th>
                <th style={thStyle(null)}>Email</th>
                <th style={thStyle('finalScore')} onClick={() => toggleSort('finalScore')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ATS Score <SortIcon field="finalScore" />
                  </span>
                </th>
                <th style={thStyle('recommendation')} onClick={() => toggleSort('recommendation')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Recommendation <SortIcon field="recommendation" />
                  </span>
                </th>
                <th style={thStyle(null)}>HR Status</th>
                <th style={thStyle(null)}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 0' }}>
                    <EmptyState
                      icon={Users}
                      title="No candidates found"
                      description={search || recFilter || hrFilter ? 'Try adjusting your filters.' : 'Upload resumes and run the screening pipeline to see results.'}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((r, idx) => {
                  const rank = page * PAGE_SIZE + idx + 1;
                  const hrStatus = r.hrStatus ?? r.status;
                  const isActioning = actioning === r.id;
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(`/screening/results/${r.id}`)}
                    >
                      <td style={{ padding: '12px 14px', color: 'var(--text-tertiary)', fontSize: '0.78rem', fontWeight: '500' }}>
                        {rank}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {r.candidateName ?? r.name ?? '—'}
                        </p>
                        {r.candidatePhone && <p style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>{r.candidatePhone}</p>}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {r.candidateEmail ?? '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <ScoreCell score={r.overallScore ?? r.atsScore} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={r.recommendation} size="sm" />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={hrStatus} size="sm" />
                      </td>
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => navigate(`/screening/results/${r.id}`)}
                            title="View Detail"
                            style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.12s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--accent-nav)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          >
                            <Eye size={13} />
                          </button>
                          {hrStatus !== 'SHORTLISTED' && (
                            <button
                              onClick={e => handleShortlist(e, r.id)}
                              disabled={isActioning}
                              title="Shortlist"
                              style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'transparent', cursor: isActioning ? 'not-allowed' : 'pointer', color: 'var(--success)', transition: 'all 0.12s', opacity: isActioning ? 0.5 : 1 }}
                              onMouseEnter={e => { if (!isActioning) e.currentTarget.style.background = 'var(--success-light)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <UserCheck size={13} />
                            </button>
                          )}
                          {hrStatus !== 'REJECTED' && (
                            <button
                              onClick={e => handleReject(e, r.id)}
                              disabled={isActioning}
                              title="Reject"
                              style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'transparent', cursor: isActioning ? 'not-allowed' : 'pointer', color: 'var(--danger)', transition: 'all 0.12s', opacity: isActioning ? 0.5 : 1 }}
                              onMouseEnter={e => { if (!isActioning) e.currentTarget.style.background = 'var(--danger-light)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <UserX size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && sorted.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
