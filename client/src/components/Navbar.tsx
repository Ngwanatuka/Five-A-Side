import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, Shield, Menu, X, Flame } from 'lucide-react';

export const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <NavLink to="/" className="nav-brand" onClick={closeMenu}>
                <div className="nav-logo-icon">
                    <Trophy size={20} color="#050505" strokeWidth={2.5} />
                </div>
                <span>5-A-Side League</span>
            </NavLink>
            
            <button className="mobile-menu-btn" onClick={toggleMenu}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Home</NavLink>
                <NavLink 
                    to="/dench-derby" 
                    className={({ isActive }) => isActive ? "nav-link active nav-link-derby" : "nav-link nav-link-derby"} 
                    onClick={closeMenu}
                >
                    <span className="derby-nav-item">
                        <Flame size={14} color="#f59e0b" style={{ display: 'inline', marginRight: '4px' }} />
                        Dench Derby
                        <span className="derby-badge-pill">28 Oct</span>
                    </span>
                </NavLink>
                <NavLink to="/standings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Standings</NavLink>
                <NavLink to="/fixtures" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Fixtures</NavLink>
                <NavLink to="/results" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Results</NavLink>
                <NavLink to="/teams" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Teams</NavLink>
                <NavLink to="/payments" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Payments</NavLink>
                <NavLink to="/register" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Register</NavLink>

                <NavLink to="/admin" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', marginLeft: '1rem' }} onClick={closeMenu}>
                    <Shield size={16} /> Admin
                </NavLink>
            </div>
        </nav>
    );
};

