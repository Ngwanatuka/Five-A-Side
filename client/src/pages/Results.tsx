import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Calendar as CalendarIcon, Trophy } from 'lucide-react';
import { getMatches, getBackendUrl } from '../services/api';
import { NavLink } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io(getBackendUrl());

export const Results = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [groupedMatches, setGroupedMatches] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState('All');
    const dateList = Object.keys(groupedMatches);
    const dateFilters = ['All', ...dateList];

    const fetchResults = async () => {
        try {
            const data = await getMatches({ seasonId: 1, divisionId: 1, status: 'COMPLETED' });
            // Sort by date/time descending for results
            data.sort((a: any, b: any) => {
                const dateA = new Date(`${a.date.split('T')[0]}T${a.time}`);
                const dateB = new Date(`${b.date.split('T')[0]}T${b.time}`);
                return dateB.getTime() - dateA.getTime();
            });
            setMatches(data);

            // Group by date string
            const groups: Record<string, any[]> = {};
            data.forEach((match: any) => {
                const d = new Date(match.date);
                const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                if (!groups[dateStr]) groups[dateStr] = [];
                groups[dateStr].push(match);
            });
            setGroupedMatches(groups);
        } catch (error) {
            console.error("Failed to fetch results", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();

        socket.on('scoreUpdate', () => { fetchResults(); });
        socket.on('derbyUpdate', () => { fetchResults(); });
        socket.on('derbyReset', () => { fetchResults(); });

        return () => {
            socket.off('scoreUpdate');
            socket.off('derbyUpdate');
            socket.off('derbyReset');
        };
    }, []);

    const totalGoals = matches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);
    const matchesPlayed = matches.length;
    const avgGoals = matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(1) : '0.0';

    const entriesToRender = Object.entries(groupedMatches).filter(([dateStr]) =>
        selectedDate === 'All' ? true : dateStr === selectedDate
    );

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Match Results</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>View completed matches and final scores.</p>
                </div>

                {/* Date Filter Tabs if multiple dates */}
                {dateList.length > 1 && (
                    <div className="flex-center gap-2" style={{ marginBottom: '3rem', flexWrap: 'wrap' }}>
                        {dateFilters.map(d => (
                            <button
                                key={d}
                                className={`btn btn-sm ${selectedDate === d ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedDate(d)}
                                style={{ border: selectedDate === d ? 'none' : '' }}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                )}

                {loading && <div style={{ textAlign: 'center', padding: '3rem' }}>Loading results...</div>}

                {!loading && entriesToRender.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No completed matches found.</div>
                )}

                {!loading && entriesToRender.map(([dateStr, dayMatches]) => (
                    <div key={dateStr} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '1.5rem' }}>
                            <CalendarIcon size={18} /> {dateStr}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {dayMatches.map((match: any) => {
                                const homeWon = match.homeScore > match.awayScore;
                                const awayWon = match.awayScore > match.homeScore;
                                const isDraw = match.homeScore === match.awayScore;

                                const getScoreBg = (isWinner: boolean, isDrawMatch: boolean) => {
                                    if (isDrawMatch) return '#ca8a04'; // yellow-600 for draw
                                    if (isWinner) return '#16a34a';   // green-600 for win
                                    return 'var(--color-bg-panel)';   // default for loss
                                };

                                return (
                                    <div key={match.id} className="match-card-grid">
                                        <div style={{ textAlign: 'right', fontWeight: homeWon ? 600 : 500, fontSize: '1.1rem', color: homeWon ? 'white' : 'var(--color-text-muted)' }}>{match.homeTeam?.name || 'TBD'}</div>

                                        <div className="flex-center" style={{ margin: '0 2rem', gap: '0.5rem' }}>
                                            <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: getScoreBg(homeWon, isDraw), color: 'white', borderRadius: 'var(--radius-sm)', border: homeWon || isDraw ? 'none' : '1px solid var(--color-border)', fontWeight: 800, fontSize: '1.2rem' }}>{match.homeScore}</div>
                                            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                            <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: getScoreBg(awayWon, isDraw), color: 'white', borderRadius: 'var(--radius-sm)', border: awayWon || isDraw ? 'none' : '1px solid var(--color-border)', fontWeight: 800, fontSize: '1.2rem' }}>{match.awayScore}</div>
                                        </div>

                                        <div style={{ textAlign: 'left', fontWeight: awayWon ? 600 : 500, fontSize: '1.1rem', color: awayWon ? 'white' : 'var(--color-text-muted)' }}>{match.awayTeam?.name || 'TBD'}</div>

                                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            <div>Pitch {match.pitchNumber}</div>
                                            <div>{match.time}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Season Stats Summary */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Season Stats</h3>
                    <div className="grid-responsive-3" style={{ textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{totalGoals}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total Goals</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{matchesPlayed}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Matches Played</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{avgGoals}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Avg Goals/Match</div>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '0.85rem', marginTop: '2rem' }}>
                    Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <footer style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
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
