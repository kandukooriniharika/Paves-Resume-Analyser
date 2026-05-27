// src/pages/screening/JDUpload.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { jdAPI } from '../../api/screeningApi';

const DEFAULT_WEIGHTS = JSON.stringify({ skills: 40, experience: 30, education: 15, ai: 15 });

export default function JDUpload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('text');   // 'text' | 'file'
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState(null);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setError(''); setLoading(true);
    try {
      if (mode === 'text') {
        if (!rawText.trim()) { setError('JD text is required'); setLoading(false); return; }
        await jdAPI.createFromText({ title, department, rawText, scoringWeights: weights });
      } else {
        if (!file) { setError('Please select a file'); setLoading(false); return; }
        const form = new FormData();
        form.append('file', file);
        await jdAPI.createFromFile(form, { title, department, scoringWeights: weights });
      }
      setSuccess(true);
      setTimeout(() => navigate('/screening/jd'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)', background: 'var(--surface-1)',
    color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
        Upload Job Description
      </h2>

      {success ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#22c55e' }}>
          <CheckCircle size={40} />
          <p style={{ marginTop: '12px', fontWeight: '600' }}>JD uploaded successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            {['text', 'file'].map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', background: mode === m ? 'var(--accent)' : 'var(--surface-2)', color: mode === m ? '#fff' : 'var(--text-secondary)' }}>
                {m === 'text' ? 'Paste Text' : 'Upload File'}
              </button>
            ))}
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Job Title *</label>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Department</label>
            <input style={inputStyle} value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
          </div>

          {mode === 'text' ? (
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)' }}>JD Content *</label>
              <textarea style={{ ...inputStyle, minHeight: '200px', resize: 'vertical' }}
                value={rawText} onChange={e => setRawText(e.target.value)}
                placeholder="Paste the full job description here…" />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)' }}>JD File * (PDF or DOCX)</label>
              <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={e => setFile(e.target.files[0])} style={{ ...inputStyle, padding: '7px' }} />
              {file && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{file.name}</p>}
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Scoring Weights (JSON)</label>
            <input style={inputStyle} value={weights} onChange={e => setWeights(e.target.value)}
              placeholder='{"skills":40,"experience":30,"education":15,"ai":15}' />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
              Must sum to 100. Default: skills 40%, experience 30%, education 15%, AI 15%
            </p>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
            <Upload size={15} /> {loading ? 'Uploading…' : 'Upload JD'}
          </button>
        </form>
      )}
    </div>
  );
}
