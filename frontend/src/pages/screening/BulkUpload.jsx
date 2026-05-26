// src/pages/screening/BulkUpload.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, UploadCloud, FileText, Archive, FolderOpen,
  X, CheckCircle, AlertCircle, Play, ExternalLink, RefreshCw,
} from 'lucide-react';
import { resumeAPI, pipelineAPI, campaignAPI } from '../../api/screeningApi';
import Button from '../../components/Button/Button';

const UPLOAD_MODES = [
  { key: 'files',  label: 'Files',       icon: FileText,   desc: 'Select individual PDF/DOCX/TXT files' },
  { key: 'zip',    label: 'ZIP Archive', icon: Archive,    desc: 'Upload a single .zip containing resumes' },
  { key: 'folder', label: 'Folder',      icon: FolderOpen, desc: 'Upload an entire folder at once' },
];

function formatBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function StatTile({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center', minWidth: '90px' }}>
      <p style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value ?? '—'}</p>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
    </div>
  );
}

export default function BulkUpload() {
  const navigate = useNavigate();
  const { id: campaignId } = useParams();
  const fileInputRef = useRef(null);

  const [roleInfo, setRoleInfo] = useState(null);
  const [uploadMode, setUploadMode] = useState('files');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [screeningStarted, setScreeningStarted] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null); // UploadStatusResponse

  // Load job role name
  useEffect(() => {
    (async () => {
      try {
        const res = await campaignAPI.getById(campaignId);
        setRoleInfo(res.data);
      } catch {
        // non-fatal
      }
    })();
  }, [campaignId]);

  // Poll upload/screening status every 3s when active
  useEffect(() => {
    if (!uploadDone && !screeningStarted) return;
    const intervalId = setInterval(async () => {
      try {
        const res = await resumeAPI.uploadStatus(campaignId);
        setProgress(res.data);
        // Stop polling when 100% complete
        const p = res.data;
        const total = p.total ?? 0;
        const done = (p.completed ?? 0) + (p.failed ?? 0);
        if (total > 0 && done >= total) {
          clearInterval(intervalId);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [uploadDone, screeningStarted, campaignId]);

  const progressPct = (() => {
    if (!progress) return 0;
    const total = progress.total ?? 0;
    const done = (progress.completed ?? 0) + (progress.failed ?? 0);
    if (total === 0) return 0;
    return Math.min(100, Math.round((done / total) * 100));
  })();

  const addFiles = useCallback((incoming) => {
    const arr = Array.from(incoming);
    if (uploadMode === 'zip') {
      // Only keep last ZIP
      const zips = arr.filter(f => f.name.endsWith('.zip'));
      setFiles(zips.slice(-1));
    } else {
      setFiles(prev => {
        const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
        const fresh = arr.filter(f => !existing.has(`${f.name}-${f.size}`));
        return [...prev, ...fresh];
      });
    }
  }, [uploadMode]);

  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  // Drag & drop handlers
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (files.length === 0) { setError('Please select at least one file.'); return; }
    setError('');
    setUploading(true);
    try {
      const res = await resumeAPI.bulkUpload(campaignId, files);
      const data = res.data;
      const successCount = Array.isArray(data)
        ? data.length
        : data?.successCount ?? data?.uploaded ?? data?.count ?? 0;
      if (successCount > 0) {
        setUploadDone(true);
      } else {
        setError('Upload completed but no files were processed. Check the file formats.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleStartScreening = async () => {
    setError('');
    try {
      await pipelineAPI.run(campaignId);
      setScreeningStarted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start screening pipeline.');
    }
  };

  // Accept attribute per mode
  const acceptAttr = uploadMode === 'files' ? '.pdf,.docx,.doc,.txt' : uploadMode === 'zip' ? '.zip' : undefined;
  const modeInfo = UPLOAD_MODES.find(m => m.key === uploadMode);

  return (
    <div className="page-container animate-fadeUp">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(`/screening/job-roles/${campaignId}/candidates`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'none', border: 'none', marginBottom: '12px', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Bulk Upload Resumes
        </h1>
        {roleInfo && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Job Role: <strong>{roleInfo.roleName}</strong>
          </p>
        )}
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

      {/* Upload Mode Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {UPLOAD_MODES.map(mode => {
          const Icon = mode.icon;
          const active = uploadMode === mode.key;
          return (
            <button
              key={mode.key}
              onClick={() => { setUploadMode(mode.key); setFiles([]); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                border: active ? '2px solid var(--accent-nav)' : '1px solid var(--border-subtle)',
                background: active ? 'rgba(33,45,116,0.06)' : 'var(--surface)',
                color: active ? 'var(--accent-nav)' : 'var(--text-secondary)',
                fontWeight: active ? '600' : '400',
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {mode.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Left: Drop zone + file list */}
        <div>
          {/* Drop Zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent-nav)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius)',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(33,45,116,0.04)' : 'var(--surface)',
              transition: 'all 0.2s',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(33,45,116,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UploadCloud size={26} color="var(--accent-nav)" />
              </div>
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {isDragging ? 'Drop files here' : modeInfo.desc}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {uploadMode === 'files' && 'Drag & drop or click · PDF, DOCX, DOC, TXT'}
              {uploadMode === 'zip' && 'Drag & drop a .zip file or click · ZIP will be extracted on server'}
              {uploadMode === 'folder' && 'Click to select a folder · All supported files will be uploaded'}
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            multiple={uploadMode !== 'zip'}
            accept={acceptAttr}
            {...(uploadMode === 'folder' ? { webkitdirectory: '', directory: '' } : {})}
            onChange={onFileChange}
          />

          {/* File List */}
          {files.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setFiles([])}
                  style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <FileText size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                      {formatBytes(file.size)}
                    </span>
                    <button
                      onClick={() => removeFile(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload button */}
          {!uploadDone && (
            <div style={{ marginTop: '16px' }}>
              <Button
                variant="primary"
                size="large"
                disabled={files.length === 0 || uploading}
                loading={uploading}
                loadingText="Uploading…"
                onClick={handleUpload}
              >
                <UploadCloud size={15} /> Upload {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : 'Files'}
              </Button>
            </div>
          )}
        </div>

        {/* Right: Status panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Upload done state */}
          {uploadDone && !screeningStarted && (
            <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center' }}>
              <CheckCircle size={28} color="var(--success)" style={{ marginBottom: '10px' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--success)', marginBottom: '6px' }}>Upload Successful!</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Resumes are ready. Start the AI screening pipeline to process them.
              </p>
              <Button variant="success" size="medium" onClick={handleStartScreening}>
                <Play size={14} /> Start Screening Pipeline
              </Button>
            </div>
          )}

          {/* Screening started */}
          {screeningStarted && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <RefreshCw size={15} color="var(--accent-nav)" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>Screening in Progress</p>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Overall Progress</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--accent-nav)' }}>{progressPct}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    background: 'var(--accent-nav)',
                    borderRadius: '99px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>

              {/* Stats grid */}
              {progress && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  <StatTile label="Total"     value={progress.total}     />
                  <StatTile label="Parsing"   value={progress.parsing}   color="var(--warning)" />
                  <StatTile label="Layer 1"   value={progress.layer1}    color="#6366f1" />
                  <StatTile label="Layer 2"   value={progress.layer2}    color="#8b5cf6" />
                  <StatTile label="AI Score"  value={progress.aiScoring} color="var(--warning)" />
                  <StatTile label="Done"      value={progress.completed} color="var(--success)" />
                  <StatTile label="Failed"    value={progress.failed}    color="var(--danger)" />
                  <StatTile label="Fraud"     value={progress.fraudFlagged} color="#dc2626" />
                </div>
              )}

              {progressPct >= 100 && (
                <Button
                  variant="primary"
                  size="medium"
                  onClick={() => navigate(`/screening/job-roles/${campaignId}/candidates`)}
                >
                  <ExternalLink size={14} /> View Results
                </Button>
              )}
            </div>
          )}

          {/* Instructions card */}
          {!uploadDone && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                How it works
              </h3>
              <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <li>Select resumes using one of the upload modes above.</li>
                <li>Click Upload to send files to the server.</li>
                <li>Start the AI Screening Pipeline.</li>
                <li>Monitor real-time progress as candidates are scored.</li>
                <li>View ranked results when complete.</li>
              </ol>
              <div style={{ marginTop: '14px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong>ZIP mode:</strong> Upload a single .zip archive — the server will extract and process all contained resumes automatically.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
