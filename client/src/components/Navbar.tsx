import { NavLink } from 'react-router-dom';
import { Trophy, Shield } from 'lucide-react';

export const Navbar = () => {
    return (
        <nav className="navbar">
            <NavLink to="/" className="nav-brand">
                <div className="nav-logo-icon">
                    <Trophy size={20} color="#050505" strokeWidth={2.5} />
                </div>
                <span>5-A-Side League</span>
            </NavLink>
            <div className="nav-links">
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
                <NavLink to="/standings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Standings</NavLink>
                <NavLink to="/fixtures" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Fixtures</NavLink>
                <NavLink to="/results" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Results</NavLink>
                <NavLink to="/teams" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Teams</NavLink>
                <NavLink to="/payments" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Payments</NavLink>
                <NavLink to="/register" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Register</NavLink>

                <NavLink to="/admin" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', marginLeft: '1rem' }}>
                    <Shield size={16} /> Admin
                </NavLink>
            </div>
        </nav>
    );
};
