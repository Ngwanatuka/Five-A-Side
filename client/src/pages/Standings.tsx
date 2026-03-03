import { useEffect, useState } from 'react';
import { getStandings } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Trophy, RefreshCw, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

type StandingsRow = {
    teamId: number;
    teamName: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
};

export const Standings = () => {
    const [standings, setStandings] = useState<StandingsRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStandings();

        // Listen for live score updates to refresh standings log
        socket.on('scoreUpdate', () => {
            fetchStandings();
        });

        return () => {
            socket.off('scoreUpdate');
        };
    }, []);

    const fetchStandings = async () => {
        setLoading(true);
        try {
            const data = await getStandings(1, 1);
            setStandings(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderFormIcon = (form: string) => {
        if (form === 'W') return <TrendingUp size={16} className="text-green" />;
        if (form === 'D') return <Minus size={16} style={{ color: 'var(--color-text-muted)' }} />;
        return <TrendingDown size={16} className="text-red" />;
    };

    const totalGoals = standings.reduce((sum, row) => sum + row.goalsFor, 0);
    const totalMatchesPlayed = standings.reduce((sum, row) => sum + row.played, 0) / 2;
    const avgGoalsPerMatch = totalMatchesPlayed > 0 ? (totalGoals / totalMatchesPlayed).toFixed(1) : '0.0';
    const leaderName = standings.length > 0 ? standings[0].teamName : '-';
    const mostGoals = standings.length > 0 ? Math.max(...standings.map(r => r.goalsFor)) : 0;

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div className="flex-between" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.25rem' }}>League Standings</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>Season 2025/26 - Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={fetchStandings} disabled={loading}>
                        <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '0' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                            <Trophy size={20} /> Full League Table
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            Win = 3 pts, Draw = 1 pt, Loss = 0 pts. Sorted by points, then goal difference.
                        </p>
                    </div>

                    <div className="table-container" style={{ border: 'none', borderRadius: '0', background: 'transparent' }}>
                        {error && <div style={{ padding: '2rem', color: '#ef4444' }}>Error: {error}</div>}

                        {!error && (
                            <table style={{ minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: '2rem' }}>Pos</th>
                                        <th>Team</th>
                                        <th style={{ textAlign: 'center' }}>P</th>
                                        <th style={{ textAlign: 'center' }}>W</th>
                                        <th style={{ textAlign: 'center' }}>D</th>
                                        <th style={{ textAlign: 'center' }}>L</th>
                                        <th style={{ textAlign: 'center' }}>GF</th>
                                        <th style={{ textAlign: 'center' }}>GA</th>
                                        <th style={{ textAlign: 'center' }}>GD</th>
                                        <th style={{ textAlign: 'center' }}>Form</th>
                                        <th style={{ textAlign: 'center', fontSize: '1rem', color: 'white' }}>Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.length === 0 && !loading ? (
                                        <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem' }}>No standings available.</td></tr>
                                    ) : (
                                        standings.map((row, index) => {
                                            const isLeader = index === 0;
                                            const isBottom = index === standings.length - 1 && standings.length > 1;

                                            return (
                                                <tr key={row.teamId} className={isBottom ? 'bg-red-subtle' : ''}>
                                                    <td style={{ paddingLeft: '2rem', fontWeight: 600 }}>
                                                        <div className="flex-center" style={{
                                                            width: '28px', height: '28px',
                                                            backgroundColor: isLeader ? 'var(--color-primary)' : 'transparent',
                                                            color: isLeader ? '#050505' : (isBottom ? '#ef4444' : 'inherit'),
                                                            borderRadius: '50%'
                                                        }}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 600, color: 'white' }}>{row.teamName}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.played}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.won}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.drawn}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.lost}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsFor}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsAgainst}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 500, color: row.goalDifference > 0 ? 'var(--color-primary)' : (row.goalDifference < 0 ? '#ef4444' : 'inherit') }}>
                                                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {/* Mocking form visually for now based on positions */}
                                                        {renderFormIcon(isLeader ? 'W' : (isBottom ? 'L' : 'D'))}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                                                        {row.points}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
                        <div className="flex-center gap-2"><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }}></div> League Leader</div>
                        <div className="flex-center gap-2"><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div> Bottom Position</div>
                        <div style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem' }}>
                            <span>P = Played</span>
                            <span>W = Won</span>
                            <span>D = Drawn</span>
                            <span>L = Lost</span>
                            <span>GF = Goals For</span>
                            <span>GA = Goals Against</span>
                            <span>GD = Goal Diff</span>
                        </div>
                    </div>
                </div>

                {/* Stat Cards for Standings Page */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                    <div className="glass-card flex-center" style={{ flexDirection: 'column', padding: '2rem 1.5rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{totalGoals}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Total Goals Scored</div>
                    </div>
                    <div className="glass-card flex-center" style={{ flexDirection: 'column', padding: '2rem 1.5rem' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1, textAlign: 'center' }}>{leaderName}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Current Leader</div>
                    </div>
                    <div className="glass-card flex-center" style={{ flexDirection: 'column', padding: '2rem 1.5rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{mostGoals}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Most Goals (Team)</div>
                    </div>
                    <div className="glass-card flex-center" style={{ flexDirection: 'column', padding: '2rem 1.5rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{avgGoalsPerMatch}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Avg Goals/Match</div>
                    </div>
                </div>

                <footer style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div className="flex-center gap-2">
                            <div className="nav-logo-icon" style={{ padding: '0.2rem' }}><Trophy size={14} color="#050505" /></div>
                            <strong style={{ color: 'white' }}>5-A-Side League</strong>
                        </div>
                        <NavLink to="/login" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                            Referee Login
                        </NavLink>
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
