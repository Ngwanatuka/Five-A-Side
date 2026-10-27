import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Shield, Lock, LogOut, ChevronDown, Users, BadgeCheck, XCircle, Key, Clock, Save, CheckCircle2, AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { getAllFinances, getMatches, updateMatchScore, login as apiLogin, getAdminCaptains, updateCaptainAdmin, updateDeadlineAdmin, resetDerbyData } from '../services/api';
import { useRole } from '../context/RoleContext';
import { useToast, useConfirm } from '../components/Toast';

export const AdminDashboard = () => {
    const { role, setAuthSession, logout: roleLogout, openRoleModal, isPastDeadline, deadlineRemaining } = useRole();
    const { toast } = useToast();
    const { confirm, ConfirmUI } = useConfirm();
    const isAdmin = role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'Update Scores' | 'Manage Captains' | 'Player Payments' | 'Match Status' | 'Add Fixture'>('Update Scores');

    // Login Form State
    const [loginEmail, setLoginEmail] = useState('ngwanatuka@fivesway.xyz');
    const [loginPassword, setLoginPassword] = useState('password123');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Data states
    const [finances, setFinances] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccessMsg, setResetSuccessMsg] = useState('');

    const handleResetAllScores = async () => {
        if (!await confirm({
            message: 'This will reset all match scores, goals, and results back to scheduled (0-0) across all devices. Official teams and rosters will be preserved. Proceed?',
            confirmLabel: 'Reset Tournament',
            danger: true,
        })) {
            return;
        }
        setResetLoading(true);
        setResetSuccessMsg('');
        try {
            await resetDerbyData();
            setResetSuccessMsg('Tournament scores and match states have been successfully reset across all devices.');
            fetchAdminData();
            setTimeout(() => setResetSuccessMsg(''), 5000);
        } catch (err: any) {
            toast.error(err.message || 'Failed to reset tournament scores. Only Administrators have permission.');
        } finally {
            setResetLoading(false);
        }
    };

    // Score update form state
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');
    const [scoreMessage, setScoreMessage] = useState({ text: '', type: '' });
    const [isMatchDropdownOpen, setIsMatchDropdownOpen] = useState(false);

    // Captains management state
    const [captainsList, setCaptainsList] = useState<any[]>([]);
    const [captainsLoading, setCaptainsLoading] = useState(false);
    const [savingTeamKey, setSavingTeamKey] = useState<string | null>(null);
    const [captainSuccessMsg, setCaptainSuccessMsg] = useState('');
    const [captainErrorMsg, setCaptainErrorMsg] = useState('');
    const [adminDeadline, setAdminDeadline] = useState('2026-10-28T18:30:00+02:00');
    const [savingDeadline, setSavingDeadline] = useState(false);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const finData = await getAllFinances(1);
            setFinances(finData);

            const matchData = await getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING' });
            matchData.sort((a: any, b: any) => {
                const dateA = new Date(`${a.date.split('T')[0]}T${a.time}`);
                const dateB = new Date(`${b.date.split('T')[0]}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });
            setMatches(matchData);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCaptainsData = async () => {
        setCaptainsLoading(true);
        try {
            const res = await getAdminCaptains();
            if (res?.captains) {
                setCaptainsList(res.captains);
            }
            if (res?.deadline) {
                setAdminDeadline(res.deadline);
            }
        } catch (err: any) {
            console.error('Failed to fetch admin captains', err);
            setCaptainErrorMsg(err.message || 'Could not load captains');
        } finally {
            setCaptainsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchAdminData();
            fetchCaptainsData();
        }
    }, [isAdmin]);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        try {
            const res = await apiLogin({ email: loginEmail, password: loginPassword });
            if (res.user?.role !== 'ADMIN' || res.user?.email?.toLowerCase() !== 'ngwanatuka@fivesway.xyz') {
                throw new Error('Access denied: Only ngwanatuka@fivesway.xyz is authorized as League Administrator');
            }
            setAuthSession(res.token, 'ADMIN', { email: res.user.email });
        } catch (err: any) {
            setLoginError(err.message || 'Login failed. Check credentials.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleUpdateScore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatchId || homeScore === '' || awayScore === '') {
            setScoreMessage({ text: 'Please fill all fields', type: 'error' });
            return;
        }

        setActionLoading(true);
        try {
            await updateMatchScore(Number(selectedMatchId), Number(homeScore), Number(awayScore));
            setScoreMessage({ text: 'Score updated successfully', type: 'success' });
            setHomeScore('');
            setAwayScore('');
            setSelectedMatchId('');
            const matchData = await getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING' });
            setMatches(matchData);
        } catch (error: any) {
            setScoreMessage({ text: error.message || 'Failed to update score', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCaptainFieldChange = (teamKey: string, field: string, val: string) => {
        setCaptainsList(prev => prev.map(c => c.teamKey === teamKey ? { ...c, [field]: val } : c));
    };

    const handleSaveCaptain = async (teamKey: string) => {
        const item = captainsList.find(c => c.teamKey === teamKey);
        if (!item) return;

        setSavingTeamKey(teamKey);
        setCaptainSuccessMsg('');
        setCaptainErrorMsg('');
        try {
            await updateCaptainAdmin({
                teamKey: item.teamKey,
                captainName: item.captainName,
                email: item.email,
                pin: item.pin,
                teamName: item.teamName,
                group: item.group
            });
            setCaptainSuccessMsg(`Saved credentials for ${item.teamName}!`);
            setTimeout(() => setCaptainSuccessMsg(''), 4000);
        } catch (err: any) {
            setCaptainErrorMsg(err.message || 'Failed to update captain');
        } finally {
            setSavingTeamKey(null);
        }
    };

    const handleUpdateDeadline = async () => {
        setSavingDeadline(true);
        setCaptainSuccessMsg('');
        setCaptainErrorMsg('');
        try {
            await updateDeadlineAdmin(adminDeadline);
            setCaptainSuccessMsg('Squad roster deadline updated successfully!');
            setTimeout(() => setCaptainSuccessMsg(''), 4000);
        } catch (err: any) {
            setCaptainErrorMsg(err.message || 'Failed to update deadline');
        } finally {
            setSavingDeadline(false);
        }
    };

    // Calculate Finance Stats
    const totalRevenue = finances.reduce((sum, f) => sum + f.amountPaid, 0);
    const totalPlayers = finances.length;
    let paidCount = 0;
    let unpaidCount = 0;

    finances.forEach(f => {
        if (f.status === 'UNPAID') unpaidCount++;
        else paidCount++;
    });

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount);

    const getStatusStyle = (status: string) => {
        if (status === 'FULL_SEASON') return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' };
        if (status === 'HALF_SEASON') return { color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.1)', border: '1px solid rgba(202, 138, 4, 0.2)' };
        if (status === 'UNPAID') return { color: 'white', bg: '#ef4444', border: 'none', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 };
        return { color: 'var(--color-text-muted)', bg: 'transparent', border: '1px solid var(--color-border)' };
    };

    // NOT LOGGED IN AS ADMIN
    if (!isAdmin) {
        return (
            <div className="app-container">
                <Navbar />
                <ConfirmUI />

                <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div className="flex-center" style={{ width: '72px', height: '72px', backgroundColor: '#eab308', borderRadius: '1.25rem', margin: '0 auto 1.5rem auto', boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)' }}>
                            <Shield size={38} color="#050505" />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', fontWeight: 800 }}>Admin Portal</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '500px' }}>
                            Full administrative controls: manage all teams, scores, referee assignments, and captain PINs.
                        </p>
                    </div>

                    <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
                        <div style={{ marginBottom: '1.75rem' }}>
                            <h2 className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                <Lock size={20} color="#eab308" /> Administrator Login
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                Authorized Administrator: <strong style={{ color: '#eab308' }}>ngwanatuka@fivesway.xyz</strong>
                            </p>
                        </div>

                        {loginError && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                marginBottom: '1.25rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                fontSize: '0.85rem'
                            }}>
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleAdminLogin}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    placeholder="ngwanatuka@fivesway.xyz"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.75rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    fontSize: '1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    fontWeight: 700,
                                    backgroundColor: '#eab308',
                                    color: '#050505',
                                    cursor: loginLoading ? 'wait' : 'pointer'
                                }}
                            >
                                {loginLoading ? 'Authenticating...' : 'Sign In as Admin'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                            <button
                                type="button"
                                onClick={openRoleModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Or switch to Player / Referee role →
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // LOGGED IN AS ADMIN
    return (
        <div className="app-container">
            <Navbar />
            <ConfirmUI />

            <main className="main-content" style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>

                {/* Header section with Role Badge & Logout */}
                <div className="flex-between" style={{ marginBottom: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', backgroundColor: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                            <Shield size={28} color="#eab308" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800 }}>Admin Panel</h1>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '1rem',
                                    backgroundColor: '#eab308',
                                    color: '#050505',
                                    fontWeight: 800,
                                    textTransform: 'uppercase'
                                }}>
                                    Full Access
                                </span>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                                Manage match scores, assign captains and 4-digit PINs, and update registration deadlines.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={openRoleModal}
                            className="glass-card flex-center"
                            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', gap: '0.5rem', cursor: 'pointer', border: '1px solid var(--color-border)' }}
                        >
                            Switch Role
                        </button>
                        <button
                            onClick={roleLogout}
                            className="glass-card flex-center"
                            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', gap: '0.5rem', cursor: 'pointer', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >
                            <LogOut size={16} color="#ef4444" /> <span style={{ color: '#ef4444', fontWeight: 600 }}>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto', gap: '0.25rem' }}>
                    {(['Update Scores', 'Manage Captains', 'Player Payments', 'Match Status', 'Add Fixture'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                minWidth: '130px',
                                padding: '0.75rem',
                                backgroundColor: activeTab === tab ? 'var(--color-primary)' : 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                color: activeTab === tab ? '#050505' : 'var(--color-text-muted)',
                                fontWeight: activeTab === tab ? 700 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab === 'Manage Captains' ? '👑 Manage Captains' : tab}
                        </button>
                    ))}
                </div>

                {/* Tab: UPDATE SCORES */}
                {activeTab === 'Update Scores' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Update Match Scores</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Select a match and enter the final or current score.</p>
                        </div>

                        <form style={{ maxWidth: '600px' }} onSubmit={handleUpdateScore}>
                            {scoreMessage.text && (
                                <div style={{
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: scoreMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                    borderLeft: `4px solid ${scoreMessage.type === 'error' ? '#ef4444' : '#22c55e'}`,
                                    color: scoreMessage.type === 'error' ? '#ef4444' : '#22c55e'
                                }}>
                                    {scoreMessage.text}
                                </div>
                            )}

                            {/* Select Match dropdown */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Select Match
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div
                                        onClick={() => setIsMatchDropdownOpen(!isMatchDropdownOpen)}
                                        style={{
                                            padding: '0.8rem 1rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: selectedMatchId ? 'white' : 'var(--color-text-muted)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span>
                                            {selectedMatchId
                                                ? (() => {
                                                    const m = matches.find(match => match.id.toString() === selectedMatchId);
                                                    return m ? `${m.homeTeam.name} vs ${m.awayTeam.name} (${new Date(m.date).toLocaleDateString()} ${m.time})` : 'Select a match';
                                                })()
                                                : 'Select a match'}
                                        </span>
                                        <ChevronDown size={18} color="var(--color-text-muted)" />
                                    </div>

                                    {isMatchDropdownOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '0.5rem',
                                            backgroundColor: '#121212',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            zIndex: 10,
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                        }}>
                                            {matches.length === 0 ? (
                                                <div style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No upcoming matches</div>
                                            ) : (
                                                matches.map(m => (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => {
                                                            setSelectedMatchId(m.id.toString());
                                                            setIsMatchDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                            color: 'white',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            backgroundColor: selectedMatchId === m.id.toString() ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                                                        }}
                                                    >
                                                        <span>{m.homeTeam.name} vs {m.awayTeam.name}</span>
                                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                            {new Date(m.date).toLocaleDateString()} {m.time}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Score inputs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                        Home Team Score
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={homeScore}
                                        onChange={(e) => setHomeScore(e.target.value)}
                                        placeholder="0"
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'white',
                                            fontSize: '1.25rem',
                                            textAlign: 'center',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                        Away Team Score
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={awayScore}
                                        onChange={(e) => setAwayScore(e.target.value)}
                                        placeholder="0"
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'white',
                                            fontSize: '1.25rem',
                                            textAlign: 'center',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    fontSize: '1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    fontWeight: 600
                                }}
                            >
                                {actionLoading ? 'Updating Score...' : 'Save & Publish Score'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab: MANAGE CAPTAINS (ONLY ADMIN CAN) */}
                {activeTab === 'Manage Captains' && (
                    <div>
                        {/* Deadline card */}
                        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Clock size={20} color="#eab308" />
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Team Roster Edit Deadline</h3>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '1rem',
                                            backgroundColor: isPastDeadline ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                            color: isPastDeadline ? '#ef4444' : '#22c55e',
                                            fontWeight: 700,
                                            border: `1px solid ${isPastDeadline ? '#ef4444' : '#22c55e'}`
                                        }}>
                                            {isPastDeadline ? 'EXPIRED' : 'ACTIVE'}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                        Captains can edit their squad players until <strong>28th October 18:30</strong>. Remaining: <strong>{deadlineRemaining}</strong>.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={adminDeadline}
                                        onChange={(e) => setAdminDeadline(e.target.value)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: 'rgba(0,0,0,0.4)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            fontFamily: 'monospace'
                                        }}
                                        title="ISO Timestamp or deadline format"
                                    />
                                    <button
                                        onClick={handleUpdateDeadline}
                                        disabled={savingDeadline}
                                        className="btn btn-primary"
                                        style={{
                                            padding: '0.55rem 1rem',
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            fontWeight: 700
                                        }}
                                    >
                                        <Save size={14} /> {savingDeadline ? 'Saving...' : 'Update Deadline'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        {captainSuccessMsg && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                border: '1px solid #22c55e',
                                color: '#22c55e',
                                fontWeight: 600
                            }}>
                                <CheckCircle2 size={18} /> {captainSuccessMsg}
                            </div>
                        )}
                        {captainErrorMsg && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                fontWeight: 600
                            }}>
                                <AlertCircle size={18} /> {captainErrorMsg}
                            </div>
                        )}

                        <div className="flex-between" style={{ marginBottom: '1.25rem', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 700 }}>Registered Team Captains</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                    Only Admins can assign captains and their 4-digit PINs. Each captain can only edit their own team.
                                </p>
                            </div>
                            <button
                                onClick={fetchCaptainsData}
                                disabled={captainsLoading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--color-border)',
                                    color: 'white',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <RefreshCw size={14} className={captainsLoading ? 'spin' : ''} /> Refresh
                            </button>
                        </div>

                        {captainsLoading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                Loading captains directory...
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                                {captainsList.map(item => (
                                    <div key={item.teamKey} className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', position: 'relative' }}>
                                        <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'white' }}>
                                                    {item.teamName}
                                                </h3>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {item.group ? `${item.group} • ` : ''}Key: <code style={{ color: 'var(--color-primary)' }}>{item.teamKey}</code>
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '0.5rem',
                                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                color: '#22c55e',
                                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                                fontWeight: 600
                                            }}>
                                                Captain Configured
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                                                    Captain Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.captainName || ''}
                                                    onChange={(e) => handleCaptainFieldChange(item.teamKey, 'captainName', e.target.value)}
                                                    placeholder="e.g. Sipho Sithole"
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.6rem 0.8rem',
                                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: 'white',
                                                        fontSize: '0.9rem'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                                                    Captain Email (Optional)
                                                </label>
                                                <input
                                                    type="email"
                                                    value={item.email || ''}
                                                    onChange={(e) => handleCaptainFieldChange(item.teamKey, 'email', e.target.value)}
                                                    placeholder="captain@example.com"
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.6rem 0.8rem',
                                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: 'white',
                                                        fontSize: '0.9rem'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                                                    <span>4-Digit Login PIN</span>
                                                    <span style={{ color: 'var(--color-primary)' }}>Secret credential</span>
                                                </label>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <div style={{ position: 'relative', flex: 1 }}>
                                                        <Key size={16} color="var(--color-primary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            value={item.pin || ''}
                                                            onChange={(e) => handleCaptainFieldChange(item.teamKey, 'pin', e.target.value)}
                                                            placeholder="4-digit PIN"
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.6rem 0.8rem 0.6rem 2.2rem',
                                                                backgroundColor: 'rgba(0,0,0,0.4)',
                                                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                                                borderRadius: 'var(--radius-sm)',
                                                                color: 'var(--color-primary)',
                                                                fontWeight: 700,
                                                                fontSize: '1rem',
                                                                letterSpacing: '0.15em',
                                                                fontFamily: 'monospace'
                                                            }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveCaptain(item.teamKey)}
                                                        disabled={savingTeamKey === item.teamKey}
                                                        className="btn btn-primary"
                                                        style={{
                                                            padding: '0.6rem 1rem',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 700,
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {savingTeamKey === item.teamKey ? 'Saving...' : 'Save PIN'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: MATCH STATUS */}
                {activeTab === 'Match Status' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Match Status Controls</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                Control scheduled matches, kick-off statuses, and post-game reviews.
                            </p>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: resetSuccessMsg ? '1rem' : 0 }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', color: '#ef4444', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <RotateCcw size={18} /> Reset All Tournament Scores
                                    </h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                        Purge all goals, completed scores, and live match timers across all connected devices. All 10 fixtures return to Scheduled status.
                                    </p>
                                </div>
                                <button
                                    onClick={handleResetAllScores}
                                    disabled={resetLoading}
                                    className="btn btn-secondary"
                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', cursor: resetLoading ? 'not-allowed' : 'pointer' }}
                                >
                                    <RotateCcw size={16} /> {resetLoading ? 'Resetting...' : 'Reset Match Scores'}
                                </button>
                            </div>
                            {resetSuccessMsg && (
                                <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle2 size={16} /> {resetSuccessMsg}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: ADD FIXTURE */}
                {activeTab === 'Add Fixture' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Create New Fixture</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            Schedule matches between league participants with assigned pitches and kickoff times.
                        </p>
                    </div>
                )}

                {/* Tab: PLAYER PAYMENTS */}
                {activeTab === 'Player Payments' && (
                    <div>
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>Loading finance data...</div>
                        ) : (
                            <>
                                {/* Top Stats Cards */}
                                <div className="grid-responsive-4" style={{ marginBottom: '2rem' }}>
                                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                                        <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>$</span>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total Revenue</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{formatCurrency(totalRevenue)}</div>
                                        </div>
                                    </div>

                                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                                        <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                                            <Users size={20} color="var(--color-primary)" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total Players</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{totalPlayers}</div>
                                        </div>
                                    </div>

                                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                                        <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                            <BadgeCheck size={20} color="var(--color-primary)" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Paid</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{paidCount}</div>
                                        </div>
                                    </div>

                                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                                        <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                            <XCircle size={20} color="#ef4444" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Unpaid</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{unpaidCount}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Players Table Section */}
                                <div className="glass-panel" style={{ padding: '2rem' }}>
                                    <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>Player Payments Dashboard</h2>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>Review financial status across all registered teams.</p>
                                        </div>
                                        <div className="glass-card flex-center" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem', cursor: 'pointer' }}>
                                            <span style={{ color: 'white', fontWeight: 500 }}>All Teams</span> <ChevronDown size={14} color="var(--color-text-muted)" />
                                        </div>
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '1rem 0', color: 'white', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Player</th>
                                                <th style={{ textAlign: 'left', padding: '1rem 0', color: 'white', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Team</th>
                                                <th style={{ textAlign: 'left', padding: '1rem 0', color: 'white', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Payment Status</th>
                                                <th style={{ textAlign: 'right', padding: '1rem 0', color: 'white', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {finances.map((p, i) => {
                                                const statusLabel = p.status.replace('_', ' ');
                                                const displayStatus = p.status === 'PER_GAME' ? `${statusLabel} (${p.gamesPlayed}/${p.gamesPaidFor})` : statusLabel;
                                                const style = getStatusStyle(p.status);
                                                return (
                                                    <tr key={p.id || i}>
                                                        <td style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)', color: 'white', fontWeight: 500 }}>{p.player?.name}</td>
                                                        <td style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{p.team?.name}</td>
                                                        <td style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
                                                            <span style={{
                                                                color: style.color,
                                                                backgroundColor: style.bg,
                                                                border: style.border,
                                                                padding: style.padding || '0.2rem 0.6rem',
                                                                borderRadius: style.borderRadius || '2rem',
                                                                fontSize: '0.75rem',
                                                                fontWeight: style.fontWeight || 500
                                                            }}>
                                                                {displayStatus}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)', textAlign: 'right', color: 'white', fontWeight: 600 }}>{formatCurrency(p.amountPaid)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
