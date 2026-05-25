// src/pages/screening/JobRoleList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Users, Zap, Trash2, AlertCircle, Briefcase } from 'lucide-react';
import { campaignAPI } from '../../api/screeningApi';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/status/StatusBadge';
import SearchInput from '../../components/SearchInput/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/Pagination/Pagination';
import FormNativeSelect from '../../components/forms/FormNativeSelect';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
];

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-3 w-full rounded-full" style={{ marginTop: '8px' }} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <div className="skeleton h-8 w-24 rounded-lg" />
          <div className="skeleton h-8 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Progress</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {completed ?? 0}/{total ?? 0}
        </span>
      </div>
      <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-nav)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export default function JobRoleList() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [activating, setActivating] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await campaignAPI.list();
      setRoles(res.data?.content ?? res.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job roles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // Client-side filter
  const filtered = roles.filter(r => {
    const matchSearch = !search || r.roleName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleActivate = async (e, id) => {
    e.stopPropagation();
    setActivating(id);
    try {
      await campaignAPI.activate(id);
      await fetchRoles();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to activate job role.');
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Delete job role "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await campaignAPI.delete(id);
      await fetchRoles();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete job role.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page-container animate-fadeUp">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Job Roles
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage all your AI screening campaigns.
          </p>
        </div>
        <Button variant="primary" size="medium" onClick={() => navigate('/screening/job-roles/new')}>
          <Plus size={15} /> New Job Role
        </Button>
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
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search job roles…"
          className="flex-1"
          style={{ minWidth: '200px' }}
        />
        <FormNativeSelect
          id="status-filter"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={handleStatusChange}
          style={{ width: '160px' }}
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job roles found"
          description={search || statusFilter ? 'Try adjusting your filters.' : 'Create your first job role to begin AI screening.'}
          action={
            !search && !statusFilter && (
              <Button variant="primary" onClick={() => navigate('/screening/job-roles/new')}>
                <Plus size={15} /> New Job Role
              </Button>
            )
          }
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {paginated.map(role => (
              <div
                key={role.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  boxShadow: 'var(--shadow)',
                  transition: 'box-shadow 0.2s, transform 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => navigate(`/screening/job-roles/${role.id}/candidates`)}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '2px' }}>
                      {role.roleName}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {role.department || 'General'} {role.branchId ? `· Branch ${role.branchId}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={role.status} size="xs" />
                </div>

                {/* Experience */}
                {(role.minExperience != null || role.maxExperience != null) && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                    {role.minExperience ?? 0}–{role.maxExperience ?? '?'} yrs experience
                  </p>
                )}

                {/* Progress */}
                <div style={{ marginBottom: '14px' }}>
                  <ProgressBar
                    completed={role.completedResumes ?? role.processedCount ?? 0}
                    total={role.totalResumes ?? role.totalCount ?? 0}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={e => { e.stopPropagation(); navigate(`/screening/job-roles/${role.id}/candidates`); }}
                  >
                    <Users size={12} /> View Candidates
                  </Button>
                  <Button
                    size="small"
                    variant="outlineBlue"
                    onClick={e => { e.stopPropagation(); navigate(`/screening/job-roles/${role.id}/upload`); }}
                  >
                    <Upload size={12} /> Upload
                  </Button>
                  {role.status === 'DRAFT' && (
                    <Button
                      size="small"
                      variant="success"
                      loading={activating === role.id}
                      loadingText="Activating…"
                      onClick={e => handleActivate(e, role.id)}
                    >
                      <Zap size={12} /> Activate
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="softDanger"
                    loading={deleting === role.id}
                    onClick={e => handleDelete(e, role.id, role.roleName)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
