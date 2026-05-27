// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';

// Existing screening pages
import ScreeningDashboard from './pages/screening/ScreeningDashboard';
import JobRoleList from './pages/screening/JobRoleList';
import CreateJobRole from './pages/screening/CreateJobRole';
import BulkUpload from './pages/screening/BulkUpload';
import CandidateList from './pages/screening/CandidateList';
import CandidateDetail from './pages/screening/CandidateDetail';

// New pages
import JDLibrary from './pages/screening/JDLibrary';
import JDUpload from './pages/screening/JDUpload';
import WorkflowBoard from './pages/screening/WorkflowBoard';
import TalentPoolSearch from './pages/screening/TalentPoolSearch';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

function mapRole(role) {
  if (!role) return 'RECRUITER';
  if (['HR_ADMIN', 'RECRUITER', 'HIRING_MANAGER'].includes(role)) return role;
  if (role === 'HEAD' || role === 'ADMIN') return 'HR_ADMIN';
  if (role === 'HR' || role === 'ACQUISITION') return 'RECRUITER';
  return 'RECRUITER';
}

function ProtectedLayout({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
}

/** Restricts a route to specific roles. Redirects to /screening if not allowed. */
function RoleGuard({ children, roles }) {
  const user = useAuthStore(s => s.user);
  const role = mapRole(user?.role);
  if (!roles.includes(role)) return <Navigate to="/screening" replace />;
  return children;
}

function PublicRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (token) return <Navigate to="/screening" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* ── Dashboard ──────────────────────────────────────────────────────── */}
        <Route path="/screening" element={<ProtectedLayout><ScreeningDashboard /></ProtectedLayout>} />

        {/* ── Campaigns ─────────────────────────────────────────────────────── */}
        <Route path="/screening/job-roles" element={<ProtectedLayout><JobRoleList /></ProtectedLayout>} />
        <Route path="/screening/job-roles/new" element={
          <ProtectedLayout>
            <RoleGuard roles={['HR_ADMIN']}>
              <CreateJobRole />
            </RoleGuard>
          </ProtectedLayout>
        } />
        <Route path="/screening/job-roles/:id/edit" element={
          <ProtectedLayout>
            <RoleGuard roles={['HR_ADMIN']}>
              <CreateJobRole />
            </RoleGuard>
          </ProtectedLayout>
        } />
        <Route path="/screening/job-roles/:id/upload" element={<ProtectedLayout><BulkUpload /></ProtectedLayout>} />
        <Route path="/screening/job-roles/:id/candidates" element={<ProtectedLayout><CandidateList /></ProtectedLayout>} />
        <Route path="/screening/results/:id" element={<ProtectedLayout><CandidateDetail /></ProtectedLayout>} />

        {/* ── JD Management ─────────────────────────────────────────────────── */}
        <Route path="/screening/jd" element={<ProtectedLayout><JDLibrary /></ProtectedLayout>} />
        <Route path="/screening/jd/upload" element={
          <ProtectedLayout>
            <RoleGuard roles={['HR_ADMIN']}>
              <JDUpload />
            </RoleGuard>
          </ProtectedLayout>
        } />

        {/* ── Workflow Pipeline ──────────────────────────────────────────────── */}
        <Route path="/screening/workflow" element={<ProtectedLayout><WorkflowBoard /></ProtectedLayout>} />

        {/* ── Talent Pool ────────────────────────────────────────────────────── */}
        <Route path="/screening/talent-pool" element={
          <ProtectedLayout>
            <RoleGuard roles={['HR_ADMIN', 'RECRUITER']}>
              <TalentPoolSearch />
            </RoleGuard>
          </ProtectedLayout>
        } />
        <Route path="/screening/talent-pool/search" element={
          <ProtectedLayout>
            <RoleGuard roles={['HR_ADMIN', 'RECRUITER']}>
              <TalentPoolSearch />
            </RoleGuard>
          </ProtectedLayout>
        } />

        <Route path="*" element={<Navigate to="/screening" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
