import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { getPublicCaptains, getStoredOrFallbackCaptains, DEFAULT_CAPTAINS, API_BASE_URL, getBackendUrl } from '../services/api';
import { io } from 'socket.io-client';
import {
    ChevronRight,
    AlertCircle,
    X,
    Sparkles,
    CalendarClock
} from 'lucide-react';

export const RoleSelectModal: React.FC = () => {
    const {
        isRoleModalOpen,
        closeRoleModal,
        loginAsSpectator,
        loginAsCaptain,
        setAuthSession,
        deadlineRemaining,
        isPastDeadline
    } = useRole();

    const navigate = useNavigate();

    // Active sub-view inside the modal: 'choose' | 'captain' | 'referee' | 'admin'
    const [view, setView] = useState<'choose' | 'captain' | 'referee' | 'admin'>('choose');

    // Captain selection state - initialized with stored/fallback teams so dropdown is NEVER empty
    const [captainsList, setCaptainsList] = useState<any[]>(() => getStoredOrFallbackCaptains());
    const [selectedTeamKey, setSelectedTeamKey] = useState<string>('team-dench');
    const [captainPin, setCaptainPin] = useState<string>('1111');
    const [captainError, setCaptainError] = useState<string | null>(null);
    const [captainLoading, setCaptainLoading] = useState<boolean>(false);

    // Referee / Admin login state
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('password123');
    const [authError, setAuthError] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(false);

    useEffect(() => {
        if (isRoleModalOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            // Cleanse any legacy cached mock captain names in localStorage
            try {
                const MOCK_NAMES = new Set(['bafana sithole', 'mo hendricks', 'thabo dlamini', 'sipho zulu', 'mandla nkosi', 'kagiso molefe']);
                const rawPlayers = localStorage.getItem('dench_derby_players_v4');
                if (rawPlayers) {
                    const parsedP = JSON.parse(rawPlayers);
                    if (Array.isArray(parsedP) && parsedP.some(p => p?.name && MOCK_NAMES.has(p.name.toLowerCase().trim()))) {
                        localStorage.removeItem('dench_derby_players_v4');
                    }
                }
                const rawTeams = localStorage.getItem('dench_derby_teams_v4');
                if (rawTeams) {
                    const parsed = JSON.parse(rawTeams);
                    let changed = false;
                    Object.keys(parsed).forEach(k => {
                        if (parsed[k]?.captain) {
                            delete parsed[k].captain;
                            changed = true;
                        }
                        if (parsed[k]?.captainName && MOCK_NAMES.has(parsed[k].captainName.toLowerCase().trim())) {
                            delete parsed[k].captainName;
                            changed = true;
                        }
                    });
                    if (changed) localStorage.setItem('dench_derby_teams_v4', JSON.stringify(parsed));
                }
            } catch {}

            const fetchCaptains = () => {
                getPublicCaptains()
                    .then(list => {
                        if (Array.isArray(list) && list.length > 0) {
                            setCaptainsList(list);
                            setSelectedTeamKey(prev => {
                                const stillExists = list.some(c => c.teamKey === prev);
                                return stillExists ? prev : list[0].teamKey;
                            });
                        }
                    })
                    .catch(() => {});
            };

            fetchCaptains();

            // Real-time synchronization: when a captain is changed in squad roster on any device, update dropdown instantly
            const socket = io(getBackendUrl());
            socket.on('captainsUpdated', fetchCaptains);
            socket.on('playerUpdated', fetchCaptains);
            socket.on('derbyUpdate', fetchCaptains);

            return () => {
                socket.off('captainsUpdated', fetchCaptains);
                socket.off('playerUpdated', fetchCaptains);
                socket.off('derbyUpdate', fetchCaptains);
                socket.disconnect();
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isRoleModalOpen]);

    useEffect(() => {
        if (view === 'captain' && (!captainsList || captainsList.length === 0)) {
            setCaptainsList(getStoredOrFallbackCaptains());
        }
    }, [view, captainsList]);

    if (!isRoleModalOpen) return null;

    // Handle Captain PIN submit
    const handleCaptainSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCaptainError(null);
        setCaptainLoading(true);

        try {
            await loginAsCaptain(selectedTeamKey, captainPin);
            // After captain login, take them to Dench Derby tournament page to manage their team
            navigate('/dench-derby');
        } catch (err: any) {
            setCaptainError(err.message || 'Incorrect PIN for this team');
        } finally {
            setCaptainLoading(false);
        }
    };

    // Quick demo captain login
    const handleQuickCaptainDemo = async (teamKey: string, demoPin: string) => {
        setSelectedTeamKey(teamKey);
        setCaptainPin(demoPin);
        setCaptainLoading(true);
        setCaptainError(null);
        try {
            await loginAsCaptain(teamKey, demoPin);
            navigate('/dench-derby');
        } catch (err: any) {
            setCaptainError(err.message);
        } finally {
            setCaptainLoading(false);
        }
    };

    // Handle Referee / Admin standard login
    const handleCredentialLogin = async (expectedRole: 'REFEREE' | 'ADMIN') => {
        setAuthError(null);
        setAuthLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Verify user has the expected role (or is ADMIN accessing referee)
            if (expectedRole === 'REFEREE' && data.user.role !== 'REFEREE' && data.user.role !== 'ADMIN') {
                throw new Error('This account does not have Referee access permissions.');
            }
            if (expectedRole === 'ADMIN' && data.user.role !== 'ADMIN') {
                throw new Error('This account does not have League Administrator permissions.');
            }

            setAuthSession(data.token, data.user.role, { email: data.user.email });

            if (data.user.role === 'REFEREE') {
                const assignedPitch = (email.toLowerCase().includes('referee2') || email.toLowerCase().includes('admin@5aside')) ? 2 : 1;
                localStorage.setItem('referee_pitch_station', String(assignedPitch));
                // Rule 2: When a referee logs in they are redirected to the referee side
                navigate('/referee');
            } else if (data.user.role === 'ADMIN') {
                // Rule 1: Admin has access to everything
                navigate('/admin');
            }
        } catch (err: any) {
            setAuthError(err.message || 'Login failed');
        } finally {
            setAuthLoading(false);
        }
    };

    // 1-Click Demo Logins for immediate testing
    const handleDemoRefereeLogin = async (pitch: 1 | 2 = 1) => {
        const refEmail = pitch === 1 ? 'referee1@5aside.com' : 'referee2@5aside.com';
        setEmail(refEmail);
        setPassword('password123');
        setAuthError(null);
        setAuthLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: refEmail, password: 'password123' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('referee_pitch_station', String(pitch));
            setAuthSession(data.token, 'REFEREE', { email: refEmail });
            navigate('/referee');
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleDemoAdminLogin = async () => {
        setEmail('ngwanatuka@fivesway.xyz');
        setPassword('password123');
        setAuthError(null);
        setAuthLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'ngwanatuka@fivesway.xyz', password: 'password123' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            setAuthSession(data.token, 'ADMIN', { email: 'ngwanatuka@fivesway.xyz' });
            navigate('/admin');
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    closeRoleModal();
                }
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                minHeight: '100vh',
                height: '100dvh',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(0.5rem, 2.5vw, 1.25rem)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y'
            }}
        >
            <div style={{
                backgroundColor: '#0d1117',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '1.25rem',
                width: '100%',
                maxWidth: view === 'choose' ? '860px' : '520px',
                maxHeight: 'min(92vh, 92dvh)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
                position: 'relative',
                animation: 'fadeIn 0.25s ease-out',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto',
                overflow: 'hidden'
            }}>
                {/* Close Button (if role already set) */}
                <button
                    onClick={closeRoleModal}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                        zIndex: 20
                    }}
                    title="Close"
                >
                    <X size={18} />
                </button>

                {/* SCROLLABLE INNER BODY FOR PHONES & DESKTOPS */}
                <div
                    className="role-modal-scroll"
                    style={{
                        padding: 'clamp(1rem, 3.5vw, 2.25rem)',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y',
                        flex: 1,
                        width: '100%'
                    }}
                >
                    {/* VIEW 1: ROLE SELECTION (SIMPLE & CHILD FRIENDLY) */}
                    {view === 'choose' && (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingRight: '1.5rem' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    padding: '0.35rem 0.85rem',
                                    borderRadius: '999px',
                                    fontSize: '0.85rem',
                                    color: 'var(--color-primary)',
                                    fontWeight: 600,
                                    marginBottom: '0.5rem'
                                }}>
                                    <Sparkles size={14} /> 5-A-Side Soccer Platform
                                </div>
                                <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'white' }}>
                                    Who Are You? ⚽
                                </h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', margin: 0 }}>
                                    Pick your role to get started. Even a child can navigate with ease!
                                </p>
                            </div>

                            {/* 4 Big Role Cards Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.25rem'
                            }}>
                            {/* CARD 1: PARTICIPANT / PLAYER */}
                            <div
                                onClick={() => {
                                    loginAsSpectator();
                                    navigate('/dench-derby');
                                }}
                                style={{
                                    backgroundColor: 'rgba(34, 197, 94, 0.06)',
                                    border: '2px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '1rem',
                                    padding: 'clamp(1rem, 2.5vw, 1.4rem)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, border-color 0.2s, background-color 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    textAlign: 'left',
                                    touchAction: 'pan-y',
                                    WebkitTapHighlightColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                                    e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.06)';
                                }}
                            >
                                <div>
                                    <div style={{
                                        display: 'inline-block',
                                        backgroundColor: '#10b981',
                                        color: '#050505',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '999px',
                                        marginBottom: '1rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        No Login Needed!
                                    </div>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚽</div>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'white' }}>
                                        Fan / Player
                                    </h3>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.45', margin: '0 0 1rem 0' }}>
                                        View match fixtures, live scores, standings, and game logs. Read-only mode.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    Browse Platform <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* CARD 2: TEAM CAPTAIN */}
                            <div
                                onClick={() => setView('captain')}
                                style={{
                                    backgroundColor: 'rgba(245, 158, 11, 0.06)',
                                    border: '2px solid rgba(245, 158, 11, 0.35)',
                                    borderRadius: '1rem',
                                    padding: 'clamp(1rem, 2.5vw, 1.4rem)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, border-color 0.2s, background-color 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    textAlign: 'left',
                                    touchAction: 'pan-y',
                                    WebkitTapHighlightColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = '#f59e0b';
                                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.06)';
                                }}
                            >
                                <div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        backgroundColor: '#f59e0b',
                                        color: '#050505',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '999px',
                                        marginBottom: '1rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        <CalendarClock size={12} /> Edit Until 28 Oct 18:30
                                    </div>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧢</div>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'white' }}>
                                        Team Captain
                                    </h3>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.45', margin: '0 0 0.5rem 0' }}>
                                        Edit your team roster & add squad players. Protected by 4-digit PIN set by Admin.
                                    </p>
                                    <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600, marginBottom: '1rem' }}>
                                        ⏳ {isPastDeadline ? 'Roster locked' : `${deadlineRemaining} left`}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        borderRadius: 'var(--radius-sm)',
                                        border: 'none',
                                        backgroundColor: '#f59e0b',
                                        color: '#050505',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Captain Login <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* CARD 3: REFEREE */}
                            <div
                                onClick={() => {
                                    setEmail('referee@5aside.com');
                                    setView('referee');
                                }}
                                style={{
                                    backgroundColor: 'rgba(6, 182, 212, 0.06)',
                                    border: '2px solid rgba(6, 182, 212, 0.35)',
                                    borderRadius: '1rem',
                                    padding: 'clamp(1rem, 2.5vw, 1.4rem)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, border-color 0.2s, background-color 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    textAlign: 'left',
                                    touchAction: 'pan-y',
                                    WebkitTapHighlightColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = '#06b6d4';
                                    e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)';
                                    e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.06)';
                                }}
                            >
                                <div>
                                    <div style={{
                                        display: 'inline-block',
                                        backgroundColor: '#06b6d4',
                                        color: '#050505',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '999px',
                                        marginBottom: '1rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        Officials Only
                                    </div>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏱️</div>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'white' }}>
                                        Referee
                                    </h3>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.45', margin: '0 0 1rem 0' }}>
                                        Match day console, live match timer, whistle, card tracking & score recording.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        borderRadius: 'var(--radius-sm)',
                                        border: 'none',
                                        backgroundColor: '#06b6d4',
                                        color: '#050505',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Referee Portal <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* CARD 4: LEAGUE ADMIN */}
                            <div
                                onClick={() => {
                                    setEmail('ngwanatuka@fivesway.xyz');
                                    setView('admin');
                                }}
                                style={{
                                    backgroundColor: 'rgba(168, 85, 247, 0.06)',
                                    border: '2px solid rgba(168, 85, 247, 0.35)',
                                    borderRadius: '1rem',
                                    padding: 'clamp(1rem, 2.5vw, 1.4rem)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, border-color 0.2s, background-color 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    textAlign: 'left',
                                    touchAction: 'pan-y',
                                    WebkitTapHighlightColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = '#a855f7';
                                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
                                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.06)';
                                }}
                            >
                                <div>
                                    <div style={{
                                        display: 'inline-block',
                                        backgroundColor: '#a855f7',
                                        color: '#ffffff',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '999px',
                                        marginBottom: '1rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        Full Control
                                    </div>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👑</div>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'white' }}>
                                        League Admin
                                    </h3>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.45', margin: '0 0 1rem 0' }}>
                                        Complete access to everything: manage teams, assign captains, referees, fixtures & finances.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        borderRadius: 'var(--radius-sm)',
                                        border: 'none',
                                        backgroundColor: '#a855f7',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Admin Dashboard <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Informative Footer note */}
                        <div style={{
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            color: 'var(--color-text-muted)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingTop: '1rem'
                        }}>
                            ⚽ You can switch your role at any time from the top bar!
                        </div>
                    </div>
                )}

                {/* VIEW 2: CAPTAIN PIN LOGIN */}
                {view === 'captain' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setView('choose')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: 0
                                }}
                            >
                                ← Back
                            </button>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                                🧢 Team Captain Access
                            </h3>
                        </div>

                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Only Admin can assign captains and PINs. Select your team and enter your 4-digit PIN to edit your squad.
                        </p>

                        <form onSubmit={handleCaptainSubmit}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Select Your Team:
                                </label>
                                {(() => {
                                    const displayList = (captainsList && captainsList.length > 0) ? captainsList : DEFAULT_CAPTAINS;
                                    return (
                                        <select
                                            value={selectedTeamKey}
                                            onChange={(e) => {
                                                const newKey = e.target.value;
                                                setSelectedTeamKey(newKey);
                                                // Auto-fill demo PIN for convenience
                                                const found = displayList.find(c => c.teamKey === newKey);
                                                if (found?.pin) {
                                                    setCaptainPin(found.pin);
                                                } else {
                                                    if (newKey === 'team-dench') setCaptainPin('1111');
                                                    else if (newKey === 'cpt-superstars') setCaptainPin('2222');
                                                    else if (newKey === 'bras-ba-kasi') setCaptainPin('3333');
                                                    else if (newKey === 'gauteng-warriors') setCaptainPin('4444');
                                                    else if (newKey === 'woza-madzala') setCaptainPin('5555');
                                                    else if (newKey === 'areyeng-fc') setCaptainPin('6666');
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem 1rem',
                                                backgroundColor: '#161b22',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'white',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                colorScheme: 'dark'
                                            }}
                                        >
                                            {displayList.map(c => {
                                                const captainDisplay = c.captainName
                                                    ? `(Captain: ${c.captainName})`
                                                    : '(No Captain Assigned)';
                                                return (
                                                    <option key={c.teamKey} value={c.teamKey} style={{ backgroundColor: '#161b22', color: 'white' }}>
                                                        {c.teamName} {captainDisplay}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    );
                                })()}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Captain 4-Digit PIN:
                                </label>
                                <input
                                    type="password"
                                    maxLength={8}
                                    value={captainPin}
                                    onChange={(e) => setCaptainPin(e.target.value)}
                                    placeholder="Enter PIN (e.g. 1111)"
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        fontSize: '1.25rem',
                                        letterSpacing: '0.2rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {captainError && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid #ef4444',
                                    color: '#f87171',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <AlertCircle size={16} /> {captainError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={captainLoading}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    backgroundColor: '#f59e0b',
                                    color: '#050505',
                                    cursor: captainLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {captainLoading ? 'Verifying PIN...' : 'Log In as Captain ➔'}
                            </button>
                        </form>


                    </div>
                )}

                {/* VIEW 3: REFEREE LOGIN */}
                {view === 'referee' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setView('choose')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: 0
                                }}
                            >
                                ← Back
                            </button>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4' }}>
                                ⏱️ Referee Login
                            </h3>
                        </div>

                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            When a referee logs in, you will be redirected straight to the Referee Match Day Console.
                        </p>

                        <form onSubmit={(e) => { e.preventDefault(); handleCredentialLogin('REFEREE'); }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                                    Referee Email:
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="referee@5aside.com"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                                    Password:
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="password123"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {authError && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid #ef4444',
                                    color: '#f87171',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem'
                                }}>
                                    {authError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={authLoading}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    backgroundColor: '#06b6d4',
                                    color: '#050505',
                                    cursor: authLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {authLoading ? 'Signing in...' : 'Sign In to Match Console ➔'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.65rem' }}>
                                Two matches are officiated by two separate referees simultaneously:
                            </p>
                            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => handleDemoRefereeLogin(1)}
                                    style={{
                                        background: 'rgba(34, 197, 94, 0.12)',
                                        border: '1px solid #22c55e',
                                        color: '#22c55e',
                                        padding: '0.55rem 0.85rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                    }}
                                >
                                    ⚡ Referee 1 (Pitch 1)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDemoRefereeLogin(2)}
                                    style={{
                                        background: 'rgba(6, 182, 212, 0.12)',
                                        border: '1px solid #06b6d4',
                                        color: '#06b6d4',
                                        padding: '0.55rem 0.85rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                    }}
                                >
                                    ⚡ Referee 2 (Pitch 2)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 4: ADMIN LOGIN */}
                {view === 'admin' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setView('choose')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: 0
                                }}
                            >
                                ← Back
                            </button>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#a855f7' }}>
                                👑 League Admin Portal
                            </h3>
                        </div>

                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Designated league administrator (<strong style={{ color: '#c084fc' }}>ngwanatuka@fivesway.xyz</strong>) has full administrative controls: manage teams, scores, referee assignments & payments.
                        </p>

                        <form onSubmit={(e) => { e.preventDefault(); handleCredentialLogin('ADMIN'); }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                                    Admin Email:
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ngwanatuka@fivesway.xyz"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                                    Password:
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="password123"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {authError && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid #ef4444',
                                    color: '#f87171',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem'
                                }}>
                                    {authError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={authLoading}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    backgroundColor: '#a855f7',
                                    color: '#ffffff',
                                    cursor: authLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {authLoading ? 'Verifying...' : 'Sign In as Admin ➔'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={handleDemoAdminLogin}
                                style={{
                                    background: 'none',
                                    border: '1px solid #a855f7',
                                    color: '#c084fc',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                ⚡ 1-Click Demo Admin Login
                            </button>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};
