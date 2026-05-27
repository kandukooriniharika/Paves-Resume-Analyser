// src/pages/screening/JDLibrary.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Archive } from 'lucide-react';
import { jdAPI } from '../../api/screeningApi';

const STATUS_COLORS = { DRAFT: '#f59e0b', ACTIVE: '#22c55e', ARCHIVED: '#94a3b8' };

export default function JDLibrary() {
  const [jds, setJds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    jdAPI.listAll()
      .then(r => setJds(r.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleActivate = async (id) => {
    await jdAPI.activate(id);
    setJds(prev => prev.map(j => j.id === id ? { ...j, status: 'ACTIVE' } : j));
  };
  const handleArchive = async (id) => {
    await jdAPI.archive(id);
    setJds(prev => prev.map(j => j.id === id ? { ...j, status: 'ARCHIVED' } : j));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          JD Library
        </h2>
        <button
          onClick={() => navigate('/screening/jd/upload')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.83rem', fontWeight: '600' }}
        >
          <Plus size={14} /> Upload JD
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading…</p>
      ) : jds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
          <FileText size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>No job descriptions yet. Upload one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {jds.map(jd => (
            <div key={jd.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <FileText size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{jd.title}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '600', color: STATUS_COLORS[jd.status], background: `${STATUS_COLORS[jd.status]}20`, padding: '2px 8px', borderRadius: '10px' }}>{jd.status}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>v{jd.version}</span>
                </div>
                {jd.department && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{jd.department}</p>}
                {jd.requiredSkills && (
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                    Skills: {jd.requiredSkills.split(',').slice(0, 5).join(', ')}{jd.requiredSkills.split(',').length > 5 ? '…' : ''}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {jd.status === 'DRAFT' && (
                  <button onClick={() => handleActivate(jd.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#22c55e20', color: '#22c55e', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                    <CheckCircle size={12} /> Activate
                  </button>
                )}
                {jd.status !== 'ARCHIVED' && (
                  <button onClick={() => handleArchive(jd.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem' }}>
                    <Archive size={12} /> Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
