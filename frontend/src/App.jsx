import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { ElderlyRoute } from './components/ElderlyRoute';
import { CaregiverRoute } from './components/CaregiverRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import { ElderlyDashboard } from './pages/elderly/ElderlyDashboard';
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard';

function App() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar onRequestQuote={() => setIsQuoteModalOpen(true)} />
          <main className="main-content">
            <Routes>
              <Route 
                path="/" 
                element={
                  <LandingPage 
                    isQuoteModalOpen={isQuoteModalOpen} 
                    setIsQuoteModalOpen={setIsQuoteModalOpen} 
                    onRequestQuote={() => setIsQuoteModalOpen(true)} 
                  />
                } 
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              {/* Elderly Portal — all features live here */}
              <Route
                path="/elderly/*"
                element={
                  <ElderlyRoute>
                    <ElderlyDashboard />
                  </ElderlyRoute>
                }
              />
              {/* Caregiver Portal — all features live here */}
              <Route
                path="/caregiver/*"
                element={
                  <CaregiverRoute>
                    <CaregiverDashboard />
                  </CaregiverRoute>
                }
              />
              {/* General fallback dashboard for other roles */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


