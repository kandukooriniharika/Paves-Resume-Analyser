// src/pages/UploadResume.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, X, CheckCircle, AlertCircle, Briefcase,
} from 'lucide-react';
import { resumeAPI, branchAPI, jobAPI } from '../api/api';
import useAuthStore from '../store/authStore';
import { cardClass, pageTitleClass, headingClass, primaryBtn, secondaryBtn, inputClass } from '../styles/common';

const ACCEPTED = '.pdf';

export default function UploadResume() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [branches, setBranches] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    branch_id: user?.branch_id || '',
    job_role_id: '',
    candidate_name: '',
    candidate_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    branchAPI.getAll().then(r => {
      const data = r.data || [];
      setBranches(data);
      if (!form.branch_id && data.length) {
        setForm(f => ({ ...f, branch_id: String(data[0].id) }));
      }
    });
  }, []);

  useEffect(() => {
    if (!form.branch_id) return;
    jobAPI.getByBranch(form.branch_id)
      .then(r => setJobs(r.data || []))
      .catch(() => setJobs([]));
  }, [form.branch_id]);

  const handleFile = (nextFile) => {
    if (!nextFile) return;

    const ext = nextFile.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf') {
      setError('Only PDF files are accepted.');
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      return;
    }

    setFile(nextFile);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume file.');
      return;
    }
    if (!form.branch_id) {
      setError('Please select a branch.');
      return;
    }
    if (!form.job_role_id) {
      setError('Please select a job role.');
      return;
    }

    setLoading(true);
    setError('');
    setPhase('analysing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('candidateName', form.candidate_name);
      formData.append('candidateEmail', form.candidate_email);
      formData.append('branchId', form.branch_id);
      formData.append('jobRoleId', form.job_role_id);

      const uploadRes = await resumeAPI.upload(formData);
      setResult(uploadRes.data);
      setPhase('done');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Upload failed. Please try again.');
      setPhase('error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setPhase('');
    setError('');
    setForm(f => ({
      ...f,
      candidate_name: '',
      candidate_email: '',
      job_role_id: '',
    }));
  };

  if (phase === 'done' && result) {
    return (
      <div className="page-container animate-fadeUp" style={{ maxWidth: '600px' }}>
        <div style={{ ...cardClass, textAlign: 'center', padding: '48px 36px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--success-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircle size={28} color="var(--success)" />
          </div>
          <h2 style={{ ...headingClass, fontSize: '1.2rem', marginBottom: '8px' }}>Analysis Complete!</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '28px' }}>
            {result.candidate_name}'s resume has been uploaded and analysed.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
            marginBottom: '28px', background: 'var(--surface-2)',
            borderRadius: 'var(--radius)', padding: '16px',
          }}>
            {[
              { label: 'Overall', value: result.overall_score },
              { label: 'ATS', value: result.ats_score },
              { label: 'Skills', value: result.skill_match_score },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{
                  fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.03em',
                  color: value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--warning)' : 'var(--danger)',
                }}>
                  {value ?? '-'}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>{label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { navigate('/resumes'); }} style={primaryBtn}>
              View All Resumes
            </button>
            <button onClick={reset} style={secondaryBtn}>
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fadeUp">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={pageTitleClass}>Upload Resume</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Upload a candidate resume for AI-powered analysis and ATS scoring.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            onClick={() => !loading && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: dragging ? 'var(--accent-light)' : file ? 'var(--success-light)' : 'var(--surface)',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              onChange={e => handleFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <FileText size={24} color="var(--success)" />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{file.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: '8px' }}
                >
                  <X size={16} color="var(--text-tertiary)" />
                </button>
              </div>
            ) : (
              <>
                <Upload size={28} color={dragging ? 'var(--accent)' : 'var(--text-tertiary)'} style={{ marginBottom: '12px' }} />
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '4px' }}>
                  Drop resume here, or <span style={{ color: 'var(--accent)' }}>browse</span>
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>PDF only - max 10 MB</p>
              </>
            )}
          </div>

          <div style={cardClass}>
            <h3 style={{ ...headingClass, marginBottom: '16px' }}>Candidate Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { field: 'candidate_name', label: 'Full Name', placeholder: 'Jane Smith', type: 'text', required: true },
                { field: 'candidate_email', label: 'Email', placeholder: 'jane@example.com', type: 'email', required: true },
              ].map(({ field, label, placeholder, type, required }) => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
                  </label>
                  <input
                    type={type}
                    required={required}
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    style={inputClass}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={cardClass}>
            <h3 style={{ ...headingClass, marginBottom: '16px' }}>Assignment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Branch <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  required
                  value={form.branch_id}
                  onChange={e => setForm(f => ({ ...f, branch_id: e.target.value, job_role_id: '' }))}
                  style={{
                    ...inputClass, appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236e6e73' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
                  }}
                >
                  <option value="">Select branch...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Job Role <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  required
                  value={form.job_role_id}
                  onChange={e => setForm(f => ({ ...f, job_role_id: e.target.value }))}
                  style={{
                    ...inputClass, appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236e6e73' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
                  }}
                >
                  <option value="">Select job role...</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--danger-light)', border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              fontSize: '0.82rem', color: 'var(--danger)',
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            style={{
              ...primaryBtn,
              justifyContent: 'center', padding: '12px 24px',
              fontSize: '0.9rem', opacity: loading || !file ? 0.6 : 1,
              width: '100%',
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                <span>Uploading and analysing...</span>
              </div>
            ) : (
              <><Upload size={16} /> Analyse Resume</>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={cardClass}>
            <h3 style={{ ...headingClass, marginBottom: '14px' }}>What happens next?</h3>
            {[
              { step: '01', label: 'File Upload', desc: 'Your resume is securely uploaded to cloud storage.' },
              { step: '02', label: 'Text Extraction', desc: 'Text is extracted and cleaned for analysis.' },
              { step: '03', label: 'AI Analysis', desc: 'AI evaluates skills, experience, and role fit.' },
              { step: '04', label: 'ATS Scoring', desc: 'Score is calculated based on keyword matching.' },
            ].map(({ step, label, desc }) => (
              <div key={step} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <span style={{
                  flexShrink: 0, fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem', fontWeight: '700', color: 'var(--accent)',
                  width: '24px', paddingTop: '2px',
                }}>
                  {step}
                </span>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...cardClass, background: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
            <Briefcase size={18} color="var(--accent)" style={{ marginBottom: '10px' }} />
            <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Supported Formats
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              PDF only<br />
              Maximum file size: <strong>10 MB</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
