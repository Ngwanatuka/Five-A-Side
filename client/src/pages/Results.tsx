import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { getMatches } from '../services/api';

export const Results = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [groupedMatches, setGroupedMatches] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    const matchweeks = ['All', 'MW 5', 'MW 4'];
    const [activeMW, setActiveMW] = useState('All');

    useEffect(() => {
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

        fetchResults();
    }, []);

    const totalGoals = matches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);
    const matchesPlayed = matches.length;
    const avgGoals = matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(1) : '0.0';

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Match Results</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>View completed matches and final scores.</p>
                </div>

                {/* Matchweek Pagination */}
                <div className="flex-center gap-4" style={{ marginBottom: '3rem' }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '0.5rem' }}><ChevronLeft size={16} /></button>
                    <div className="flex-center gap-2">
                        {matchweeks.map(mw => (
                            <button
                                key={mw}
                                className={`btn btn-sm ${activeMW === mw ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveMW(mw)}
                                style={{ border: activeMW === mw ? 'none' : '' }}
                            >
                                {mw}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '0.5rem' }}><ChevronRight size={16} /></button>
                </div>

                {loading && <div style={{ textAlign: 'center', padding: '3rem' }}>Loading results...</div>}

                {!loading && Object.keys(groupedMatches).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No completed matches found.</div>
                )}

                {!loading && Object.entries(groupedMatches).map(([dateStr, dayMatches]) => (
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
                                    <div key={match.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
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
                    Last updated: 15:18:44
                </div>

            </main>
        </div>
    );
};
