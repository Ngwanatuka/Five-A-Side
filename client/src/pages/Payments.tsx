import { Navbar } from '../components/Navbar';
import { BadgeCheck, Users, XCircle, Calendar as CalendarIcon, Wallet, ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Payments = () => {
    // Mock Data based on wireframe
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

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                {/* Header Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Player Payments</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Track player payments - R311 for half season (7 games) or R622 for full season (14 games)</p>
                </div>

                {/* Top Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
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

                {/* Payment Options Section */}
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Wallet size={20} color="var(--color-primary)" />
                        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Payment Options</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        {/* Per Game */}
                        <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                <CalendarIcon size={16} /> Per Game
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>R45</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Pay as you play</div>
                        </div>

                        {/* Half Season */}
                        <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'rgba(202, 138, 4, 0.05)', borderColor: 'rgba(202, 138, 4, 0.2)' }}>
                            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: '#ca8a04', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }}>
                                <span style={{ width: '16px', height: '16px', display: 'flex' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></span> Half Season
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>R311</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>7 games included</div>
                        </div>

                        {/* Full Season */}
                        <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.3)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'var(--color-primary)', color: '#050505', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                                Best Value
                            </div>
                            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }}>
                                <BadgeCheck size={16} /> Full Season
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>R622</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>All 14 games included</div>
                        </div>
                    </div>
                </div>

                {/* Players Table Section */}
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Players</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>Manage player registrations and payments (max 9 per team)</p>
                        </div>
                        <div className="glass-card flex-center" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem', cursor: 'pointer' }}>
                            <span style={{ color: 'white', fontWeight: 500 }}>All Teams</span> <ChevronDown size={14} color="var(--color-text-muted)" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <button className="btn" style={{ padding: '0.4rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--color-border)', borderRadius: '2rem', fontSize: '0.85rem' }}>Player List</button>
                        <button className="btn" style={{ padding: '0.4rem 1rem', backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', fontSize: '0.85rem' }}>By Team</button>
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

                {/* Admin Notice */}
                <div className="glass-panel flex-center" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Admin access required to modify payment records. <NavLink to="/admin" style={{ color: 'var(--color-primary)', textDecoration: 'none', marginLeft: '0.25rem' }}>Login as admin</NavLink> to manage payments.
                </div>

                <footer style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <div className="flex-center gap-2">
                        <div className="nav-logo-icon" style={{ padding: '0.2rem' }}><BadgeCheck size={14} color="#050505" /></div>
                        <strong style={{ color: 'white' }}>5-A-Side League</strong>
                    </div>
                    <div className="flex-center gap-4">
                        <span>Standings</span><span>Fixtures</span><span>Results</span><span>Teams</span>
                    </div>
                    <div>Season 2025/26</div>
                </footer>
            </main>
        </div>
    );
};
