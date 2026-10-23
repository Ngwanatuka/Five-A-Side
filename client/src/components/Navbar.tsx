import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Trophy, Shield, Menu, X, Flame, Timer, Crown, Lock } from 'lucide-react';
import { useRole } from '../context/RoleContext';

export const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { role, captainTeamName, openRoleModal, logout } = useRole();
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleRoleBadgeClick = () => {
        closeMenu();
        openRoleModal();
    };

    return (
        <nav className="navbar">
            <NavLink to={role === 'REFEREE' ? "/referee" : role === 'ADMIN' ? "/" : "/dench-derby"} className="nav-brand" onClick={closeMenu}>
                <div className="nav-logo-icon">
                    <Trophy size={20} color="#050505" strokeWidth={2.5} />
                </div>
                <span>5-A-Side League</span>
            </NavLink>
            
            <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle menu">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
                {/* When role is REFEREE: only referee console and dench-derby are accessible */}
                {role === 'REFEREE' ? (
                    <>
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
                        <NavLink to="/referee" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>
                            <Timer size={16} style={{ display: 'inline', marginRight: '6px' }} />
                            Match Day Console
                        </NavLink>
                    </>
                ) : role === 'ADMIN' ? (
                    // ADMIN: Full access to every tab
                    <>
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
                    </>
                ) : (
                    // SPECTATORS and CAPTAINS: Dench Derby is open, all other tabs locked
                    <>
                        <NavLink 
                            to="/dench-derby" 
                            className={({ isActive }) => isActive ? "nav-link active nav-link-derby" : "nav-link nav-link-derby"} 
                            onClick={closeMenu}
                        >
                            <span className="derby-nav-item">
                                <Flame size={14} color="#f59e0b" style={{ display: 'inline', marginRight: '4px' }} />
                                Dench Derby
                                <span className="derby-badge-pill">Live Tournament</span>
                            </span>
                        </NavLink>
                        <NavLink to="/standings" className="nav-link" onClick={closeMenu} style={{ opacity: 0.55, display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Tab locked for non-admins">
                            Standings <Lock size={12} color="#9ca3af" />
                        </NavLink>
                        <NavLink to="/fixtures" className="nav-link" onClick={closeMenu} style={{ opacity: 0.55, display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Tab locked for non-admins">
                            Fixtures <Lock size={12} color="#9ca3af" />
                        </NavLink>
                        <NavLink to="/results" className="nav-link" onClick={closeMenu} style={{ opacity: 0.55, display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Tab locked for non-admins">
                            Results <Lock size={12} color="#9ca3af" />
                        </NavLink>
                        <NavLink to="/teams" className="nav-link" onClick={closeMenu} style={{ opacity: 0.55, display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Tab locked for non-admins">
                            Teams <Lock size={12} color="#9ca3af" />
                        </NavLink>
                    </>
                )}

                {/* ROLE BADGE PILL (INTERACTIVE SWITCHER) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={handleRoleBadgeClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid transparent',
                            ...(role === 'ADMIN' && {
                                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                borderColor: '#a855f7',
                                color: '#c084fc'
                            }),
                            ...(role === 'REFEREE' && {
                                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                                borderColor: '#06b6d4',
                                color: '#22d3ee'
                            }),
                            ...(role === 'CAPTAIN' && {
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                borderColor: '#f59e0b',
                                color: '#fbbf24'
                            }),
                            ...(role === 'SPECTATOR' && {
                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                borderColor: 'rgba(34, 197, 94, 0.4)',
                                color: 'var(--color-primary)'
                            })
                        }}
                        title="Click to switch who you are"
                    >
                        {role === 'ADMIN' && (
                            <>
                                <Crown size={14} color="#c084fc" />
                                <span>👑 Admin</span>
                            </>
                        )}
                        {role === 'REFEREE' && (
                            <>
                                <Timer size={14} color="#22d3ee" />
                                <span>⏱️ Referee</span>
                            </>
                        )}
                        {role === 'CAPTAIN' && (
                            <>
                                <span>🧢 {captainTeamName ? `${captainTeamName}` : 'Captain'}</span>
                            </>
                        )}
                        {role === 'SPECTATOR' && (
                            <>
                                <span>⚽ Fan / Player</span>
                            </>
                        )}
                        <span style={{ opacity: 0.7, fontSize: '0.72rem', marginLeft: '2px' }}>(Switch)</span>
                    </button>

                    {/* Admin Dashboard shortcut */}
                    {role === 'ADMIN' && (
                        <NavLink to="/admin" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }} onClick={closeMenu}>
                            <Shield size={15} /> Admin Panel
                        </NavLink>
                    )}

                    {/* Referee direct link */}
                    {role === 'REFEREE' && (
                        <button
                            type="button"
                            onClick={() => { logout(); navigate('/'); }}
                            style={{
                                background: 'none',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'var(--color-text-muted)',
                                padding: '0.35rem 0.7rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            Exit
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};
