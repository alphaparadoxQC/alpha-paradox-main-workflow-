import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Pages
import LandingScrollytellingPage from './pages/LandingScrollytellingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ComposerHomePage from './pages/ComposerHomePage';
import ComposerPage from './pages/ComposerPage';
import NotebookPage from './pages/NotebookPage';
import VQPUPage from './pages/VQPUPage';
import ResultsPage from './pages/ResultsPage';
import EdaPage from './pages/EdaPage';

// Quantum Domain Labs
import LabsHubPage from './pages/labs/LabsHubPage';
import QmlLabPage from './pages/labs/QmlLabPage';
import ChemistryLabPage from './pages/labs/ChemistryLabPage';
import OptimizationLabPage from './pages/labs/OptimizationLabPage';
import FinanceLabPage from './pages/labs/FinanceLabPage';
import CryptographyLabPage from './pages/labs/CryptographyLabPage';
import QecNoiseLabPage from './pages/labs/QecNoiseLabPage';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isResolved = false;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isResolved) return;
      isResolved = true;
      setSession(session);
      setLoading(false);
    }).catch(err => {
      if (isResolved) return;
      isResolved = true;
      console.error("Supabase auth error:", err);
      setLoading(false);
    });

    // Fallback: If Supabase hangs, forcefully bypass loading screen after 1 second.
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        setLoading(false);
      }
    }, 1000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* Visitors landing from Google or direct will see the Golden Dilution Refrigerator Scrollytelling Experience */}
        <Route path="/" element={<LandingScrollytellingPage />} />
        <Route path="/auth" element={<AuthPage session={session} />} />
        <Route path="/login" element={<AuthPage session={session} />} />
        <Route path="/home" element={<DashboardPage session={session} />} />
        <Route path="/dashboard" element={<DashboardPage session={session} />} />
        <Route path="/composer-home" element={<ComposerHomePage session={session} />} />
        <Route 
          path="/composer" 
          element={
            <ProtectedRoute session={session}>
              <ComposerPage session={session} />
            </ProtectedRoute>
          } 
        />
        <Route path="/preview-composer" element={<ComposerPage session={session} />} />
        <Route 
          path="/lab" 
          element={
            <ProtectedRoute session={session}>
              <NotebookPage session={session} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vqpu" 
          element={
            <ProtectedRoute session={session}>
              <VQPUPage session={session} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/results" 
          element={
            <ProtectedRoute session={session}>
              <ResultsPage session={session} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/eda" 
          element={
            <ProtectedRoute session={session}>
              <EdaPage session={session} />
            </ProtectedRoute>
          } 
        />

        {/* Quantum Domain Labs Hub & Workbenches */}
        <Route path="/labs" element={<LabsHubPage session={session} />} />
        <Route path="/labs/qml" element={<QmlLabPage session={session} />} />
        <Route path="/labs/chemistry" element={<ChemistryLabPage session={session} />} />
        <Route path="/labs/optimization" element={<OptimizationLabPage session={session} />} />
        <Route path="/labs/finance" element={<FinanceLabPage session={session} />} />
        <Route path="/labs/cryptography" element={<CryptographyLabPage session={session} />} />
        <Route path="/labs/qec" element={<QecNoiseLabPage session={session} />} />
        <Route path="/labs/qec-noise" element={<QecNoiseLabPage session={session} />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
