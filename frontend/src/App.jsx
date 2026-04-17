// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BranchView from './pages/BranchView';
import JobRoles from './pages/JobRoles';
import Resumes from './pages/Resumes';
import ResumeAnalysis from './pages/ResumeAnalysis';
import UploadResume from './pages/UploadResume';
import Settings from './pages/Settings';

function ProtectedLayout({ children }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Navbar />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedLayout><Dashboard /></ProtectedLayout>
        } />
        <Route path="/branches" element={
          <ProtectedLayout><BranchView /></ProtectedLayout>
        } />
        <Route path="/jobs" element={
          <ProtectedLayout><JobRoles /></ProtectedLayout>
        } />
        <Route path="/resumes" element={
          <ProtectedLayout><Resumes /></ProtectedLayout>
        } />
        <Route path="/analysis" element={
          <ProtectedLayout><ResumeAnalysis /></ProtectedLayout>
        } />
        <Route path="/upload" element={
          <ProtectedLayout><UploadResume /></ProtectedLayout>
        } />
        <Route path="/settings" element={
          <ProtectedLayout><Settings /></ProtectedLayout>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
