import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CareProvider } from './context/CareContext';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { ElderlyDashboardPage } from './pages/ElderlyDashboardPage';
import { CaregiverDashboardPage } from './pages/CaregiverDashboardPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { CareLoopPage } from './pages/CareLoopPage';
import { CareCirclePage } from './pages/CareCirclePage';
import { VoiceCarePage } from './pages/VoiceCarePage';
import { FamiliarVoiceStudioPage } from './pages/FamiliarVoiceStudioPage';
import { DoctorAppointmentsPage } from './pages/DoctorAppointmentsPage';
import { SharedCareTimelinePage } from './pages/SharedCareTimelinePage';
import { ProfilePage, ResetPasswordPage } from './pages/ProfilePage';
import { UserRole } from './types';

const ProtectedRoutes: React.FC = () => {
  const { authReady, isAuthenticated } = useAuth();
  if (!authReady) return <div role="status" className="p-8 text-center">Restoring your session...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const RequireRole: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({
  roles,
  children,
}) => {
  const { role } = useAuth();
  if (roles.includes(role)) return <>{children}</>;
  return <Navigate to={role === 'elderly' ? '/elderly-dashboard' : '/caregiver-dashboard'} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CareProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<WelcomePage />} />
              <Route path="welcome" element={<WelcomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route element={<ProtectedRoutes />}>
                <Route
                  path="elderly-dashboard"
                  element={<RequireRole roles={['elderly']}><ElderlyDashboardPage /></RequireRole>}
                />
                <Route
                  path="caregiver-dashboard"
                  element={<RequireRole roles={['caregiver', 'family', 'doctor']}><CaregiverDashboardPage /></RequireRole>}
                />
                <Route path="medications" element={<MedicationsPage />} />
                <Route path="care-loop" element={<CareLoopPage />} />
                <Route path="care-circle" element={<CareCirclePage />} />
                <Route path="voice-care" element={<VoiceCarePage />} />
                <Route path="voice-studio" element={<FamiliarVoiceStudioPage />} />
                <Route path="appointments" element={<DoctorAppointmentsPage />} />
                <Route path="timeline" element={<SharedCareTimelinePage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/welcome" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CareProvider>
    </AuthProvider>
  );
};

export default App;
