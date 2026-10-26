import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { 
    API_BASE_URL, 
    getPublicCaptains, 
    getStoredOrFallbackCaptains, 
    DEFAULT_CAPTAINS, 
    type PublicCaptain 
} from '../services/api';
import { useRole, type UserRole } from '../context/RoleContext';
import { Sparkles, AlertCircle } from 'lucide-react';

export function Login() {
    // Mode tabs: 'captain' | 'staff' (Admin/Referee)
    const [tab, setTab] = useState<'captain' | 'staff'>('captain');

    // Admin / Referee form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Captain form state
    const [captainsList, setCaptainsList] = useState<PublicCaptain[]>(() => getStoredOrFallbackCaptains());
    const [selectedTeamKey, setSelectedTeamKey] = useState<string>('team-dench');
    const [captainPin, setCaptainPin] = useState<string>('1111');
    const [captainError, setCaptainError] = useState('');
    const [captainLoading, setCaptainLoading] = useState(false);

    const navigate = useNavigate();
    const { role, setAuthSession, loginAsCaptain, openRoleModal } = useRole();

    useEffect(() => {
        if (role === 'REFEREE') navigate('/referee');
        else if (role === 'ADMIN') navigate('/admin');
        else if (role === 'CAPTAIN') navigate('/dench-derby');
    }, [role, navigate]);

    useEffect(() => {
        getPublicCaptains()
            .then(list => {
                if (Array.isArray(list) && list.length > 0) {
                    setCaptainsList(list);
                    setSelectedTeamKey(prev => {
                        const exists = list.some(c => c.teamKey === prev);
                        return exists ? prev : list[0].teamKey;
                    });
                }
            })
            .catch(() => {});
    }, []);

    const handleStaffLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            setAuthSession(data.token, data.user.role as UserRole, { email: data.user.email });

            if (data.user.role === 'REFEREE') navigate('/referee');
            else if (data.user.role === 'ADMIN') navigate('/admin');
            else navigate('/');

        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCaptainLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCaptainError('');
        setCaptainLoading(true);

        try {
            await loginAsCaptain(selectedTeamKey, captainPin);
            navigate('/dench-derby');
        } catch (err: any) {
            setCaptainError(err.message || 'Incorrect PIN for this team');
        } finally {
            setCaptainLoading(false);
        }
    };

    const handleQuickCaptain = async (teamKey: string, pin: string) => {
        setSelectedTeamKey(teamKey);
        setCaptainPin(pin);
        setCaptainError('');
        setCaptainLoading(true);

        try {
            await loginAsCaptain(teamKey, pin);
            navigate('/dench-derby');
        } catch (err: any) {
            setCaptainError(err.message || 'Login failed');
        } finally {
            setCaptainLoading(false);
        }
    };

    const handleDemoStaffLogin = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword('password123');
    };

    const displayTeams = captainsList.length > 0 ? captainsList : DEFAULT_CAPTAINS;

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content flex-center animate-fade-in" style={{ flex: 1, flexDirection: 'column', padding: '2rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Portal Sign In</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                        {tab === 'captain' 
                            ? 'Manage your tournament roster, squad numbers, and starting lineup' 
                            : 'Access League Admin or Referee Match Console'}
                    </p>
                </div>

                <div className="glass-card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', width: '100%', maxWidth: '480px' }}>
                    {/* Role Switcher Tabs */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        marginBottom: '1.75rem', 
                        padding: '0.25rem', 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <button
                            type="button"
                            onClick={() => setTab('captain')}
                            style={{
                                flex: 1,
                                padding: '0.65rem 0.5rem',
                                borderRadius: 'var(--radius-xs, 4px)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: tab === 'captain' ? '#f59e0b' : 'transparent',
                                color: tab === 'captain' ? '#050505' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            🧢 Team Captain
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('staff')}
                            style={{
                                flex: 1,
                                padding: '0.65rem 0.5rem',
                                borderRadius: 'var(--radius-xs, 4px)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: tab === 'staff' ? 'var(--color-primary)' : 'transparent',
                                color: tab === 'staff' ? '#050505' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            🛡️ Admin / Ref
                        </button>
                    </div>

                    {/* TAB 1: CAPTAIN LOGIN */}
                    {tab === 'captain' && (
                        <div>
                            <form onSubmit={handleCaptainLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        Select Your Team:
                                    </label>
                                    <select
                                        value={selectedTeamKey}
                                        onChange={(e) => {
                                            const newKey = e.target.value;
                                            setSelectedTeamKey(newKey);
                                            const found = displayTeams.find(c => c.teamKey === newKey);
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
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: '#161b22',
                                            color: 'white',
                                            outline: 'none',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            colorScheme: 'dark'
                                        }}
                                    >
                                        {displayTeams.map(c => (
                                            <option key={c.teamKey} value={c.teamKey} style={{ backgroundColor: '#161b22', color: 'white' }}>
                                                {c.teamName} (Captain: {c.captainName || 'Assigned'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        Captain 4-Digit PIN:
                                    </label>
                                    <input
                                        type="password"
                                        maxLength={8}
                                        required
                                        value={captainPin}
                                        onChange={(e) => setCaptainPin(e.target.value)}
                                        placeholder="1111"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            color: 'white',
                                            outline: 'none',
                                            fontSize: '1.25rem',
                                            letterSpacing: '0.2rem'
                                        }}
                                    />
                                </div>

                                {captainError && (
                                    <div className="animate-fade-in" style={{ 
                                        color: '#ef4444', 
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                        padding: '0.75rem', 
                                        borderRadius: 'var(--radius-sm)', 
                                        fontSize: '0.85rem',
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
                                        padding: '0.85rem', 
                                        marginTop: '0.25rem',
                                        backgroundColor: '#f59e0b',
                                        color: '#050505',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        cursor: captainLoading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {captainLoading ? 'Verifying PIN...' : 'Log In as Captain ➔'}
                                </button>
                            </form>

                            {/* 1-Click Demo Captain Logins */}
                            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.6rem', fontWeight: 600 }}>
                                    ⚡ 1-Click Demo Captain Accounts:
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickCaptain('team-dench', '1111')}
                                        style={{ backgroundColor: 'rgba(18, 184, 76, 0.15)', border: '1px solid #12b84c', color: '#4ade80', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                        Dench City FC (1111)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickCaptain('cpt-superstars', '2222')}
                                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                        BARCODE FC (2222)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickCaptain('bras-ba-kasi', '3333')}
                                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                        GSW FC (3333)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickCaptain('gauteng-warriors', '4444')}
                                        style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8b5cf6', color: '#c084fc', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                        Mambisa FC (4444)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickCaptain('woza-madzala', '5555')}
                                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                        Ayoba fc (5555)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickCaptain('areyeng-fc', '6666')}
                                        style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', color: '#22d3ee', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                        Areyeng fc (6666)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: REFEREE / ADMIN LOGIN */}
                    {tab === 'staff' && (
                        <div>
                            <form onSubmit={handleStaffLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Email address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ngwanatuka@fivesway.xyz or referee@5aside.com"
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="password123"
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', outline: 'none' }}
                                    />
                                </div>

                                {error && (
                                    <div className="animate-fade-in" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                        {error}
                                    </div>
                                )}

                                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.25rem' }}>
                                    {loading ? 'Signing In...' : 'Sign In as Staff ➔'}
                                </button>
                            </form>

                            <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                                <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'white' }}>Quick Demo Accounts:</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleDemoStaffLogin('ngwanatuka@fivesway.xyz')}
                                        style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', color: '#c084fc', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                        Admin (ngwanatuka@fivesway.xyz)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDemoStaffLogin('referee@5aside.com')}
                                        style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', color: '#22d3ee', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                        Referee (referee@5aside.com)
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.75rem', margin: 0 }}>
                                    Password for all: <code style={{ color: 'var(--color-primary)' }}>password123</code>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quick Role Switcher Button */}
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={openRoleModal}
                            style={{
                                background: 'none',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                width: '100%',
                                padding: '0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            <Sparkles size={14} color="var(--color-primary)" />
                            Choose Role Modal (Player, Captain, Referee, Admin)
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
