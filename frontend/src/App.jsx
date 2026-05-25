// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';

// Screening pages
import ScreeningDashboard from './pages/screening/ScreeningDashboard';
import JobRoleList from './pages/screening/JobRoleList';
import CreateJobRole from './pages/screening/CreateJobRole';
import BulkUpload from './pages/screening/BulkUpload';
import CandidateList from './pages/screening/CandidateList';
import CandidateDetail from './pages/screening/CandidateDetail';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

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
        <Route path="/screening" element={<ProtectedLayout><ScreeningDashboard /></ProtectedLayout>} />
        <Route path="/screening/job-roles" element={<ProtectedLayout><JobRoleList /></ProtectedLayout>} />
        <Route path="/screening/job-roles/new" element={<ProtectedLayout><CreateJobRole /></ProtectedLayout>} />
        <Route path="/screening/job-roles/:id/edit" element={<ProtectedLayout><CreateJobRole /></ProtectedLayout>} />
        <Route path="/screening/job-roles/:id/upload" element={<ProtectedLayout><BulkUpload /></ProtectedLayout>} />
        <Route path="/screening/job-roles/:id/candidates" element={<ProtectedLayout><CandidateList /></ProtectedLayout>} />
        <Route path="/screening/results/:id" element={<ProtectedLayout><CandidateDetail /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/screening" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
