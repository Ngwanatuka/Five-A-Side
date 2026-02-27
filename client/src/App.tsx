import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, Trophy, Users } from 'lucide-react';

// Placeholder Pages
const PublicStandings = () => (
  <div className="animate-fade-in">
    <h1 className="gradient-text">League Log</h1>
    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Live standings across all divisions.</p>
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>Tigers FC</strong></td>
              <td>7</td>
              <td>5</td>
              <td>1</td>
              <td>1</td>
              <td>+12</td>
              <td style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>16</td>
            </tr>
            <tr>
              <td>2</td>
              <td><strong>Lions Utd</strong></td>
              <td>7</td>
              <td>4</td>
              <td>2</td>
              <td>1</td>
              <td>+8</td>
              <td style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>14</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="animate-fade-in">
    <h1 className="gradient-text">Admin Dashboard</h1>
    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Manage teams, seasons, and divisions.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3><Users size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--color-accent)' }} /> Pending Registrations</h3>
        <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0' }}>Approve teams for the upcoming Winter 2026 season.</p>
        <button className="btn btn-secondary">Review Teams</button>
      </div>
    </div>
  </div>
);

const MatchDayConsole = () => (
  <div className="animate-fade-in">
    <h1 className="gradient-text">Match Day Console</h1>
    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Referee portal for live updates and roster checks.</p>
    <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Tigers FC vs Lions Utd</h3>
        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>LIVE</span>
      </div>
      <div style={{ display: 'flex', gap: '2rem', margin: '2rem 0', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '3rem', fontWeight: 800 }}>2</div>
        <div style={{ color: 'var(--color-text-muted)' }}>-</div>
        <div style={{ fontSize: '3rem', fontWeight: 800 }}>1</div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="btn btn-secondary">Update Tigers</button>
        <button className="btn btn-secondary">Update Lions</button>
      </div>
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button className="btn btn-primary" style={{ width: '100%' }}>Final Whistle</button>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>
            <Activity color="var(--color-primary)" />
            <span>5-a-Side Pro</span>
          </div>
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Trophy size={18} style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} /> Standings
            </NavLink>
            <NavLink to="/referee" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Activity size={18} style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} /> Match Day
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <LayoutDashboard size={18} style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} /> Admin Admin
            </NavLink>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<PublicStandings />} />
            <Route path="/referee" element={<MatchDayConsole />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
