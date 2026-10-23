import { Outlet, useLocation } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { Navbar } from './Navbar';
import { Shield, Timer, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
    allowedRoles: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { role, openRoleModal } = useRole();
    const location = useLocation();

    // Check if current role is in allowed roles
    const isAllowed = allowedRoles.includes(role);

    if (!isAllowed) {
        const isRefereeRoute = location.pathname.startsWith('/referee');

        return (
            <div className="app-container">
                <Navbar />
                <main className="main-content flex-center" style={{ minHeight: 'calc(100vh - 120px)', padding: '2rem' }}>
                    <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '1rem',
                            backgroundColor: isRefereeRoute ? 'rgba(6, 182, 212, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            {isRefereeRoute ? (
                                <Timer size={32} color="#06b6d4" />
                            ) : (
                                <Shield size={32} color="#a855f7" />
                            )}
                        </div>

                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>
                            {isRefereeRoute ? 'Referee Area Only' : 'Admin Area Only'}
                        </h2>

                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                            {isRefereeRoute 
                                ? 'This console is reserved for match referees and officials. Switch to Referee to operate the match clock and scoring.'
                                : 'This dashboard is reserved for league administrators to manage teams, assign captains, and view finances.'
                            }
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={openRoleModal}
                                className="btn btn-primary"
                                style={{
                                    padding: '0.85rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    width: '100%'
                                }}
                            >
                                Switch Role / Log In ➔
                            </button>

                            <button
                                type="button"
                                onClick={() => window.location.href = '/'}
                                style={{
                                    background: 'none',
                                    border: '1px solid var(--color-border)',
                                    color: 'white',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.4rem'
                                }}
                            >
                                <ArrowLeft size={16} /> Return to Home
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return <Outlet />;
};
