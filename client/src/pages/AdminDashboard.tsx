import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Shield, Lock, LogOut, ChevronDown, Users, BadgeCheck, XCircle } from 'lucide-react';

export const AdminDashboard = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('Update Scores');

    // Mock Data for Payments
    const players = [
        { name: 'Marcus Johnson', team: 'FC Thunder', status: 'Full Season', amount: 'R622' },
        { name: 'Kevin Smith', team: 'FC Thunder', status: 'Full Season', amount: 'R622' },
        { name: 'Andre Williams', team: 'FC Thunder', status: 'Half Season', amount: 'R311' },
        { name: 'Brian Lee', team: 'FC Thunder', status: 'Per Game (5/14)', amount: 'R225' },
        { name: 'Chris Brown', team: 'FC Thunder', status: 'Per Game (6/14)', amount: 'R270' },
        { name: 'Daniel White', team: 'FC Thunder', status: 'Unpaid', amount: 'R0' },
        { name: 'David Silva', team: 'Real Strikers', status: 'Full Season', amount: 'R622' },
        { name: 'Eric Garcia', team: 'Real Strikers', status: 'Full Season', amount: 'R622' },
        { name: 'Frank Torres', team: 'Real Strikers', status: 'Half Season', amount: 'R311' },
        { name: 'George Martinez', team: 'Real Strikers', status: 'Half Season', amount: 'R311' },
        { name: 'Henry Lopez', team: 'Real Strikers', status: 'Per Game (3/14)', amount: 'R135' },
        { name: 'Ivan Rodriguez', team: 'Real Strikers', status: 'Per Game (5/14)', amount: 'R225' },
        { name: 'Xavier Quinn', team: 'Dynamo Stars', status: 'Per Game (4/14)', amount: 'R180' },
        { name: 'Yusuf Reed', team: 'Dynamo Stars', status: 'Per Game (4/14)', amount: 'R180' },
        { name: 'Tom Anderson', team: 'Blue Lions', status: 'Full Season', amount: 'R622' },
        { name: 'Zack Scott', team: 'Blue Lions', status: 'Half Season', amount: 'R311' },
        { name: 'Adam Taylor', team: 'Blue Lions', status: 'Per Game (5/14)', amount: 'R225' },
        { name: 'Ben Thomas', team: 'Blue Lions', status: 'Per Game (3/14)', amount: 'R135' },
        { name: 'Cole Walker', team: 'Blue Lions', status: 'Unpaid', amount: 'R0' },
        { name: 'Ryan Murphy', team: 'Red Devils', status: 'Full Season', amount: 'R622' },
        { name: 'Derek Wilson', team: 'Red Devils', status: 'Half Season', amount: 'R311' },
        { name: 'Ethan Young', team: 'Red Devils', status: 'Per Game (6/14)', amount: 'R270' },
        { name: 'Felix Zimmerman', team: 'Red Devils', status: 'Per Game (2/14)', amount: 'R90' },
        { name: 'Grant Hill', team: 'Red Devils', status: 'Unpaid', amount: 'R0' },
    ];

    const getStatusStyle = (status: string) => {
        if (status === 'Full Season') return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' };
        if (status === 'Half Season') return { color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.1)', border: '1px solid rgba(202, 138, 4, 0.2)' };
        if (status === 'Unpaid') return { color: 'white', bg: '#ef4444', border: 'none', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 };
        return { color: 'var(--color-text-muted)', bg: 'transparent', border: '1px solid var(--color-border)' }; // Per Game
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock login
        setIsLoggedIn(true);
    };

    if (!isLoggedIn) {
        return (
            <div className="app-container">
                <Navbar />

                <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>

                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div className="flex-center" style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-primary)', borderRadius: '1rem', margin: '0 auto 1.5rem auto' }}>
                            <Shield size={32} color="#050505" />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Admin Panel</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Enter the admin password to manage the league.</p>
                    </div>

                    <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                <Lock size={20} /> Login Required
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>This area is restricted to league administrators.</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter admin password"
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
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
                                Login
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Demo password: admin123
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Logged In State
    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content" style={{ padding: '2rem 2rem' }}>

                {/* Header section with Logout */}
                <div className="flex-between" style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Shield size={32} color="var(--color-primary)" />
                        <div>
                            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Admin Panel</h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>Manage fixtures, update scores, and control match status.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsLoggedIn(false)}
                        className="glass-card flex-center"
                        style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', gap: '0.5rem', cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--color-border)' }}
                    >
                        <LogOut size={16} /> <span style={{ color: 'white', fontWeight: 500 }}>Logout</span>
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {['Update Scores', 'Match Status', 'Add Fixture', 'Player Payments'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: activeTab === tab ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                color: activeTab === tab ? 'white' : 'var(--color-text-muted)',
                                fontWeight: activeTab === tab ? 600 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderTop: activeTab === tab ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid transparent'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Active Tab Content */}
                {activeTab === 'Update Scores' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Update Match Scores</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Select a match and enter the final or current score.</p>
                        </div>

                        <form style={{ maxWidth: '600px' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                                    Select Match
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'var(--color-text-muted)',
                                            fontSize: '0.95rem',
                                            appearance: 'none',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Choose a fixture...</option>
                                        <option value="1">FC Thunder vs Real Strikers (19:00)</option>
                                        <option value="2">Dynamo Stars vs Blue Lions (20:00)</option>
                                    </select>
                                    <ChevronDown size={18} color="var(--color-text-muted)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    fontSize: '1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(21, 128, 61, 0.8)' // slightly darker/semi transparent green per wireframe
                                }}
                            >
                                Update Score
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'Match Status' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>Match status controls will appear here.</p>
                    </div>
                )}

                {activeTab === 'Add Fixture' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>Fixture addition form will appear here.</p>
                    </div>
                )}

                {activeTab === 'Player Payments' && (
                    <div>
                        {/* Top Stats Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>$</span>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total Revenue</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>R12,877</div>
                                </div>
                            </div>

                            <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                                    <Users size={20} color="var(--color-primary)" />
                                </div>
                                <div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total Players</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>42</div>
                                </div>
                            </div>

                            <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                    <BadgeCheck size={20} color="var(--color-primary)" />
                                </div>
                                <div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Paid</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>36</div>
                                </div>
                            </div>

                            <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                                <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                    <XCircle size={20} color="#ef4444" />
                                </div>
                                <div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Unpaid</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>6</div>
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
                                    {players.map((p, i) => {
                                        const style = getStatusStyle(p.status);
                                        return (
                                            <tr key={i}>
                                                <td style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)', color: 'white', fontWeight: 500 }}>{p.name}</td>
                                                <td style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{p.team}</td>
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
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)', textAlign: 'right', color: 'white', fontWeight: 600 }}>{p.amount}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
