import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider, useRole } from './context/RoleContext';
import { RoleSelectModal } from './components/RoleSelectModal';
import { LockedTab } from './components/LockedTab';

import { Home } from './pages/Home';
import { Standings } from './pages/Standings';
import { Fixtures } from './pages/Fixtures';
import { Results } from './pages/Results';
import { Teams } from './pages/Teams';
import { Payments } from './pages/Payments';
import { Register } from './pages/Register';
import { DenchDerby } from './pages/DenchDerby';
import { MatchDayConsole } from './pages/MatchDayConsole';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

// Route for root: Admin sees Home, all other roles are directed directly to /dench-derby
const HomeRoute = () => {
  const { role } = useRole();
  if (role === 'ADMIN') {
    return <Home />;
  }
  return <Navigate to="/dench-derby" replace />;
};

// Route wrapper that locks regular league tabs for non-admin roles
const AdminTabRoute = ({ children, tabName }: { children: React.ReactNode; tabName: string }) => {
  const { role } = useRole();
  if (role === 'ADMIN') {
    return <>{children}</>;
  }
  return <LockedTab tabName={tabName} />;
};

function App() {
  return (
    <Router>
      <RoleProvider>
        <RoleSelectModal />
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/dench-derby" element={<DenchDerby />} />
          <Route path="/standings" element={<AdminTabRoute tabName="Standings"><Standings /></AdminTabRoute>} />
          <Route path="/fixtures" element={<AdminTabRoute tabName="Fixtures"><Fixtures /></AdminTabRoute>} />
          <Route path="/results" element={<AdminTabRoute tabName="Results"><Results /></AdminTabRoute>} />
          <Route path="/teams" element={<AdminTabRoute tabName="Teams"><Teams /></AdminTabRoute>} />
          <Route path="/register" element={<AdminTabRoute tabName="Registration"><Register /></AdminTabRoute>} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['REFEREE', 'ADMIN']} />}>
            <Route path="/referee" element={<MatchDayConsole />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/payments" element={<Payments />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </RoleProvider>
    </Router>
  );
}

export default App;
