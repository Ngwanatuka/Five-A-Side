import { Navbar } from './Navbar';
import { Lock, ArrowRight, ShieldCheck, Flame, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

interface LockedTabProps {
    tabName: string;
}

export const LockedTab = ({ tabName }: LockedTabProps) => {
    const { openRoleModal } = useRole();

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content flex-center" style={{ minHeight: 'calc(100vh - 120px)', padding: '2rem 1rem' }}>
                <div 
                    className="glass-card" 
                    style={{ 
                        maxWidth: '560px', 
                        width: '100%', 
                        padding: '3rem 2rem', 
                        textAlign: 'center',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Glowing background accent */}
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    {/* Big Lock Badge */}
                    <div style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '1.25rem',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        border: '2px solid rgba(245, 158, 11, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 0 25px rgba(245, 158, 11, 0.2)'
                    }}>
                        <Lock size={38} color="#f59e0b" />
                    </div>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '1rem'
                    }}>
                        <Flame size={14} color="#f59e0b" /> Dench Derby Tournament Mode
                    </div>

                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>
                        {tabName} Tab Locked
                    </h1>

                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '460px', margin: '0 auto 2rem auto' }}>
                        All other league tabs are currently locked for players, captains, and visitors. 
                        All active matches, group standings, club rosters, and live scores are running on the <strong>Dench Derby</strong> tournament page.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <NavLink 
                            to="/dench-derby" 
                            className="btn btn-primary"
                            style={{
                                padding: '0.95rem 1.5rem',
                                fontSize: '1.05rem',
                                fontWeight: 800,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.6rem',
                                backgroundColor: 'var(--color-primary)',
                                color: '#050505',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        >
                            <Sparkles size={18} /> Enter Dench Derby Tournament <ArrowRight size={18} />
                        </NavLink>

                        <button
                            type="button"
                            onClick={openRoleModal}
                            className="btn btn-secondary"
                            style={{
                                padding: '0.75rem 1rem',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--color-border)',
                                color: 'white',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer'
                            }}
                        >
                            <ShieldCheck size={16} color="#a855f7" /> Switch to Admin to Unlock All Tabs
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
