import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { getMatches } from '../services/api';

export const Fixtures = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [groupedMatches, setGroupedMatches] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    const matchweeks = ['All', 'MW 5', 'MW 6', 'MW 7'];
    const [activeMW, setActiveMW] = useState('All');

    useEffect(() => {
        const fetchFixtures = async () => {
            try {
                const data = await getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING' });
                // Sort by date/time ascending
                data.sort((a: any, b: any) => {
                    const dateA = new Date(`${a.date.split('T')[0]}T${a.time}`);
                    const dateB = new Date(`${b.date.split('T')[0]}T${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                });
                setMatches(data);

                // Group by date string
                const groups: Record<string, any[]> = {};
                data.forEach((match: any) => {
                    const d = new Date(match.date);
                    const dateStr = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    if (!groups[dateStr]) groups[dateStr] = [];
                    groups[dateStr].push(match);
                });
                setGroupedMatches(groups);
            } catch (error) {
                console.error("Failed to fetch fixtures", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFixtures();
    }, []);

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Upcoming Fixtures</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>View scheduled matches and live games. Auto-updates every 30 seconds.</p>
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

                {loading && <div style={{ textAlign: 'center', padding: '3rem' }}>Loading fixtures...</div>}

                {!loading && Object.keys(groupedMatches).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No upcoming fixtures found.</div>
                )}

                {!loading && Object.entries(groupedMatches).map(([dateStr, dayMatches]) => (
                    <div key={dateStr} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '1.5rem' }}>
                            <CalendarIcon size={18} /> {dateStr}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {dayMatches.map((match: any) => (
                                <div key={match.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 150px', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>{match.homeTeam?.name || 'TBD'}</div>
                                    <div className="flex-center" style={{ flexDirection: 'column', backgroundColor: 'var(--color-bg-panel)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', margin: '0 2rem', minWidth: '100px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{match.time}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Pitch {match.pitchNumber}</span>
                                    </div>
                                    <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>{match.awayTeam?.name || 'TBD'}</div>
                                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-end', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <MapPin size={14} /> Local Arena
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

            </main>
        </div>
    );
};
