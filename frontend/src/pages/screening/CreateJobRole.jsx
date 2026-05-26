// src/pages/screening/CreateJobRole.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { campaignAPI } from '../../api/screeningApi';
import Button from '../../components/Button/Button';
import FormInput from '../../components/forms/FormInput';
import FormTextArea from '../../components/forms/FormTextArea';

const INITIAL_FORM = {
  roleName: '',
  department: '',
  jobDescription: '',
  requiredSkills: '',
  niceToHaveSkills: '',
  minExperience: '',
  maxExperience: '',
  targetHeadcount: '',
  branchId: '',
  skillsWeight: 40,
  experienceWeight: 30,
  educationWeight: 20,
  aiScoreWeight: 10,
};

function WeightSlider({ label, value, onChange, name }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{label}</label>
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-nav)' }}>{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={onChange}
        name={name}
        style={{ width: '100%', accentColor: 'var(--accent-nav)' }}
      />
    </div>
  );
}

export default function CreateJobRole() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [submitError, setSubmitError] = useState('');

  const parseWeights = (value) => {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  };

  const weightTotal =
    Number(form.skillsWeight) +
    Number(form.experienceWeight) +
    Number(form.educationWeight) +
    Number(form.aiScoreWeight);

  // Load existing data for edit mode
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await campaignAPI.getById(id);
        const d = res.data;
        const weights = parseWeights(d.skillWeightsJson);
        setForm({
          roleName:         d.roleName ?? '',
          department:       d.department ?? '',
          jobDescription:   d.jobDescription ?? '',
          requiredSkills:   Array.isArray(d.requiredSkills) ? d.requiredSkills.join(', ') : (d.requiredSkills ?? ''),
          niceToHaveSkills: Array.isArray(d.niceToHaveSkills) ? d.niceToHaveSkills.join(', ') : (d.niceToHaveSkills ?? ''),
          minExperience:    d.minExperience ?? '',
          maxExperience:    d.maxExperience ?? '',
          targetHeadcount:  d.targetHeadcount ?? '',
          branchId:         d.branchId ?? '',
          skillsWeight:     weights.skills ?? 40,
          experienceWeight: weights.experience ?? 30,
          educationWeight:  weights.education ?? 20,
          aiScoreWeight:    weights.aiScore ?? 10,
        });
      } catch (err) {
        setSubmitError('Failed to load job role data.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.roleName.trim()) errs.roleName = 'Role name is required.';
    if (weightTotal !== 100) errs.weights = `Weights must sum to 100 (currently ${weightTotal}).`;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        roleName:         form.roleName.trim(),
        department:       form.department.trim() || undefined,
        jobDescription:   form.jobDescription.trim() || undefined,
        requiredSkills:   form.requiredSkills.trim() || undefined,
        niceToHaveSkills: form.niceToHaveSkills.trim() || undefined,
        minExperience:    form.minExperience !== '' ? Number(form.minExperience) : undefined,
        maxExperience:    form.maxExperience !== '' ? Number(form.maxExperience) : undefined,
        targetHeadcount:  form.targetHeadcount !== '' ? Number(form.targetHeadcount) : undefined,
        branchId:         form.branchId !== '' ? Number(form.branchId) : undefined,
        skillWeightsJson: JSON.stringify({
          skills: Number(form.skillsWeight),
          experience: Number(form.experienceWeight),
          education: Number(form.educationWeight),
          aiScore: Number(form.aiScoreWeight),
        }),
      };

      if (isEdit) {
        await campaignAPI.update(id, payload);
      } else {
        await campaignAPI.create(payload);
      }
      navigate('/screening/job-roles');
    } catch (err) {
      setSubmitError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} job role.`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fadeUp">
      {/* Back + Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/screening/job-roles')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'none', border: 'none', marginBottom: '12px', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Back to Job Roles
        </button>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {isEdit ? 'Edit Job Role' : 'New Job Role'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {isEdit ? 'Update the details for this screening campaign.' : 'Define a new AI screening campaign for a role.'}
        </p>
      </div>

      {submitError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px',
          marginBottom: '20px', fontSize: '0.85rem', color: 'var(--danger)',
        }}>
          <AlertCircle size={15} /> {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '700px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>Basic Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormInput
              label="Role Name"
              id="roleName"
              name="roleName"
              required
              placeholder="e.g. Senior Software Engineer"
              value={form.roleName}
              onChange={handleChange}
              error={errors.roleName}
            />
            <FormInput
              label="Department"
              id="department"
              name="department"
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={handleChange}
            />
            <FormTextArea
              label="Job Description"
              id="jobDescription"
              name="jobDescription"
              rows={4}
              placeholder="Describe the role, responsibilities, and requirements…"
              value={form.jobDescription}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>Skills</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormTextArea
              label="Required Skills"
              id="requiredSkills"
              name="requiredSkills"
              rows={2}
              placeholder="React, Node.js, SQL, AWS"
              value={form.requiredSkills}
              onChange={handleChange}
              hint="Comma-separated list of required skills"
            />
            <FormTextArea
              label="Nice-to-Have Skills"
              id="niceToHaveSkills"
              name="niceToHaveSkills"
              rows={2}
              placeholder="Docker, Kubernetes, GraphQL"
              value={form.niceToHaveSkills}
              onChange={handleChange}
              hint="Comma-separated list of bonus skills"
            />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>Requirements</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput
              label="Min Experience (years)"
              id="minExperience"
              name="minExperience"
              type="number"
              min={0}
              placeholder="0"
              value={form.minExperience}
              onChange={handleChange}
            />
            <FormInput
              label="Max Experience (years)"
              id="maxExperience"
              name="maxExperience"
              type="number"
              min={0}
              placeholder="10"
              value={form.maxExperience}
              onChange={handleChange}
            />
            <FormInput
              label="Target Headcount"
              id="targetHeadcount"
              name="targetHeadcount"
              type="number"
              min={1}
              placeholder="5"
              value={form.targetHeadcount}
              onChange={handleChange}
            />
            <FormInput
              label="Branch ID"
              id="branchId"
              name="branchId"
              type="number"
              min={1}
              placeholder="1"
              value={form.branchId}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Skill Weights */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>Scoring Weights</h2>
            <span style={{
              fontSize: '0.8rem', fontWeight: '600', padding: '3px 10px', borderRadius: '99px',
              background: weightTotal === 100 ? 'var(--success-light)' : 'var(--danger-light)',
              color: weightTotal === 100 ? 'var(--success)' : 'var(--danger)',
            }}>
              Total: {weightTotal}%
            </span>
          </div>
          {errors.weights && (
            <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '12px' }}>{errors.weights}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <WeightSlider label="Skills Weight"      value={form.skillsWeight}     onChange={handleChange} name="skillsWeight" />
            <WeightSlider label="Experience Weight"  value={form.experienceWeight} onChange={handleChange} name="experienceWeight" />
            <WeightSlider label="Education Weight"   value={form.educationWeight}  onChange={handleChange} name="educationWeight" />
            <WeightSlider label="AI Score Weight"    value={form.aiScoreWeight}    onChange={handleChange} name="aiScoreWeight" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" variant="primary" size="large" loading={loading} loadingText={isEdit ? 'Saving…' : 'Creating…'}>
            {isEdit ? 'Save Changes' : 'Create Job Role'}
          </Button>
          <Button type="button" variant="outline" size="large" onClick={() => navigate('/screening/job-roles')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
