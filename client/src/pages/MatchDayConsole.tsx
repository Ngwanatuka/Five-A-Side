import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { getMatches, updateMatchScore, getDerbyData, saveDerbyData, getBackendUrl } from '../services/api';
import { Navbar } from '../components/Navbar';
import { ChevronDown, Flag, UserCheck, Play, Pause, Square, LogOut, Trash2, X } from 'lucide-react';

const socket = io(getBackendUrl());

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

    // Goal recording & squad players states
    const [tournamentPlayers, setTournamentPlayers] = useState<any[]>([]);
    const [goalEvents, setGoalEvents] = useState<any[]>([]);
    const [pendingGoalTeam, setPendingGoalTeam] = useState<{
        side: 'home' | 'away';
        teamKey: string;
        teamName: string;
    } | null>(null);
    const [customPlayerName, setCustomPlayerName] = useState('');

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

    // Fetch matches & teams (integrating edited tournament data)
    const fetchFixtures = async () => {
        try {
            // 1. Read local tournament data edited on the other side (Dench Derby page)
            let localTeams: Record<string, any> = {};
            let localMatches: any[] = [];
            let localPlayers: any[] = [];
            let localGoalEvents: any[] = [];
            try {
                const savedTeams = localStorage.getItem('dench_derby_teams_v4');
                if (savedTeams) localTeams = JSON.parse(savedTeams);
                const savedMatches = localStorage.getItem('dench_derby_matches_v4');
                if (savedMatches) localMatches = JSON.parse(savedMatches);
                const savedPlayers = localStorage.getItem('dench_derby_players_v4');
                if (savedPlayers) localPlayers = JSON.parse(savedPlayers);
                const savedGoalEvents = localStorage.getItem('dench_derby_events_v4');
                if (savedGoalEvents) localGoalEvents = JSON.parse(savedGoalEvents);
            } catch (e) {
                console.error("Notice parsing local tournament storage:", e);
            }

            // 2. Fetch matches from API and remote derby data
            const [apiMatches, derbyRemote] = await Promise.all([
                getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING,LIVE' }).catch(() => []),
                getDerbyData().catch(() => null)
            ]);

            // Effective tournament teams: remote first, then local browser storage takes highest priority
            const effectiveTeams: Record<string, any> = {
                ...(derbyRemote?.teams || {}),
                ...localTeams
            };

            const effectivePlayers: any[] = localPlayers.length > 0 ? localPlayers : (derbyRemote?.players || []);
            const effectiveGoalEvents: any[] = localGoalEvents.length > 0 ? localGoalEvents : (derbyRemote?.goalEvents || []);

            setTournamentPlayers(effectivePlayers);
            setGoalEvents(effectiveGoalEvents);

            // Helper to get latest edited name for any team
            const getTeamName = (teamKey?: string | null, placeholder?: string, fallback?: string): string => {
                if (teamKey && effectiveTeams[teamKey]?.name) {
                    return effectiveTeams[teamKey].name;
                }
                if (fallback) {
                    const matchedKey = Object.keys(effectiveTeams).find(
                        k => k === fallback || effectiveTeams[k]?.name?.toLowerCase() === fallback.toLowerCase()
                    );
                    if (matchedKey && effectiveTeams[matchedKey]?.name) {
                        return effectiveTeams[matchedKey].name;
                    }
                }
                return placeholder || fallback || 'TBD';
            };

            // Stage badge formatting helper
            const getStageBadge = (stage?: string, group?: string, id?: string) => {
                if (stage === 'group') return `Group ${group || 'A'}`;
                if (stage === 'semi') return id === 'sf-1' ? 'Semi-Final 1' : 'Semi-Final 2';
                if (stage === 'third_place') return '3rd Place Playoff';
                if (stage === 'final') return '🏆 Grand Final';
                return 'Tournament Match';
            };

            let combinedMatches: any[] = [];

            // Primary source: tournament fixtures from local storage or server derby data
            const rawTournamentMatches = localMatches.length > 0 ? localMatches : (derbyRemote?.matches || []);

            if (rawTournamentMatches.length > 0) {
                // Calculate standings dynamically for knockout qualification slots
                const calcStandings = (group: 'A' | 'B') => {
                    const teamKeys = Object.keys(effectiveTeams).filter(k => effectiveTeams[k]?.group === group);
                    const map: Record<string, { key: string; pts: number; gd: number; gf: number; played: number }> = {};
                    teamKeys.forEach(k => { map[k] = { key: k, pts: 0, gd: 0, gf: 0, played: 0 }; });

                    rawTournamentMatches.filter((m: any) => m.stage === 'group' && m.group === group).forEach((m: any) => {
                        if (m.homeScore !== null && m.awayScore !== null && m.homeTeamKey && m.awayTeamKey) {
                            const h = map[m.homeTeamKey];
                            const a = map[m.awayTeamKey];
                            if (!h || !a) return;
                            h.played++; a.played++;
                            h.gf += m.homeScore; h.gd += (m.homeScore - m.awayScore);
                            a.gf += m.awayScore; a.gd += (m.awayScore - m.homeScore);
                            if (m.homeScore > m.awayScore) { h.pts += 3; }
                            else if (m.homeScore < m.awayScore) { a.pts += 3; }
                            else { h.pts += 1; a.pts += 1; }
                        }
                    });

                    return Object.values(map).sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf);
                };

                const standingsA = calcStandings('A');
                const standingsB = calcStandings('B');
                const a1stKey = standingsA[0]?.played > 0 ? standingsA[0].key : null;
                const a2ndKey = standingsA[1]?.played > 0 ? standingsA[1].key : null;
                const b1stKey = standingsB[0]?.played > 0 ? standingsB[0].key : null;
                const b2ndKey = standingsB[1]?.played > 0 ? standingsB[1].key : null;

                const sf1 = rawTournamentMatches.find((m: any) => m.id === 'sf-1');
                const sf2 = rawTournamentMatches.find((m: any) => m.id === 'sf-2');
                const sf1WinnerKey = sf1 && sf1.homeScore !== null && sf1.awayScore !== null
                    ? (sf1.homeScore >= sf1.awayScore ? (sf1.homeTeamKey || a1stKey) : (sf1.awayTeamKey || b2ndKey))
                    : null;
                const sf1LoserKey = sf1 && sf1.homeScore !== null && sf1.awayScore !== null
                    ? (sf1.homeScore >= sf1.awayScore ? (sf1.awayTeamKey || b2ndKey) : (sf1.homeTeamKey || a1stKey))
                    : null;
                const sf2WinnerKey = sf2 && sf2.homeScore !== null && sf2.awayScore !== null
                    ? (sf2.homeScore >= sf2.awayScore ? (sf2.homeTeamKey || a2ndKey) : (sf2.awayTeamKey || b1stKey))
                    : null;
                const sf2LoserKey = sf2 && sf2.homeScore !== null && sf2.awayScore !== null
                    ? (sf2.homeScore >= sf2.awayScore ? (sf2.awayTeamKey || b1stKey) : (sf2.homeTeamKey || a2ndKey))
                    : null;

                combinedMatches = rawTournamentMatches.map((m: any) => {
                    let resolvedHomeKey = m.homeTeamKey;
                    let resolvedAwayKey = m.awayTeamKey;

                    if (m.id === 'sf-1') {
                        resolvedHomeKey = m.homeTeamKey || a1stKey;
                        resolvedAwayKey = m.awayTeamKey || b2ndKey;
                    } else if (m.id === 'sf-2') {
                        resolvedHomeKey = m.homeTeamKey || a2ndKey;
                        resolvedAwayKey = m.awayTeamKey || b1stKey;
                    } else if (m.id === 'fn-3rd') {
                        resolvedHomeKey = m.homeTeamKey || sf1LoserKey;
                        resolvedAwayKey = m.awayTeamKey || sf2LoserKey;
                    } else if (m.id === 'fn-gold') {
                        resolvedHomeKey = m.homeTeamKey || sf1WinnerKey;
                        resolvedAwayKey = m.awayTeamKey || sf2WinnerKey;
                    }

                    const homeName = getTeamName(resolvedHomeKey, m.homePlaceholder, m.homeTeam?.name);
                    const awayName = getTeamName(resolvedAwayKey, m.awayPlaceholder, m.awayTeam?.name);
                    const stageBadge = getStageBadge(m.stage, m.group, m.id);

                    return {
                        id: m.id,
                        stage: m.stage,
                        group: m.group,
                        stageBadge,
                        time: m.time || '18:30',
                        pitchNumber: m.pitch || m.pitchNumber || 1,
                        homeScore: m.homeScore ?? 0,
                        awayScore: m.awayScore ?? 0,
                        status: (m.status || 'scheduled').toUpperCase(),
                        homeTeamKey: resolvedHomeKey,
                        awayTeamKey: resolvedAwayKey,
                        homeTeam: { id: resolvedHomeKey || m.id, name: homeName },
                        awayTeam: { id: resolvedAwayKey || m.id, name: awayName }
                    };
                });
            } else if (Array.isArray(apiMatches) && apiMatches.length > 0) {
                combinedMatches = apiMatches.map((m: any) => {
                    const homeName = getTeamName(m.homeTeam?.id?.toString(), m.homeTeam?.name, m.homeTeam?.name);
                    const awayName = getTeamName(m.awayTeam?.id?.toString(), m.awayTeam?.name, m.awayTeam?.name);
                    const stageBadge = getStageBadge(m.stage, m.group, m.id?.toString());

                    return {
                        ...m,
                        stageBadge,
                        homeTeam: { ...m.homeTeam, name: homeName },
                        awayTeam: { ...m.awayTeam, name: awayName }
                    };
                });
            }

            setMatches(combinedMatches);

            // Resurrect active match or update selected match with latest edited names
            const savedMatchId = localStorage.getItem('active_match_id');
            if (savedMatchId) {
                const activeMatch = combinedMatches.find((m: any) => m.id.toString() === savedMatchId);
                if (activeMatch) {
                    setSelectedMatch(activeMatch);
                }
            } else if (selectedMatch) {
                const refreshed = combinedMatches.find((m: any) => m.id.toString() === selectedMatch.id.toString());
                if (refreshed) {
                    setSelectedMatch(refreshed);
                }
            }
        } catch (error) {
            console.error("Failed to fetch fixtures", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch fixtures on mount and listen to real-time events
    useEffect(() => {
        fetchFixtures();

        socket.on('scoreUpdate', (match) => {
            fetchFixtures();
            if (selectedMatch && match?.id === selectedMatch.id) {
                setMatchState(prev => ({
                    ...prev,
                    homeScore: match.homeScore ?? prev.homeScore,
                    awayScore: match.awayScore ?? prev.awayScore
                }));
            }
        });

        socket.on('derbyUpdate', () => {
            fetchFixtures();
        });

        socket.on('teamRegistered', () => {
            fetchFixtures();
        });

        socket.on('playerAdded', () => {
            fetchFixtures();
        });

        return () => {
            socket.off('scoreUpdate');
            socket.off('derbyUpdate');
            socket.off('teamRegistered');
            socket.off('playerAdded');
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
                    return { ...prev, timerSeconds: prev.timerSeconds - 1, pauseSeconds: 60 };
                });
            }, 1000);
        } else if (matchState.isPaused && !matchState.matchEnded) {
            timerRef.current = setInterval(() => {
                setMatchState(prev => {
                    if (prev.pauseSeconds <= 0) {
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

            // Also synchronize local storage matches so Dench Derby tournament page reflects immediately
            try {
                const savedMatches = localStorage.getItem('dench_derby_matches_v4');
                if (savedMatches) {
                    const parsed = JSON.parse(savedMatches);
                    const target = parsed.find((m: any) => m.id === selectedMatch.id || m.id.toString() === selectedMatch.id.toString());
                    if (target) {
                        target.homeScore = home;
                        target.awayScore = away;
                        localStorage.setItem('dench_derby_matches_v4', JSON.stringify(parsed));
                    }
                }
            } catch {}
        } catch (e) {
            console.error('Failed to update score', e);
        }
    };

    // Calculate live match minute from countdown timer (20-min halves)
    const getCurrentMatchMinute = (): number => {
        const elapsedSeconds = 1200 - matchState.timerSeconds;
        if (matchState.currentHalf === 1) {
            return Math.max(1, Math.min(20, Math.ceil(elapsedSeconds / 60) || 1));
        } else {
            return Math.max(21, Math.min(40, 20 + Math.ceil(elapsedSeconds / 60) || 21));
        }
    };

    const openGoalModal = (side: 'home' | 'away') => {
        if (!selectedMatch) return;
        const isHome = side === 'home';
        const teamKey = isHome ? selectedMatch.homeTeamKey : selectedMatch.awayTeamKey;
        const teamName = isHome ? selectedMatch.homeTeam?.name : selectedMatch.awayTeam?.name;

        setPendingGoalTeam({
            side,
            teamKey: teamKey || '',
            teamName: teamName || (isHome ? 'Home Team' : 'Away Team')
        });
        setCustomPlayerName('');
    };

    const handleRecordGoal = async (player?: any) => {
        if (!selectedMatch || !pendingGoalTeam) return;

        const minute = getCurrentMatchMinute();
        const isHome = pendingGoalTeam.side === 'home';
        const newHomeScore = isHome ? matchState.homeScore + 1 : matchState.homeScore;
        const newAwayScore = !isHome ? matchState.awayScore + 1 : matchState.awayScore;

        const effectiveTeamKey = pendingGoalTeam.teamKey || (isHome ? selectedMatch.homeTeamKey : selectedMatch.awayTeamKey) || selectedMatch.id.toString();

        const newEvent = {
            id: `ev-${Date.now()}`,
            matchId: selectedMatch.id.toString(),
            teamKey: effectiveTeamKey,
            scorerPlayerId: player?.id || 'unassigned',
            scorerPlayerName: player?.name || (customPlayerName.trim() || 'Goal'),
            minute: minute
        };

        const nextEvents = [...goalEvents, newEvent];
        setGoalEvents(nextEvents);
        try {
            localStorage.setItem('dench_derby_events_v4', JSON.stringify(nextEvents));
        } catch {}

        await handleUpdateScore(newHomeScore, newAwayScore);

        try {
            await saveDerbyData({ goalEvents: nextEvents });
        } catch (e) {
            console.error("Failed to persist goal event", e);
        }

        setPendingGoalTeam(null);
        setCustomPlayerName('');
    };

    const handleDeleteGoal = async (eventToDelete: any) => {
        if (!selectedMatch) return;
        const isHome = eventToDelete.teamKey === selectedMatch.homeTeamKey;
        const newHomeScore = isHome ? Math.max(0, matchState.homeScore - 1) : matchState.homeScore;
        const newAwayScore = !isHome ? Math.max(0, matchState.awayScore - 1) : matchState.awayScore;

        const nextEvents = goalEvents.filter(ev => ev.id !== eventToDelete.id);
        setGoalEvents(nextEvents);
        try {
            localStorage.setItem('dench_derby_events_v4', JSON.stringify(nextEvents));
        } catch {}

        await handleUpdateScore(newHomeScore, newAwayScore);

        try {
            await saveDerbyData({ goalEvents: nextEvents });
        } catch (e) {
            console.error("Failed to delete goal event", e);
        }
    };

    const togglePlayPause = () => {
        setMatchState(prev => {
            if (!prev.isRunning && prev.timerSeconds === 1200) {
                // First click to start a half
                if (prev.currentHalf === 1 && selectedMatch) {
                    updateMatchScore(selectedMatch.id, prev.homeScore, prev.awayScore, 'LIVE').catch(console.error);
                }
                return { ...prev, isRunning: true, isPaused: false };
            }
            if (!prev.isRunning) {
                return { ...prev, isRunning: true, isPaused: false };
            }
            return { ...prev, isPaused: !prev.isPaused };
        });
    };

    const nextHalf = () => {
        if (matchState.currentHalf === 1) {
            setMatchState(prev => ({
                ...prev,
                currentHalf: 2,
                timerSeconds: 20 * 60,
                isRunning: false,
                isPaused: false,
                pauseSeconds: 60
            }));
        } else {
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

                try {
                    const savedMatches = localStorage.getItem('dench_derby_matches_v4');
                    if (savedMatches) {
                        const parsed = JSON.parse(savedMatches);
                        const target = parsed.find((m: any) => m.id === selectedMatch.id || m.id.toString() === selectedMatch.id.toString());
                        if (target) {
                            target.homeScore = matchState.homeScore;
                            target.awayScore = matchState.awayScore;
                            target.status = 'completed';
                            localStorage.setItem('dench_derby_matches_v4', JSON.stringify(parsed));
                        }
                    }
                } catch {}

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
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Manage live timing and official tournament match scores.</p>
                </div>

                {!selectedMatch ? (
                    <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '2.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                <UserCheck size={20} /> Select Fixture
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Choose the tournament match you are officiating right now.</p>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Loading tournament fixtures...</div>
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
                                    <span>Select match to officiate...</span>
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
                                        maxHeight: '340px',
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
                                                        padding: '0.9rem 1rem',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                        color: 'white',
                                                        transition: 'background-color 0.2s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                                        e.currentTarget.style.color = 'var(--color-primary)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                                        {m.stageBadge && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                textTransform: 'uppercase',
                                                                backgroundColor: m.stage === 'final' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                                                                color: m.stage === 'final' ? '#eab308' : 'var(--color-primary)',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '4px',
                                                                border: `1px solid ${m.stage === 'final' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`
                                                            }}>
                                                                {m.stageBadge}
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                            Pitch {m.pitchNumber} • {m.time}
                                                        </span>
                                                        {m.status === 'COMPLETED' && (
                                                            <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, marginLeft: 'auto' }}>
                                                                FINAL ({m.homeScore} - {m.awayScore})
                                                            </span>
                                                        )}
                                                        {m.status === 'LIVE' && (
                                                            <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginLeft: 'auto' }}>
                                                                ● LIVE ({m.homeScore} - {m.awayScore})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.95rem' }}>
                                                        <span style={{ fontWeight: 700, color: '#fff' }}>{m.homeTeam?.name || 'TBD'}</span>
                                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0 0.5rem' }}>vs</span>
                                                        <span style={{ fontWeight: 700, color: '#fff' }}>{m.awayTeam?.name || 'TBD'}</span>
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
                                {selectedMatch.stageBadge && (
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            backgroundColor: selectedMatch.stage === 'final' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                                            color: selectedMatch.stage === 'final' ? '#eab308' : 'var(--color-primary)',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '4px',
                                            border: `1px solid ${selectedMatch.stage === 'final' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`
                                        }}>
                                            {selectedMatch.stageBadge}
                                        </span>
                                    </div>
                                )}
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                                    {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
                                </h3>
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', minWidth: '130px' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, color: 'white' }}>{matchState.homeScore}</div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', textAlign: 'center', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedMatch.homeTeam?.name}>
                                    {selectedMatch.homeTeam?.name || 'HOME'}
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    disabled={matchState.matchEnded}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '100%', fontWeight: 700 }}
                                    onClick={() => openGoalModal('home')}
                                >
                                    + Goal
                                </button>
                            </div>

                            <div style={{ fontSize: '2rem', color: 'var(--color-border)', fontWeight: 300, paddingBottom: '3rem' }}>-</div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', minWidth: '130px' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, color: 'white' }}>{matchState.awayScore}</div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', textAlign: 'center', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedMatch.awayTeam?.name}>
                                    {selectedMatch.awayTeam?.name || 'AWAY'}
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    disabled={matchState.matchEnded}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '100%', fontWeight: 700 }}
                                    onClick={() => openGoalModal('away')}
                                >
                                    + Goal
                                </button>
                            </div>
                        </div>

                        {/* Match Goal Events Timeline */}
                        {(() => {
                            const matchGoalEvents = goalEvents.filter(ev => ev.matchId === selectedMatch.id.toString());
                            return (
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                                            <span>⚽</span> Match Goal Timeline ({matchGoalEvents.length})
                                        </h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            Official Goalscorer Log
                                        </span>
                                    </div>

                                    {matchGoalEvents.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '1.2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                            No goals recorded yet. Click <strong>+ Goal</strong> above to log a goalscorer.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {matchGoalEvents.map(ev => {
                                                const isHomeGoal = ev.teamKey === selectedMatch.homeTeamKey;
                                                const teamName = isHomeGoal ? selectedMatch.homeTeam?.name : selectedMatch.awayTeam?.name;
                                                const player = tournamentPlayers.find(p => p.id === ev.scorerPlayerId);
                                                const displayName = player?.name || ev.scorerPlayerName || 'Goal';
                                                const jersey = player?.jerseyNumber ? `#${player.jerseyNumber}` : '';

                                                return (
                                                    <div key={ev.id} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '0.55rem 0.85rem',
                                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: '1px solid rgba(255,255,255,0.06)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <span style={{
                                                                backgroundColor: 'var(--color-primary)',
                                                                color: '#000',
                                                                fontWeight: 800,
                                                                fontSize: '0.75rem',
                                                                padding: '0.15rem 0.45rem',
                                                                borderRadius: '4px'
                                                            }}>
                                                                {ev.minute}'
                                                            </span>
                                                            <span style={{ fontSize: '1rem' }}>⚽</span>
                                                            <div>
                                                                <span style={{ fontWeight: 700, color: '#fff', marginRight: '0.5rem', fontSize: '0.9rem' }}>
                                                                    {displayName} {jersey && <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>{jersey}</span>}
                                                                </span>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                    ({teamName || 'Team'})
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {!matchState.matchEnded && (
                                                            <button
                                                                onClick={() => handleDeleteGoal(ev)}
                                                                title="Undo / Disallow Goal"
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'var(--color-text-muted)',
                                                                    cursor: 'pointer',
                                                                    padding: '0.25rem 0.5rem',
                                                                    borderRadius: '4px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    transition: 'color 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

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

                {/* Goal Scorer Modal */}
                {pendingGoalTeam && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}>
                        <div className="glass-card animate-fade-in" style={{
                            width: '100%',
                            maxWidth: '480px',
                            padding: '1.75rem',
                            backgroundColor: '#111',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                        }}>
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{
                                            backgroundColor: 'var(--color-primary)',
                                            color: '#000',
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '4px'
                                        }}>
                                            ⏱️ {getCurrentMatchMinute()}'
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Half {matchState.currentHalf}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                                        ⚽ Record Goal
                                    </h3>
                                    <div style={{ color: 'var(--color-primary)', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                        {pendingGoalTeam.teamName}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setPendingGoalTeam(null); setCustomPlayerName(''); }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Quick Goal Option */}
                            <button
                                onClick={() => handleRecordGoal()}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.85rem 1rem',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 700
                                }}
                            >
                                ⚡ Quick Goal (+1) • Unassigned
                            </button>

                            {/* Squad Players Selection */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Or Attribute to Squad Player:
                                </div>
                                {(() => {
                                    const availableSquadPlayers = tournamentPlayers.filter(p =>
                                        p && (
                                            p.teamKey === pendingGoalTeam.teamKey ||
                                            (selectedMatch && (
                                                (pendingGoalTeam.side === 'home' && p.teamKey === selectedMatch.homeTeamKey) ||
                                                (pendingGoalTeam.side === 'away' && p.teamKey === selectedMatch.awayTeamKey)
                                            ))
                                        )
                                    );

                                    if (availableSquadPlayers.length === 0) {
                                        return (
                                            <div style={{
                                                padding: '1rem',
                                                backgroundColor: 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                textAlign: 'center',
                                                color: 'var(--color-text-muted)',
                                                fontSize: '0.85rem'
                                            }}>
                                                No registered squad players yet for {pendingGoalTeam.teamName}.
                                            </div>
                                        );
                                    }

                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                            {availableSquadPlayers.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleRecordGoal(p)}
                                                    style={{
                                                        padding: '0.6rem 0.75rem',
                                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.15rem',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
                                                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                                                            #{p.jerseyNumber || '-'}
                                                        </span>
                                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {p.name}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                        {p.position || 'Player'}{p.isCaptain ? ' • Captain' : ''}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Custom Player Name Input */}
                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                    Or Type Guest / Goalscorer Name:
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sipho, Own Goal, etc."
                                        value={customPlayerName}
                                        onChange={(e) => setCustomPlayerName(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: 'rgba(0,0,0,0.4)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: '#fff',
                                            fontSize: '0.9rem'
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && customPlayerName.trim()) {
                                                e.preventDefault();
                                                handleRecordGoal();
                                            }
                                        }}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleRecordGoal()}
                                        disabled={!customPlayerName.trim()}
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Cancel Button */}
                            <button
                                onClick={() => { setPendingGoalTeam(null); setCustomPlayerName(''); }}
                                className="btn btn-outline"
                                style={{ width: '100%', padding: '0.6rem', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
