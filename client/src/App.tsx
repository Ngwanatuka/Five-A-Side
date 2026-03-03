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

        <Route path="/referee" element={<MatchDayConsole />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
