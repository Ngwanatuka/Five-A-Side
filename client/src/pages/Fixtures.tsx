import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { getMatches, getBackendUrl } from '../services/api';
import { io } from 'socket.io-client';

const socket = io(getBackendUrl());

export const Fixtures = () => {

    const [groupedMatches, setGroupedMatches] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    const matchweeks = ['All', 'MW 5', 'MW 6', 'MW 7'];
    const [activeMW, setActiveMW] = useState('All');

    const fetchFixtures = async () => {
        try {
            const data = await getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING,LIVE' });
            // Sort by date/time ascending
            data.sort((a: any, b: any) => {
                const dateA = new Date(`${a.date.split('T')[0]}T${a.time}`);
                const dateB = new Date(`${b.date.split('T')[0]}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });

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

    useEffect(() => {
        fetchFixtures();

        socket.on('scoreUpdate', () => {
            fetchFixtures();
        });

        socket.on('teamRegistered', () => {
            fetchFixtures();
        });

        socket.on('derbyUpdate', () => {
            fetchFixtures();
        });

        return () => {
            socket.off('scoreUpdate');
            socket.off('teamRegistered');
            socket.off('derbyUpdate');
        };
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {dayMatches.map((match: any) => {
                                const isLive = match.status === 'LIVE';
                                const homeLeading = isLive && match.homeScore > match.awayScore;
                                const awayLeading = isLive && match.awayScore > match.homeScore;

                                return (
                                    <div key={match.id} className="match-card-grid" style={{
                                        border: isLive ? '1px solid rgba(239, 68, 68, 0.45)' : undefined,
                                        backgroundColor: isLive ? 'rgba(239, 68, 68, 0.05)' : undefined,
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.75rem 1rem'
                                    }}>
                                        <div style={{
                                            textAlign: 'right',
                                            fontWeight: homeLeading ? 800 : 600,
                                            fontSize: '1.05rem',
                                            color: homeLeading ? '#22c55e' : 'white'
                                        }}>
                                            {match.homeTeam?.name || 'TBD'}
                                            {homeLeading && <span style={{ fontSize: '0.7rem', color: '#22c55e', marginLeft: '0.4rem', fontWeight: 700 }}>◀ LEADING</span>}
                                        </div>

                                        <div className="flex-center" style={{
                                            flexDirection: 'column',
                                            backgroundColor: isLive ? 'rgba(239, 68, 68, 0.15)' : 'var(--color-bg-panel)',
                                            border: isLive ? '1px solid rgba(239, 68, 68, 0.35)' : 'none',
                                            padding: '0.4rem 1rem',
                                            borderRadius: 'var(--radius-sm)',
                                            margin: '0 1.5rem',
                                            minWidth: '110px'
                                        }}>
                                            {isLive ? (
                                                <>
                                                    <span style={{
                                                        color: '#ef4444',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        letterSpacing: '1px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                                        LIVE
                                                    </span>
                                                    <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#fff' }}>
                                                        {match.homeScore ?? 0} - {match.awayScore ?? 0}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Pitch {match.pitchNumber}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{match.time}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Pitch {match.pitchNumber}</span>
                                                </>
                                            )}
                                        </div>

                                        <div style={{
                                            textAlign: 'left',
                                            fontWeight: awayLeading ? 800 : 600,
                                            fontSize: '1.05rem',
                                            color: awayLeading ? '#22c55e' : 'white'
                                        }}>
                                            {awayLeading && <span style={{ fontSize: '0.7rem', color: '#22c55e', marginRight: '0.4rem', fontWeight: 700 }}>LEADING ▶</span>}
                                            {match.awayTeam?.name || 'TBD'}
                                        </div>

                                        <div className="flex-center gap-2" style={{ justifyContent: 'flex-end', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            <MapPin size={14} /> Pitch {match.pitchNumber}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

            </main>
        </div>
    );
};
