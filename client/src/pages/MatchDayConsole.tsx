import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getMatches, updateMatchScore } from '../services/api';
import { Navbar } from '../components/Navbar';
import { ChevronDown, Flag, UserCheck } from 'lucide-react';

const socket = io('http://localhost:5000');

export const MatchDayConsole = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFixtures = async () => {
            try {
                // Fetch matches for today, or just upcoming ones
                const data = await getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING' });
                // Filter specifically to matches that are relevant today or keep it simple
                setMatches(data);
            } catch (error) {
                console.error("Failed to fetch fixtures", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFixtures();

        socket.on('scoreUpdate', (match) => {
            if (selectedMatch && match.id === selectedMatch.id) {
                setHomeScore(match.homeScore);
                setAwayScore(match.awayScore);
            }
        });

        return () => {
            socket.off('scoreUpdate');
        };
    }, [selectedMatch]);

    const handleSelectMatch = (matchId: string) => {
        const match = matches.find(m => m.id.toString() === matchId);
        if (match) {
            setSelectedMatch(match);
            setHomeScore(match.homeScore || 0);
            setAwayScore(match.awayScore || 0);
        }
    };

    const handleUpdateScore = async (home: number, away: number) => {
        if (!selectedMatch) return;
        try {
            await updateMatchScore(selectedMatch.id, home, away);
            setHomeScore(home);
            setAwayScore(away);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content flex-center animate-fade-in" style={{ flex: 1, flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div className="flex-center" style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-primary)', borderRadius: '1rem', margin: '0 auto 1.5rem auto' }}>
                        <Flag size={32} color="#050505" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Match Day Console</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Select your assigned fixture to manage live scoring.</p>
                </div>

                {!selectedMatch ? (
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                <UserCheck size={20} /> Select Fixture
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Choose the match you are officiating right now.</p>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Loading today's fixtures...</div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <select
                                    onChange={(e) => handleSelectMatch(e.target.value)}
                                    defaultValue=""
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        fontSize: '1rem',
                                        appearance: 'none',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="" disabled>Select match...</option>
                                    {matches.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.homeTeam?.name || 'TBD'} vs {m.awayTeam?.name || 'TBD'} - Pitch {m.pitchNumber} ({m.time})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={18} color="var(--color-text-muted)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', borderTop: '4px solid var(--color-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>Pitch {selectedMatch.pitchNumber} • {selectedMatch.time}</p>
                            </div>
                            <span className="animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px' }}>LIVE</span>
                        </div>

                        <div style={{ display: 'flex', gap: '3rem', margin: '3rem 0', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, color: 'white' }}>{homeScore}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{selectedMatch.homeTeam?.name.substring(0, 3).toUpperCase()}</div>
                            </div>
                            <div style={{ fontSize: '2rem', color: 'var(--color-border)', fontWeight: 300 }}>-</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, color: 'white' }}>{awayScore}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{selectedMatch.awayTeam?.name.substring(0, 3).toUpperCase()}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '3rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }} onClick={() => handleUpdateScore(homeScore + 1, awayScore)}>
                                + Goal Home
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }} onClick={() => handleUpdateScore(homeScore, awayScore + 1)}>
                                + Goal Away
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} onClick={() => setSelectedMatch(null)}>
                                Change Match
                            </button>
                            <button className="btn btn-primary" style={{ flex: 2 }}>
                                Final Whistle
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
