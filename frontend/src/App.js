import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from '@/pages/LandingPage';
import DemoPage from '@/pages/DemoPage';
import ModuleAnalyzer from '@/pages/ModuleAnalyzer';
import ProgressTracker from '@/pages/ProgressTracker';
import GSTAssistant from '@/pages/GSTAssistant';
import InvoiceEngine from '@/pages/InvoiceEngine';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import CAPublicChat from '@/pages/CAPublicChat';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import '@/App.css';

const useScrollReveal = () => {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    const attach = () => document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    attach();
    const timer = setTimeout(attach, 500);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, []);
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

function AppWithReveal() {
  useScrollReveal();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/analyzer" element={<ModuleAnalyzer />} />
      <Route path="/progress" element={<ProgressTracker />} />
      <Route path="/ca/:slug" element={<CAPublicChat />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/gst-assistant" element={<ProtectedRoute><GSTAssistant /></ProtectedRoute>} />
      <Route path="/invoice" element={<ProtectedRoute><InvoiceEngine /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppWithReveal />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
