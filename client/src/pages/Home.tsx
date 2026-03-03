import { useState, useEffect } from 'react';
import { Trophy, Calendar as CalendarIcon, MapPin, ChevronRight, Users, Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { NavLink } from 'react-router-dom';
import { getStandings, getMatches, getTeams } from '../services/api';

export const Home = () => {
    const [standings, setStandings] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [teamsCount, setTeamsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                // Fetch Standings
                const standingsData = await getStandings(1, 1);
                setStandings(standingsData);

                // Fetch Upcoming Matches
                const matchesData = await getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING' });
                // Sort by date/time ascending
                matchesData.sort((a: any, b: any) => {
                    const dateA = new Date(`${a.date.split('T')[0]}T${a.time}`);
                    const dateB = new Date(`${b.date.split('T')[0]}T${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                });
                setMatches(matchesData.slice(0, 4)); // Get next 4

                // Fetch Teams Count
                const teamsData = await getTeams();
                setTeamsCount(teamsData.length);
            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();

        // Setup auto-refresh
        const interval = setInterval(() => {
            fetchHomeData();
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const leader = standings.length > 0 ? standings[0] : null;
    const nextMatch = matches.length > 0 ? matches[0] : null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const getTeamAbbr = (name: string) => name.substring(0, 3).toUpperCase();
    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 72px)' }}>

                {/* Hero Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 0 3rem 0' }}>

                    <div className="animate-fade-in" style={{ backgroundColor: 'var(--color-primary)', padding: '1rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                        <Trophy size={48} color="#050505" strokeWidth={2} />
                    </div>

                    <h1 className="animate-fade-in" style={{ fontSize: '3.5rem', marginBottom: '1rem', animationDelay: '0.1s' }}>
                        5-A-Side League
                    </h1>

                    <p className="animate-fade-in" style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem', animationDelay: '0.2s', lineHeight: '1.6' }}>
                        Your local five-a-side soccer league. View live scores, fixtures, results, and league standings.
                    </p>

                    <div className="animate-fade-in flex-center gap-4" style={{ animationDelay: '0.3s' }}>
                        <NavLink to="/standings" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem', textDecoration: 'none' }}>
                            View Standings <ChevronRight size={18} style={{ marginLeft: '0.25rem' }} />
                        </NavLink>
                        <NavLink to="/register" className="btn btn-outline" style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem', textDecoration: 'none' }}>
                            Register Team
                        </NavLink>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', width: '100%', margin: '1rem 0 3rem 0' }}></div>

                {/* Stat Cards Section */}
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '4rem', animationDelay: '0.4s' }}>

                    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '100px', height: '100px', background: 'var(--color-primary)', opacity: 0.05, borderRadius: '50%' }}></div>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            <Trophy size={16} /> League Leader
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leader ? leader.teamName : '-'}</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{leader ? `${leader.points} points` : '-'}</p>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '100px', height: '100px', background: 'var(--color-primary)', opacity: 0.05, borderRadius: '50%' }}></div>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            <CalendarIcon size={16} /> Next Match
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {nextMatch ? `${getTeamAbbr(nextMatch.homeTeam?.name || '')} vs ${getTeamAbbr(nextMatch.awayTeam?.name || '')}` : '-'}
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{nextMatch ? formatDate(nextMatch.date) : '-'}</p>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '100px', height: '100px', background: 'var(--color-primary)', opacity: 0.05, borderRadius: '50%' }}></div>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            <Users size={16} /> Teams
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{teamsCount}</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Registered</p>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '100px', height: '100px', background: 'var(--color-primary)', opacity: 0.05, borderRadius: '50%' }}></div>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            <Clock size={16} /> Last Updated
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{lastUpdated}</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Auto-refresh: 30s</p>
                    </div>
                </div>

                {/* Dashboard Widgets */}
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', animationDelay: '0.5s', marginBottom: '2rem' }}>

                    {/* League Standings Widget */}
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                        <div className="flex-between" style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>League Standings</h2>
                            <NavLink to="/standings" className="btn btn-sm" style={{ backgroundColor: 'var(--color-primary)', color: '#050505', textDecoration: 'none', fontWeight: 600, padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                                View All <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                            </NavLink>
                        </div>

                        <div style={{ flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '0.5rem 0', color: 'var(--color-text-muted)', fontWeight: 500, borderBottom: '1px solid var(--color-border)', width: '30px' }}>#</th>
                                        <th style={{ padding: '0.5rem 0', color: 'var(--color-text-muted)', fontWeight: 500, borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>Team</th>
                                        <th style={{ padding: '0.5rem 0', color: 'var(--color-text-muted)', fontWeight: 500, borderBottom: '1px solid var(--color-border)', textAlign: 'center', width: '50px' }}>P</th>
                                        <th style={{ padding: '0.5rem 0', color: 'var(--color-text-muted)', fontWeight: 500, borderBottom: '1px solid var(--color-border)', textAlign: 'center', width: '60px' }}>GD</th>
                                        <th style={{ padding: '0.5rem 0', color: 'var(--color-text-muted)', fontWeight: 500, borderBottom: '1px solid var(--color-border)', textAlign: 'center', width: '50px' }}>Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.length === 0 && (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No standings available.</td></tr>
                                    )}
                                    {standings.slice(0, 5).map((row, i) => (
                                        <tr key={row.teamId}>
                                            <td style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                                                {i === 0 ? (
                                                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{i + 1}</span>
                                                ) : (
                                                    <span style={{ color: 'white', fontWeight: 600 }}>{i + 1}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)', fontWeight: 600, color: 'white' }}>{row.teamName}</td>
                                            <td style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.played}</td>
                                            <td style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)', textAlign: 'center', color: row.goalDifference > 0 ? 'var(--color-primary)' : (row.goalDifference < 0 ? '#ef4444' : 'inherit') }}>
                                                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                            </td>
                                            <td style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 700, color: 'white' }}>{row.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Upcoming Fixtures Widget */}
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                        <div className="flex-between" style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Upcoming Fixtures</h2>
                            <NavLink to="/fixtures" className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', color: 'white', textDecoration: 'none', fontWeight: 600, padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: 'none' }}>
                                View All <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                            </NavLink>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {matches.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No upcoming fixtures.</div>
                            )}
                            {matches.map((fixture, i) => (
                                <div key={fixture.id} style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.4rem' }}>
                                            {getTeamAbbr(fixture.homeTeam?.name || '')} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0.5rem', fontWeight: 400 }}>vs</span> {getTeamAbbr(fixture.awayTeam?.name || '')}
                                        </div>
                                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarIcon size={12} /> {formatDate(fixture.date)}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>⏱ {fixture.time}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <MapPin size={14} /> Pitch {fixture.pitchNumber}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <footer style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <div className="flex-center gap-2">
                        <div className="nav-logo-icon" style={{ padding: '0.2rem' }}><Trophy size={14} color="#050505" /></div>
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
