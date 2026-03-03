import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Home } from './pages/Home';
import { Standings } from './pages/Standings';
import { Fixtures } from './pages/Fixtures';
import { Results } from './pages/Results';
import { Teams } from './pages/Teams';
import { Payments } from './pages/Payments';
import { Register } from './pages/Register';
import { MatchDayConsole } from './pages/MatchDayConsole';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/results" element={<Results />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['REFEREE', 'ADMIN']} />}>
          <Route path="/referee" element={<MatchDayConsole />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['CASHIER', 'ADMIN']} />}>
          <Route path="/payments" element={<Payments />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
