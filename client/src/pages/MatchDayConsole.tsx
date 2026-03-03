import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { getMatches, updateMatchScore } from '../services/api';
import { Navbar } from '../components/Navbar';
import { ChevronDown, Flag, UserCheck, Play, Pause, Square, LogOut } from 'lucide-react';

const socket = io('http://localhost:5000');

type MatchState = {
    homeScore: number;
    awayScore: number;
    currentHalf: 1 | 2;
    timerSeconds: number; // Ticks down from 1200 (20 mins)
    isRunning: boolean;
    isPaused: boolean;
    pauseSeconds: number; // Ticks down from 60
    matchEnded: boolean;
};

const DEFAULT_MATCH_STATE: MatchState = {
    homeScore: 0,
    awayScore: 0,
    currentHalf: 1,
    timerSeconds: 20 * 60,
    isRunning: false,
    isPaused: false,
    pauseSeconds: 60,
    matchEnded: false
};

export const MatchDayConsole = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
    const [matchState, setMatchState] = useState<MatchState>(DEFAULT_MATCH_STATE);
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch matches on mount
    useEffect(() => {
        const fetchFixtures = async () => {
            try {
                const data = await getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING,LIVE' });
                setMatches(data);

                // Immediately attempt to resurrect active match if it exists
                const savedMatchId = localStorage.getItem('active_match_id');
                if (savedMatchId) {
                    const activeMatch = data.find((m: any) => m.id.toString() === savedMatchId);
                    if (activeMatch) {
                        setSelectedMatch(activeMatch);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch fixtures", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFixtures();

        socket.on('scoreUpdate', (match) => {
            if (selectedMatch && match.id === selectedMatch.id) {
                setMatchState(prev => ({
                    ...prev,
                    homeScore: match.homeScore,
                    awayScore: match.awayScore
                }));
            }
        });

        return () => {
            socket.off('scoreUpdate');
        };
    }, [selectedMatch]);

    // Save/Restore state from localStorage whenever selectedMatch or state changes
    useEffect(() => {
        if (!selectedMatch) return;

        const storageKey = `match_state_${selectedMatch.id}`;
        const saved = localStorage.getItem(storageKey);

        if (saved) {
            setMatchState(JSON.parse(saved));
        } else {
            setMatchState({
                ...DEFAULT_MATCH_STATE,
                homeScore: selectedMatch.homeScore || 0,
                awayScore: selectedMatch.awayScore || 0
            });
        }
    }, [selectedMatch]);

    useEffect(() => {
        if (!selectedMatch) return;
        const storageKey = `match_state_${selectedMatch.id}`;
        localStorage.setItem(storageKey, JSON.stringify(matchState));
    }, [matchState, selectedMatch]);

    // Timer Logic
    useEffect(() => {
        if (matchState.isRunning && !matchState.isPaused && !matchState.matchEnded) {
            timerRef.current = setInterval(() => {
                setMatchState(prev => {
                    if (prev.timerSeconds <= 0) {
                        return { ...prev, isRunning: false, timerSeconds: 0 };
                    }
                    return { ...prev, timerSeconds: prev.timerSeconds - 1, pauseSeconds: 60 }; // Reset pause timer on tick
                });
            }, 1000);
        } else if (matchState.isPaused && !matchState.matchEnded) {
            timerRef.current = setInterval(() => {
                setMatchState(prev => {
                    if (prev.pauseSeconds <= 0) {
                        // Pause time exhausted, force unpause
                        return { ...prev, isPaused: false };
                    }
                    return { ...prev, pauseSeconds: prev.pauseSeconds - 1 };
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [matchState.isRunning, matchState.isPaused, matchState.matchEnded]);


    const handleSelectMatch = (matchId: string) => {
        const match = matches.find(m => m.id.toString() === matchId);
        if (match) {
            setSelectedMatch(match);
            localStorage.setItem('active_match_id', match.id.toString());
        }
    };

    const handleUpdateScore = async (home: number, away: number) => {
        if (!selectedMatch) return;
        try {
            await updateMatchScore(selectedMatch.id, home, away);
            setMatchState(prev => ({ ...prev, homeScore: home, awayScore: away }));
        } catch (e) {
            console.error(e);
        }
    };

    const togglePlayPause = () => {
        setMatchState(prev => {
            if (!prev.isRunning && prev.timerSeconds === 1200) {
                // First click to start a half
                if (prev.currentHalf === 1 && selectedMatch) {
                    // Update status to LIVE on the backend
                    updateMatchScore(selectedMatch.id, prev.homeScore, prev.awayScore, 'LIVE').catch(console.error);
                }
                return { ...prev, isRunning: true, isPaused: false };
            }
            if (!prev.isRunning) {
                // Resuming from pause
                return { ...prev, isRunning: true, isPaused: false };
            }
            // Toggle pause
            return { ...prev, isPaused: !prev.isPaused };
        });
    };

    const nextHalf = () => {
        if (matchState.currentHalf === 1) {
            setMatchState(prev => ({
                ...prev,
                currentHalf: 2,
                timerSeconds: 20 * 60, // Reset for 2nd half
                isRunning: false,
                isPaused: false,
                pauseSeconds: 60
            }));
        } else {
            // End Match
            setMatchState(prev => ({
                ...prev,
                matchEnded: true,
                isRunning: false,
                isPaused: false
            }));
        }
    };

    const finalizeWhistle = () => {
        if (window.confirm("Are you sure you want to finalize this match? This cannot be undone.")) {
            if (selectedMatch) {
                updateMatchScore(selectedMatch.id, matchState.homeScore, matchState.awayScore, 'COMPLETED').catch(console.error);
                localStorage.removeItem(`match_state_${selectedMatch.id}`);
                localStorage.removeItem('active_match_id');
            }
            setSelectedMatch(null);
        }
    };

    const handleExitMatch = () => {
        if (selectedMatch) {
            localStorage.removeItem('active_match_id');
        }
        setSelectedMatch(null);
    };

    // Formatters
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
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
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Manage live timing and score state.</p>
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
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <div
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        border: isDropdownOpen ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--color-text-muted)',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span>Select match...</span>
                                    <ChevronDown size={18} color="var(--color-text-muted)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                </div>

                                {isDropdownOpen && (
                                    <div className="animate-fade-in" style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: '0.5rem',
                                        backgroundColor: 'var(--color-bg-card)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                        zIndex: 50,
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                    }}>
                                        {matches.length === 0 ? (
                                            <div style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No matches available</div>
                                        ) : (
                                            matches.map(m => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => {
                                                        handleSelectMatch(m.id.toString());
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        padding: '1rem',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                        color: 'white',
                                                        transition: 'background-color 0.2s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                                        e.currentTarget.style.color = 'var(--color-primary)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>{m.homeTeam?.name || 'TBD'}</span> <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0.5rem' }}>vs</span> <span style={{ fontWeight: 600 }}>{m.awayTeam?.name || 'TBD'}</span>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                        Pitch {m.pitchNumber} • {m.time}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '700px', padding: '2.5rem', borderTop: '4px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Match Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}</h3>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                                    <span>Pitch {selectedMatch.pitchNumber}</span>
                                    <span>•</span>
                                    <span>Scheduled: {selectedMatch.time}</span>
                                </div>
                            </div>
                            <span className="animate-fade-in" style={{ background: matchState.matchEnded ? 'var(--color-bg-panel)' : 'rgba(239, 68, 68, 0.2)', color: matchState.matchEnded ? 'var(--color-text-muted)' : '#ef4444', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px' }}>
                                {matchState.matchEnded ? 'ENDED' : 'LIVE'}
                            </span>
                        </div>

                        {/* Timer Dashboard */}
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-md)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', border: matchState.isPaused ? '1px solid #eab308' : '1px solid transparent' }}>
                            <div style={{ color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                HALF {matchState.currentHalf}
                            </div>
                            <div style={{ fontSize: '5rem', fontWeight: 800, lineHeight: 1, color: matchState.isPaused ? '#eab308' : 'white', fontFamily: 'monospace' }}>
                                {formatTime(matchState.timerSeconds)}
                            </div>

                            {/* Pause Indicator */}
                            {matchState.isPaused && (
                                <div className="animate-fade-in" style={{ color: '#eab308', marginTop: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                                    PAUSE LIMIT: {formatTime(matchState.pauseSeconds)}
                                </div>
                            )}

                            {/* Timer Controls */}
                            {!matchState.matchEnded && (
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    {!matchState.isRunning || matchState.isPaused ? (
                                        <button className="btn btn-primary flex-center gap-2" onClick={togglePlayPause} style={{ padding: '0.75rem 2rem' }}>
                                            <Play size={18} /> {matchState.timerSeconds === 1200 && !matchState.isRunning ? `Start Half ${matchState.currentHalf}` : 'Resume'}
                                        </button>
                                    ) : (
                                        <button className="btn" onClick={togglePlayPause} style={{ padding: '0.75rem 2rem', backgroundColor: '#eab308', color: '#000', border: 'none', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <Pause size={18} /> Pause Match
                                        </button>
                                    )}

                                    <button className="btn btn-secondary flex-center gap-2" onClick={nextHalf} disabled={matchState.timerSeconds > 0 && !matchState.isPaused} style={{ padding: '0.75rem 2rem', opacity: (matchState.timerSeconds > 0 && !matchState.isPaused) ? 0.5 : 1 }}>
                                        <Square size={18} /> {matchState.currentHalf === 1 ? 'End 1st Half' : 'End Match'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Score Board */}
                        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', padding: '1rem 0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, color: 'white' }}>{matchState.homeScore}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{selectedMatch.homeTeam?.name.substring(0, 3).toUpperCase()}</div>
                                <button className="btn btn-secondary" disabled={matchState.matchEnded} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '100%' }} onClick={() => handleUpdateScore(matchState.homeScore + 1, matchState.awayScore)}>
                                    + Goal
                                </button>
                            </div>

                            <div style={{ fontSize: '2rem', color: 'var(--color-border)', fontWeight: 300, paddingBottom: '3rem' }}>-</div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, color: 'white' }}>{matchState.awayScore}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{selectedMatch.awayTeam?.name.substring(0, 3).toUpperCase()}</div>
                                <button className="btn btn-secondary" disabled={matchState.matchEnded} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '100%' }} onClick={() => handleUpdateScore(matchState.homeScore, matchState.awayScore + 1)}>
                                    + Goal
                                </button>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                            <button className="btn btn-outline flex-center gap-2" style={{ flex: 1, borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)' }} onClick={handleExitMatch}>
                                <LogOut size={16} /> Exit Match
                            </button>
                            <button className="btn btn-primary" disabled={!matchState.matchEnded} style={{ flex: 2, backgroundColor: matchState.matchEnded ? '#16a34a' : 'var(--color-bg-card)', color: matchState.matchEnded ? '#fff' : 'var(--color-text-muted)', border: 'none' }} onClick={finalizeWhistle}>
                                Submit Final Result
                            </button>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};
