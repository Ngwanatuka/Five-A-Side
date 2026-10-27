import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { getMatches, updateMatchScore, getDerbyData, saveDerbyData, getPlayers, resetSingleMatch, claimRefereeMatch, getBackendUrl } from '../services/api';
import { Navbar } from '../components/Navbar';
import { ChevronDown, Flag, UserCheck, Play, Pause, Square, LogOut, Trash2, X, Sliders, RotateCcw, Lock, ShieldAlert } from 'lucide-react';
import { useToast, useConfirm } from '../components/Toast';
import { useRole } from '../context/RoleContext';

const socket = io(getBackendUrl());

type MatchFormat = 'continuous' | 'halves';
const CONTINUOUS_MATCH_SECONDS = 15 * 60;
const HALF_SECONDS = 20 * 60;

type MatchState = {
    homeScore: number;
    awayScore: number;
    currentHalf: 1 | 2;
    matchFormat: MatchFormat;
    timerSeconds: number;
    isRunning: boolean;
    isPaused: boolean;
    pauseSeconds: number; // Ticks down from 60
    matchEnded: boolean;
};

const DEFAULT_MATCH_STATE: MatchState = {
    homeScore: 0,
    awayScore: 0,
    currentHalf: 1,
    matchFormat: 'continuous',
    timerSeconds: CONTINUOUS_MATCH_SECONDS,
    isRunning: false,
    isPaused: false,
    pauseSeconds: 60,
    matchEnded: false
};

const getMatchDurationSeconds = (matchFormat: MatchFormat) =>
    matchFormat === 'halves' ? HALF_SECONDS : CONTINUOUS_MATCH_SECONDS;

const OFFICIAL_TEAMS_FALLBACK: Record<string, { name: string; group: 'A' | 'B' }> = {
    'team-dench': { name: 'Dench City FC', group: 'A' },
    'cpt-superstars': { name: 'BARCODE FC', group: 'A' },
    'bras-ba-kasi': { name: 'GSW FC', group: 'A' },
    'gauteng-warriors': { name: 'Mambisa FC', group: 'B' },
    'woza-madzala': { name: 'Ayoba fc', group: 'B' },
    'areyeng-fc': { name: 'Areyeng fc', group: 'B' },
};

export const MatchDayConsole = () => {
    const { toast } = useToast();
    const { confirm, ConfirmUI } = useConfirm();
    const { role } = useRole();
    const isAdmin = role === 'ADMIN';
    const [matches, setMatches] = useState<any[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
    const [matchState, setMatchState] = useState<MatchState>(DEFAULT_MATCH_STATE);
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Referee Official Station: Pitch 1 or Pitch 2
    const [refereePitchStation, setRefereePitchStation] = useState<number>(() => {
        const saved = localStorage.getItem('referee_pitch_station');
        if (saved === '1' || saved === '2') return Number(saved);
        const email = (localStorage.getItem('user_email') || '').toLowerCase();
        if (email.includes('referee2') || email.includes('admin@5aside')) return 2;
        return 1;
    });
    const [activeReferees, setActiveReferees] = useState<Record<string, any>>({});
    const [blockedMatchConflict, setBlockedMatchConflict] = useState<{
        match: any;
        message: string;
        recommendedMatch?: any;
    } | null>(null);
    const [pitchFilter, setPitchFilter] = useState<'my_pitch' | '1' | '2' | 'all'>('my_pitch');

    // Goal recording & squad players states
    const [tournamentPlayers, setTournamentPlayers] = useState<any[]>([]);
    const [goalEvents, setGoalEvents] = useState<any[]>([]);
    const [pendingGoalTeam, setPendingGoalTeam] = useState<{
        side: 'home' | 'away';
        teamKey: string;
        teamName: string;
    } | null>(null);
    const [customPlayerName, setCustomPlayerName] = useState('');

    // Knockout team override picker states
    const [isKnockoutPickerOpen, setIsKnockoutPickerOpen] = useState(false);
    const [selectedKnockoutHomeKey, setSelectedKnockoutHomeKey] = useState('');
    const [selectedKnockoutAwayKey, setSelectedKnockoutAwayKey] = useState('');
    const [availableTeamsMap, setAvailableTeamsMap] = useState<Record<string, any>>({});

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const activeMatchIdRef = useRef<string | null>(null);

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
                if (savedTeams) {
                    localTeams = JSON.parse(savedTeams);
                    if (localTeams['team-dench']?.name === 'Team Dench') localTeams['team-dench'].name = 'Dench City FC';
                    if (localTeams['cpt-superstars']?.name === 'CPT superstars fc') localTeams['cpt-superstars'].name = 'BARCODE FC';
                    if (localTeams['bras-ba-kasi']?.name === 'Bras ba kasi') localTeams['bras-ba-kasi'].name = 'GSW FC';
                    if (localTeams['gauteng-warriors']?.name === 'Gauteng state warriors') localTeams['gauteng-warriors'].name = 'Mambisa FC';
                    if (localTeams['woza-madzala']?.name === 'Woza madzala fc') localTeams['woza-madzala'].name = 'Ayoba fc';
                }
                const savedMatches = localStorage.getItem('dench_derby_matches_v4');
                if (savedMatches) {
                    localMatches = JSON.parse(savedMatches);
                    localMatches.forEach((m: any) => {
                        if (m.homePlaceholder === 'Team Dench') m.homePlaceholder = 'Dench City FC';
                        if (m.awayPlaceholder === 'CPT superstars fc') m.awayPlaceholder = 'BARCODE FC';
                        if (m.homePlaceholder === 'CPT superstars fc') m.homePlaceholder = 'BARCODE FC';
                        if (m.awayPlaceholder === 'Bras ba kasi') m.awayPlaceholder = 'GSW FC';
                        if (m.homePlaceholder === 'Bras ba kasi') m.homePlaceholder = 'GSW FC';
                        if (m.awayPlaceholder === 'Team Dench') m.awayPlaceholder = 'Dench City FC';
                        if (m.homePlaceholder === 'Gauteng state warriors') m.homePlaceholder = 'Mambisa FC';
                        if (m.awayPlaceholder === 'Woza madzala fc') m.awayPlaceholder = 'Ayoba fc';
                        if (m.homePlaceholder === 'Woza madzala fc') m.homePlaceholder = 'Ayoba fc';
                        if (m.awayPlaceholder === 'Gauteng state warriors') m.awayPlaceholder = 'Mambisa FC';
                    });
                }
                const savedPlayers = localStorage.getItem('dench_derby_players_v4');
                if (savedPlayers) localPlayers = JSON.parse(savedPlayers);
                const savedGoalEvents = localStorage.getItem('dench_derby_events_v4');
                if (savedGoalEvents) localGoalEvents = JSON.parse(savedGoalEvents);
            } catch (e) {
                console.error("Notice parsing local tournament storage:", e);
            }

            // 2. Fetch matches from API, remote derby data, and database players
            const [apiMatches, derbyRemote, dbPlayers] = await Promise.all([
                getMatches({ seasonId: 1, divisionId: 1, status: 'UPCOMING,LIVE,COMPLETED' }).catch(() => []),
                getDerbyData().catch(() => null),
                getPlayers().catch(() => [])
            ]);

            // Effective tournament teams: remote first, then local browser storage takes highest priority
            const effectiveTeams: Record<string, any> = {
                ...OFFICIAL_TEAMS_FALLBACK,
                ...(derbyRemote?.teams || {}),
                ...localTeams
            };

            // Merge all players from derbyRemote, dbPlayers, and local browser storage
            const playerMap = new Map<string, any>();
            if (Array.isArray(derbyRemote?.players)) {
                for (const p of derbyRemote.players) {
                    if (p && p.name && p.teamKey) {
                        playerMap.set(`${p.teamKey}_${p.name.trim().toLowerCase()}`, p);
                    }
                }
            }
            if (Array.isArray(dbPlayers)) {
                for (const dp of dbPlayers) {
                    const name = `${dp.firstName || ''} ${dp.lastName || ''}`.trim() || dp.name;
                    let teamKey = dp.teamKey;
                    if (!teamKey && dp.team) {
                        if (dp.team.managerContact && dp.team.managerContact.endsWith('@tournament.local')) {
                            teamKey = dp.team.managerContact.replace('@tournament.local', '');
                        } else if (dp.team.name) {
                            const foundKey = Object.keys(effectiveTeams).find(
                                k => effectiveTeams[k].name.toLowerCase() === dp.team.name.toLowerCase()
                            );
                            if (foundKey) teamKey = foundKey;
                        }
                    }
                    if (name && teamKey) {
                        const key = `${teamKey}_${name.toLowerCase()}`;
                        if (!playerMap.has(key)) {
                            playerMap.set(key, {
                                id: dp.id ? `p-${dp.id}` : `p-${Date.now()}`,
                                teamKey,
                                name,
                                jerseyNumber: dp.jerseyNumber || (Array.from(playerMap.values()).filter(p => p.teamKey === teamKey).length + 1),
                                position: dp.position || 'MID',
                                team: dp.team
                            });
                        }
                    }
                }
            }
            if (Array.isArray(localPlayers)) {
                for (const lp of localPlayers) {
                    if (lp && lp.name && lp.teamKey) {
                        const key = `${lp.teamKey}_${lp.name.trim().toLowerCase()}`;
                        if (!playerMap.has(key)) {
                            playerMap.set(key, lp);
                        }
                    }
                }
            }

            const effectivePlayers = Array.from(playerMap.values());
            const effectiveGoalEvents: any[] = localGoalEvents.length > 0 ? localGoalEvents : (derbyRemote?.goalEvents || []);

            setTournamentPlayers(effectivePlayers);
            setGoalEvents(effectiveGoalEvents);
            setAvailableTeamsMap(effectiveTeams);
            if (derbyRemote?.activeReferees) {
                setActiveReferees(derbyRemote.activeReferees);
            }

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

            // Primary source: intelligently merge server tournament matches with local storage matches
            const serverMatches: any[] = derbyRemote?.matches || [];
            const anyServerScored = serverMatches.some((m: any) => m.homeScore !== null || m.awayScore !== null || m.status === 'completed' || m.status === 'live');

            if (!anyServerScored && serverMatches.length > 0) {
                try {
                    localStorage.setItem('dench_derby_matches_v4', JSON.stringify(serverMatches));
                    localStorage.removeItem('dench_derby_events_v4');
                    localStorage.removeItem('active_match_id');
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const key = localStorage.key(i);
                        if (key && (key.startsWith('match_state_') || key === 'active_match_id')) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch {}
                activeMatchIdRef.current = null;
                setSelectedMatch(null);
                setMatchState(DEFAULT_MATCH_STATE);
            }

            const rawTournamentMatches = serverMatches.length > 0
                ? (anyServerScored
                    ? serverMatches.map(sm => {
                        const lm = localMatches.find((m: any) => m.id === sm.id || m.id.toString() === sm.id.toString());
                        if (!lm) return sm;
                        const isCompleted = sm.status === 'completed' || lm.status === 'completed';
                        const isLive = sm.status === 'live' || lm.status === 'live';
                        const effectiveStatus = isCompleted ? 'completed' : (isLive ? 'live' : (lm.status || sm.status || 'scheduled'));
                        const effectiveHome = sm.homeScore !== null && sm.homeScore !== undefined 
                            ? (lm.homeScore !== null && lm.homeScore !== undefined ? Math.max(sm.homeScore, lm.homeScore) : sm.homeScore)
                            : (lm.homeScore ?? null);
                        const effectiveAway = sm.awayScore !== null && sm.awayScore !== undefined 
                            ? (lm.awayScore !== null && lm.awayScore !== undefined ? Math.max(sm.awayScore, lm.awayScore) : sm.awayScore)
                            : (lm.awayScore ?? null);

                        return {
                            ...sm,
                            ...lm,
                            status: effectiveStatus,
                            homeScore: effectiveHome,
                            awayScore: effectiveAway
                        };
                    })
                    : serverMatches)
                : localMatches;

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
                    const mPitch = m.pitch || m.pitchNumber || 1;
                    const assignedClaim = (derbyRemote?.activeReferees && derbyRemote.activeReferees[String(mPitch)]?.matchId === m.id)
                        ? derbyRemote.activeReferees[String(mPitch)]
                        : (m.officiatedBy || null);

                    return {
                        id: m.id,
                        stage: m.stage,
                        group: m.group,
                        stageBadge,
                        time: m.time || '18:30',
                        pitchNumber: mPitch,
                        pitch: mPitch,
                        homeScore: m.homeScore ?? 0,
                        awayScore: m.awayScore ?? 0,
                        status: (m.status || 'scheduled').toUpperCase(),
                        officiatedBy: assignedClaim,
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
                    const mPitch = m.pitchNumber || m.pitch || 1;
                    const assignedClaim = (derbyRemote?.activeReferees && derbyRemote.activeReferees[String(mPitch)]?.matchId === m.id?.toString())
                        ? derbyRemote.activeReferees[String(mPitch)]
                        : (m.officiatedBy || null);

                    return {
                        ...m,
                        pitchNumber: mPitch,
                        pitch: mPitch,
                        stageBadge,
                        officiatedBy: assignedClaim,
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
                    setSelectedMatch((prev: any) => {
                        if (activeMatch.status === 'SCHEDULED' || activeMatch.status === 'UPCOMING' || (activeMatch.homeScore === 0 && activeMatch.awayScore === 0)) {
                            return activeMatch;
                        }
                        if (prev && prev.id.toString() === savedMatchId) {
                            return {
                                ...activeMatch,
                                homeScore: prev.homeScore ?? activeMatch.homeScore,
                                awayScore: prev.awayScore ?? activeMatch.awayScore,
                                status: prev.status ?? activeMatch.status,
                                officiatedBy: activeMatch.officiatedBy || prev.officiatedBy
                            };
                        }
                        return activeMatch;
                    });
                }
            } else if (selectedMatch) {
                const refreshed = combinedMatches.find((m: any) => m.id.toString() === selectedMatch.id.toString());
                if (refreshed) {
                    setSelectedMatch((prev: any) => {
                        if (refreshed.status === 'SCHEDULED' || refreshed.status === 'UPCOMING' || (refreshed.homeScore === 0 && refreshed.awayScore === 0)) {
                            return refreshed;
                        }
                        return {
                            ...refreshed,
                            homeScore: prev?.homeScore ?? refreshed.homeScore,
                            awayScore: prev?.awayScore ?? refreshed.awayScore,
                            status: prev?.status ?? refreshed.status,
                            officiatedBy: refreshed.officiatedBy || prev?.officiatedBy
                        };
                    });
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

        const handleScoreUpdate = (match: any) => {
            fetchFixtures();
            if (activeMatchIdRef.current && match?.id?.toString() === activeMatchIdRef.current) {
                setMatchState(prev => ({
                    ...prev,
                    homeScore: match.homeScore ?? prev.homeScore,
                    awayScore: match.awayScore ?? prev.awayScore
                }));
            }
        };

        const handleDerbyUpdate = () => {
            fetchFixtures();
        };

        const handleRefereeClaimUpdate = (claims: any) => {
            if (claims) setActiveReferees(claims);
            fetchFixtures();
        };

        const handleDerbyReset = () => {
            try {
                localStorage.removeItem('active_match_id');
                localStorage.removeItem('dench_derby_events_v4');
                localStorage.removeItem('dench_derby_matches_v4');
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('match_state_') || key === 'active_match_id')) {
                        localStorage.removeItem(key);
                    }
                }
            } catch {}
            activeMatchIdRef.current = null;
            setSelectedMatch(null);
            setMatchState(DEFAULT_MATCH_STATE);
            setGoalEvents([]);
            setActiveReferees({});
            fetchFixtures();
        };

        socket.on('scoreUpdate', handleScoreUpdate);
        socket.on('derbyUpdate', handleDerbyUpdate);
        socket.on('refereeClaimUpdate', handleRefereeClaimUpdate);
        socket.on('derbyReset', handleDerbyReset);
        socket.on('teamRegistered', fetchFixtures);
        socket.on('playerAdded', fetchFixtures);

        return () => {
            socket.off('scoreUpdate', handleScoreUpdate);
            socket.off('derbyUpdate', handleDerbyUpdate);
            socket.off('refereeClaimUpdate', handleRefereeClaimUpdate);
            socket.off('derbyReset', handleDerbyReset);
            socket.off('teamRegistered', fetchFixtures);
            socket.off('playerAdded', fetchFixtures);
        };
    }, []);

    // Save/Restore state from localStorage whenever selectedMatch changes
    useEffect(() => {
        if (!selectedMatch) {
            activeMatchIdRef.current = null;
            return;
        }

        const matchIdStr = selectedMatch.id.toString();

        // Only restore when switching to a DIFFERENT match
        if (activeMatchIdRef.current !== matchIdStr) {
            activeMatchIdRef.current = matchIdStr;
            const storageKey = `match_state_${matchIdStr}`;
            const saved = localStorage.getItem(storageKey);

            // Reconcile goals recorded in timeline for this match
            const matchEvents = goalEvents.filter(ev => ev.matchId === matchIdStr);
            const homeGoalsFromEvents = matchEvents.filter(ev => 
                ev.side === 'home' || 
                (selectedMatch.homeTeamKey && ev.teamKey === selectedMatch.homeTeamKey) ||
                (selectedMatch.homeTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.homeTeam.name))
            ).length;
            const awayGoalsFromEvents = matchEvents.filter(ev => 
                ev.side === 'away' || 
                (selectedMatch.awayTeamKey && ev.teamKey === selectedMatch.awayTeamKey) ||
                (selectedMatch.awayTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.awayTeam.name))
            ).length;

            const isScheduled = (selectedMatch.status || '').toUpperCase() === 'SCHEDULED';
            if (isScheduled && homeGoalsFromEvents === 0 && awayGoalsFromEvents === 0 && !saved) {
                setMatchState({
                    ...DEFAULT_MATCH_STATE,
                    homeScore: selectedMatch.homeScore ?? 0,
                    awayScore: selectedMatch.awayScore ?? 0
                });
            } else if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const matchFormat: MatchFormat =
                        parsed.matchFormat === 'halves' ||
                        (parsed.matchFormat == null && (parsed.currentHalf === 2 || parsed.timerSeconds > CONTINUOUS_MATCH_SECONDS))
                            ? 'halves'
                            : 'continuous';
                    const durationSeconds = getMatchDurationSeconds(matchFormat);
                    const timerSeconds = Number.isFinite(parsed.timerSeconds)
                        ? Math.max(0, Math.min(parsed.timerSeconds, durationSeconds))
                        : durationSeconds;
                    setMatchState({
                        ...DEFAULT_MATCH_STATE,
                        ...parsed,
                        matchFormat,
                        currentHalf: matchFormat === 'halves' && parsed.currentHalf === 2 ? 2 : 1,
                        timerSeconds,
                        homeScore: Math.max(parsed.homeScore ?? 0, homeGoalsFromEvents, selectedMatch.homeScore ?? 0),
                        awayScore: Math.max(parsed.awayScore ?? 0, awayGoalsFromEvents, selectedMatch.awayScore ?? 0)
                    });
                } catch {
                    setMatchState({
                        ...DEFAULT_MATCH_STATE,
                        homeScore: Math.max(homeGoalsFromEvents, selectedMatch.homeScore ?? 0),
                        awayScore: Math.max(awayGoalsFromEvents, selectedMatch.awayScore ?? 0)
                    });
                }
            } else {
                setMatchState({
                    ...DEFAULT_MATCH_STATE,
                    homeScore: Math.max(homeGoalsFromEvents, selectedMatch.homeScore ?? 0),
                    awayScore: Math.max(awayGoalsFromEvents, selectedMatch.awayScore ?? 0)
                });
            }
        }
    }, [selectedMatch?.id, goalEvents]);

    // Continuously persist current matchState to local storage for the active match
    useEffect(() => {
        if (!selectedMatch) return;
        const storageKey = `match_state_${selectedMatch.id}`;
        localStorage.setItem(storageKey, JSON.stringify(matchState));
    }, [matchState, selectedMatch?.id]);

    // Automatic reconciliation: If timeline has more goals logged than currently in matchState, sync them immediately
    useEffect(() => {
        if (!selectedMatch) return;
        const matchIdStr = selectedMatch.id.toString();

        const matchEvents = goalEvents.filter(ev => ev.matchId === matchIdStr);
        if (matchEvents.length === 0) return;

        const homeCount = matchEvents.filter(ev => 
            ev.side === 'home' || 
            (selectedMatch.homeTeamKey && ev.teamKey === selectedMatch.homeTeamKey) ||
            (selectedMatch.homeTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.homeTeam.name))
        ).length;

        const awayCount = matchEvents.filter(ev => 
            ev.side === 'away' || 
            (selectedMatch.awayTeamKey && ev.teamKey === selectedMatch.awayTeamKey) ||
            (selectedMatch.awayTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.awayTeam.name))
        ).length;

        if (homeCount > matchState.homeScore || awayCount > matchState.awayScore) {
            const nextHome = Math.max(matchState.homeScore, homeCount);
            const nextAway = Math.max(matchState.awayScore, awayCount);
            handleUpdateScore(nextHome, nextAway);
        }
    }, [selectedMatch?.id, goalEvents, matchState.homeScore, matchState.awayScore]);

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

    const handleSwitchStation = (pitch: number) => {
        if (matchState.isRunning) {
            toast.error("Cannot change official pitch station while a match clock is actively running.");
            return;
        }
        setRefereePitchStation(pitch);
        localStorage.setItem('referee_pitch_station', String(pitch));
        // If current match belongs to the other pitch, exit it safely
        if (selectedMatch && Number(selectedMatch.pitchNumber || selectedMatch.pitch || 1) !== pitch) {
            setSelectedMatch(null);
            localStorage.removeItem('active_match_id');
            activeMatchIdRef.current = null;
        }
        toast.success(`Active Station: Referee ${pitch} (Pitch ${pitch} Official)`);
    };

    const handleSelectMatch = (matchId: string) => {
        const match = matches.find(m => m.id.toString() === matchId);
        if (!match) return;

        const matchPitch = Number(match.pitchNumber || match.pitch || 1);
        const currentPitch = Number(refereePitchStation);
        const isMatchLive = (match.status || '').toUpperCase() === 'LIVE';

        // Check if the other pitch referee is currently officiating/playing this match
        const claimOnOtherPitch = activeReferees[String(matchPitch)]?.matchId === match.id.toString() && matchPitch !== currentPitch;
        const isOfficiatedByOther = (isMatchLive || claimOnOtherPitch) && (
            matchPitch !== currentPitch ||
            (match.officiatedBy && Number(match.officiatedBy.pitch) !== currentPitch)
        );

        if (isOfficiatedByOther) {
            const otherRefName = match.officiatedBy?.refereeName || activeReferees[String(matchPitch)]?.refereeName || `Referee ${matchPitch}`;
            const myPitchMatches = matches.filter(m => Number(m.pitchNumber || m.pitch || 1) === currentPitch);
            const myRecommended = myPitchMatches.find(m => (m.status || '').toUpperCase() === 'LIVE') ||
                                  myPitchMatches.find(m => (m.status || '').toUpperCase() !== 'COMPLETED') ||
                                  myPitchMatches[0];

            setBlockedMatchConflict({
                match,
                message: `This match (${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}) is currently playing on Pitch ${matchPitch} and is actively being officiated by ${otherRefName}. Two simultaneous matches can only be officiated by two separate referees. You cannot officiate another referee's active match.`,
                recommendedMatch: myRecommended
            });
            setIsDropdownOpen(false);
            return;
        }

        setSelectedMatch(match);
        localStorage.setItem('active_match_id', match.id.toString());
        setIsDropdownOpen(false);
    };

    const handleUpdateScore = async (home: number, away: number, claimOverride?: any) => {
        if (!selectedMatch) return;
        const matchIdStr = selectedMatch.id.toString();
        const currentStatus = matchState.matchEnded ? 'COMPLETED' : 'LIVE';
        const effectiveClaim = claimOverride || selectedMatch.officiatedBy || {
            refereeName: `Referee ${refereePitchStation}`,
            pitch: refereePitchStation,
            startedAt: new Date().toISOString()
        };

        // 1. Immediately update matchState in memory and localStorage synchronously
        setMatchState(prev => {
            const next = { ...prev, homeScore: home, awayScore: away };
            try {
                localStorage.setItem(`match_state_${matchIdStr}`, JSON.stringify(next));
            } catch {}
            return next;
        });

        // 2. Update local matches state in console
        const updatedMatches = matches.map(m => {
            if (m.id.toString() === matchIdStr) {
                return {
                    ...m,
                    homeScore: home,
                    awayScore: away,
                    status: currentStatus,
                    officiatedBy: currentStatus === 'LIVE' ? effectiveClaim : m.officiatedBy
                };
            }
            return m;
        });
        setMatches(updatedMatches);
        setSelectedMatch((prev: any) => prev ? {
            ...prev,
            homeScore: home,
            awayScore: away,
            status: currentStatus,
            officiatedBy: currentStatus === 'LIVE' ? effectiveClaim : prev.officiatedBy
        } : null);

        // 3. Synchronize tournament matches so Dench Derby tournament page reflects immediately
        try {
            const savedMatches = localStorage.getItem('dench_derby_matches_v4');
            if (savedMatches) {
                const parsed = JSON.parse(savedMatches);
                const target = parsed.find((m: any) => m.id === selectedMatch.id || m.id.toString() === matchIdStr);
                if (target) {
                    target.homeScore = home;
                    target.awayScore = away;
                    target.status = currentStatus.toLowerCase();
                    if (currentStatus === 'LIVE') {
                        target.officiatedBy = effectiveClaim;
                    }
                    localStorage.setItem('dench_derby_matches_v4', JSON.stringify(parsed));
                    await saveDerbyData({ matches: parsed });
                }
            }
        } catch (syncErr) {
            console.error("Notice syncing live tournament matches:", syncErr);
        }

        // 4. Update backend score API
        try {
            await updateMatchScore(selectedMatch.id, home, away, currentStatus);
        } catch (e) {
            console.error('Failed to update score via API', e);
        }
    };

    // Store goal minutes as elapsed match time, including the first half in 20-minute-half matches.
    const getCurrentMatchMinute = (): number => {
        const isHalves = matchState.matchFormat === 'halves';
        const halfSeconds = isHalves ? HALF_SECONDS : CONTINUOUS_MATCH_SECONDS;
        const elapsedSeconds =
            (isHalves && matchState.currentHalf === 2 ? HALF_SECONDS : 0) +
            halfSeconds -
            matchState.timerSeconds;
        const matchMinutes = isHalves ? 2 * HALF_SECONDS / 60 : CONTINUOUS_MATCH_SECONDS / 60;
        return Math.max(1, Math.min(matchMinutes, Math.ceil(elapsedSeconds / 60) || 1));
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
        const effectiveTeamKey = pendingGoalTeam.teamKey || (isHome ? selectedMatch.homeTeamKey : selectedMatch.awayTeamKey) || selectedMatch.id.toString();

        const newEvent = {
            id: `ev-${Date.now()}`,
            matchId: selectedMatch.id.toString(),
            side: pendingGoalTeam.side,
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

        // Calculate scores from nextEvents
        const matchEvents = nextEvents.filter(ev => ev.matchId === selectedMatch.id.toString());
        const homeScoreFromEvents = matchEvents.filter(ev => 
            ev.side === 'home' || 
            ev.teamKey === selectedMatch.homeTeamKey ||
            (selectedMatch.homeTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.homeTeam.name))
        ).length;
        const awayScoreFromEvents = matchEvents.filter(ev => 
            ev.side === 'away' || 
            ev.teamKey === selectedMatch.awayTeamKey ||
            (selectedMatch.awayTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.awayTeam.name))
        ).length;

        const newHomeScore = Math.max(matchState.homeScore + (isHome ? 1 : 0), homeScoreFromEvents);
        const newAwayScore = Math.max(matchState.awayScore + (!isHome ? 1 : 0), awayScoreFromEvents);

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
        const isHome = eventToDelete.side === 'home' || eventToDelete.teamKey === selectedMatch.homeTeamKey;

        const nextEvents = goalEvents.filter(ev => ev.id !== eventToDelete.id);
        setGoalEvents(nextEvents);
        try {
            localStorage.setItem('dench_derby_events_v4', JSON.stringify(nextEvents));
        } catch {}

        const matchEvents = nextEvents.filter(ev => ev.matchId === selectedMatch.id.toString());
        const homeScoreFromEvents = matchEvents.filter(ev => 
            ev.side === 'home' || 
            ev.teamKey === selectedMatch.homeTeamKey ||
            (selectedMatch.homeTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.homeTeam.name))
        ).length;
        const awayScoreFromEvents = matchEvents.filter(ev => 
            ev.side === 'away' || 
            ev.teamKey === selectedMatch.awayTeamKey ||
            (selectedMatch.awayTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.awayTeam.name))
        ).length;

        const newHomeScore = isHome ? Math.max(0, homeScoreFromEvents) : matchState.homeScore;
        const newAwayScore = !isHome ? Math.max(0, awayScoreFromEvents) : matchState.awayScore;

        await handleUpdateScore(newHomeScore, newAwayScore);

        try {
            await saveDerbyData({ goalEvents: nextEvents });
        } catch (e) {
            console.error("Failed to delete goal event", e);
        }
    };

    const togglePlayPause = () => {
        if (!selectedMatch) return;
        const matchPitch = Number(selectedMatch.pitchNumber || selectedMatch.pitch || 1);

        if (matchPitch !== refereePitchStation) {
            toast.error(`You are assigned to Pitch ${refereePitchStation}. You cannot officiate or start matches for Pitch ${matchPitch}.`);
            return;
        }

        if (!matchState.isRunning && !matchState.matchEnded) {
            const refName = `Referee ${refereePitchStation}`;
            const claimInfo = {
                refereeName: refName,
                pitch: refereePitchStation,
                startedAt: new Date().toISOString()
            };

            claimRefereeMatch({
                matchId: selectedMatch.id.toString(),
                pitch: refereePitchStation,
                refereeName: refName,
                action: 'claim'
            }).catch(err => console.warn('Notice claiming match:', err));

            handleUpdateScore(matchState.homeScore, matchState.awayScore, claimInfo);
        }

        setMatchState(prev => {
            if (!prev.isRunning) {
                return { ...prev, isRunning: true, isPaused: false };
            }
            return { ...prev, isPaused: !prev.isPaused };
        });
    };

    const nextHalf = () => {
        if (matchState.matchFormat === 'halves' && matchState.currentHalf === 1) {
            setMatchState(prev => ({
                ...prev,
                currentHalf: 2,
                timerSeconds: HALF_SECONDS,
                isRunning: false,
                isPaused: false,
                pauseSeconds: 60
            }));
            return;
        }

        setMatchState(prev => ({
            ...prev,
            matchEnded: true,
            isRunning: false,
            isPaused: false
        }));
    };

    const finalizeWhistle = async () => {
        if (!selectedMatch) return;
        if (!await confirm({
            message: 'Are you sure you want to finalize this match? This cannot be undone.',
            confirmLabel: 'Finalize Match',
            danger: true,
        })) {
            return;
        }

        const matchIdStr = selectedMatch.id.toString();

        // Reconcile goals from timeline to make 100% sure the final whistle never submits 0 if goals were scored
        const matchEvents = goalEvents.filter(ev => ev.matchId === matchIdStr);
        const homeGoalCount = matchEvents.filter(ev =>
            ev.side === 'home' ||
            (selectedMatch.homeTeamKey && ev.teamKey === selectedMatch.homeTeamKey) ||
            (selectedMatch.homeTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.homeTeam.name))
        ).length;
        const awayGoalCount = matchEvents.filter(ev =>
            ev.side === 'away' ||
            (selectedMatch.awayTeamKey && ev.teamKey === selectedMatch.awayTeamKey) ||
            (selectedMatch.awayTeam?.name && ev.scorerPlayerName?.includes(selectedMatch.awayTeam.name))
        ).length;

        const finalHome = Math.max(matchState.homeScore, homeGoalCount);
        const finalAway = Math.max(matchState.awayScore, awayGoalCount);

        // Update in-memory matches state in console immediately
        const updatedMatches = matches.map(m => {
            if (m.id.toString() === matchIdStr) {
                return { ...m, homeScore: finalHome, awayScore: finalAway, status: 'COMPLETED' };
            }
            return m;
        });
        setMatches(updatedMatches);

        // Prepare local storage matches array
        let tournamentMatchesList: any[] = [];
        try {
            const saved = localStorage.getItem('dench_derby_matches_v4');
            if (saved) {
                tournamentMatchesList = JSON.parse(saved);
            }
        } catch {}

        if (!Array.isArray(tournamentMatchesList) || tournamentMatchesList.length === 0) {
            tournamentMatchesList = updatedMatches.map(m => ({
                id: m.id,
                stage: m.stage,
                group: m.group,
                homeTeamKey: m.homeTeamKey,
                awayTeamKey: m.awayTeamKey,
                homePlaceholder: m.homeTeam?.name,
                awayPlaceholder: m.awayTeam?.name,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                status: m.status?.toLowerCase(),
                time: m.time,
                pitch: m.pitchNumber
            }));
        }

        const target = tournamentMatchesList.find((m: any) => m.id === selectedMatch.id || m.id.toString() === matchIdStr);
        if (target) {
            target.homeScore = finalHome;
            target.awayScore = finalAway;
            target.status = 'completed';
        }

        localStorage.setItem('dench_derby_matches_v4', JSON.stringify(tournamentMatchesList));

        // Sync to server API and Derby Data
        try {
            await Promise.all([
                updateMatchScore(selectedMatch.id, finalHome, finalAway, 'COMPLETED'),
                saveDerbyData({ matches: tournamentMatchesList, goalEvents })
            ]);
        } catch (syncErr) {
            console.error("Notice syncing final score to server:", syncErr);
        }

        // Release referee claim on server
        claimRefereeMatch({
            matchId: selectedMatch.id.toString(),
            pitch: refereePitchStation,
            action: 'release'
        }).catch(() => {});

        localStorage.removeItem(`match_state_${selectedMatch.id}`);
        localStorage.removeItem('active_match_id');
        activeMatchIdRef.current = null;
        setSelectedMatch(null);
        fetchFixtures();
    };

    const handleExitMatch = () => {
        if (selectedMatch) {
            localStorage.removeItem('active_match_id');
        }
        setSelectedMatch(null);
    };

    const handleResetSelectedMatch = async () => {
        if (!selectedMatch) return;
        if (!isAdmin) {
            toast.error('Only an administrator can reset match results.');
            return;
        }

        const homeName = availableTeamsMap[selectedMatch.homeTeamKey]?.name || selectedMatch.homePlaceholder || 'Home Team';
        const awayName = availableTeamsMap[selectedMatch.awayTeamKey]?.name || selectedMatch.awayPlaceholder || 'Away Team';

        if (!await confirm({
            message: `Reset match "${homeName} vs ${awayName}" to Scheduled (0-0, 0 played)?`,
            confirmLabel: 'Reset Match',
            danger: true,
        })) {
            return;
        }

        claimRefereeMatch({
            matchId: selectedMatch.id.toString(),
            pitch: Number(selectedMatch.pitchNumber || selectedMatch.pitch || 1),
            action: 'release'
        }).catch(() => {});

        let resetResult: Awaited<ReturnType<typeof resetSingleMatch>>;
        try {
            resetResult = await resetSingleMatch(selectedMatch.id.toString());
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to reset match.');
            return;
        }

        localStorage.setItem('dench_derby_matches_v4', JSON.stringify(resetResult.payload.matches));
        localStorage.setItem('dench_derby_events_v4', JSON.stringify(resetResult.payload.goalEvents));
        try {
            localStorage.removeItem(`match_state_${selectedMatch.id}`);
            localStorage.removeItem('active_match_id');
        } catch {}

        activeMatchIdRef.current = null;
        setMatchState(DEFAULT_MATCH_STATE);
        setSelectedMatch(null);
        toast.success('Match reset to scheduled.');
        fetchFixtures();
    };

    const openKnockoutTeamPicker = () => {
        if (!selectedMatch) return;
        setSelectedKnockoutHomeKey(selectedMatch.homeTeamKey || '');
        setSelectedKnockoutAwayKey(selectedMatch.awayTeamKey || '');
        setIsKnockoutPickerOpen(true);
    };

    const handleSaveKnockoutTeams = async () => {
        if (!selectedMatch) return;

        const updatedMatches = matches.map(m => {
            if (m.id.toString() === selectedMatch.id.toString()) {
                const homeName = availableTeamsMap[selectedKnockoutHomeKey]?.name || m.homeTeam?.name;
                const awayName = availableTeamsMap[selectedKnockoutAwayKey]?.name || m.awayTeam?.name;
                return {
                    ...m,
                    homeTeamKey: selectedKnockoutHomeKey,
                    awayTeamKey: selectedKnockoutAwayKey,
                    homeTeam: { id: selectedKnockoutHomeKey, name: homeName },
                    awayTeam: { id: selectedKnockoutAwayKey, name: awayName }
                };
            }
            return m;
        });

        setMatches(updatedMatches);

        const refreshed = updatedMatches.find(m => m.id.toString() === selectedMatch.id.toString());
        if (refreshed) setSelectedMatch(refreshed);

        try {
            localStorage.setItem('dench_derby_matches_v4', JSON.stringify(updatedMatches));
            await saveDerbyData({ matches: updatedMatches });
        } catch (e) {
            console.error("Failed to save knockout teams", e);
        }

        setIsKnockoutPickerOpen(false);
    };

    // Formatters
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Referee & Station Lock Calculations
    const selectedMatchPitch = selectedMatch ? Number(selectedMatch.pitchNumber || selectedMatch.pitch || 1) : 1;
    const isSelectedMatchLive = selectedMatch ? (selectedMatch.status || '').toUpperCase() === 'LIVE' : false;
    const claimOnOtherPitch = selectedMatch ? ((activeReferees[String(selectedMatchPitch)]?.matchId === selectedMatch.id.toString()) && selectedMatchPitch !== refereePitchStation) : false;
    const isLockedToOtherRef = Boolean(selectedMatch && (isSelectedMatchLive || claimOnOtherPitch) && (
        selectedMatchPitch !== refereePitchStation ||
        (selectedMatch.officiatedBy && Number(selectedMatch.officiatedBy.pitch) !== refereePitchStation)
    ));
    const otherRefName = selectedMatch ? (selectedMatch.officiatedBy?.refereeName || activeReferees[String(selectedMatchPitch)]?.refereeName || `Referee ${selectedMatchPitch}`) : '';

    return (
        <div className="app-container">
            <Navbar />
            <ConfirmUI />

            <main className="main-content flex-center animate-fade-in" style={{ flex: 1, flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div className="flex-center" style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-primary)', borderRadius: '1rem', margin: '0 auto 1.25rem auto' }}>
                        <Flag size={32} color="#050505" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Match Day Console</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Official Referee Console • Two matches can only be officiated by two separate referees simultaneously.
                    </p>
                </div>

                {/* Designated Official Station Bar */}
                <div style={{
                    width: '100%',
                    maxWidth: selectedMatch ? '700px' : '560px',
                    marginBottom: '1.5rem',
                    padding: '0.85rem 1.25rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '1.35rem' }}>⏱️</span>
                        <div>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px', fontWeight: 600 }}>
                                Designated Official Station
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Referee {refereePitchStation} • Pitch {refereePitchStation} Official</span>
                                <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    backgroundColor: refereePitchStation === 1 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                    color: refereePitchStation === 1 ? 'var(--color-primary)' : '#60a5fa',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    border: `1px solid ${refereePitchStation === 1 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                                }}>
                                    ACTIVE PITCH {refereePitchStation}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Switch Station:</span>
                        <button
                            type="button"
                            onClick={() => handleSwitchStation(1)}
                            disabled={matchState.isRunning}
                            style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-sm)',
                                border: refereePitchStation === 1 ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                backgroundColor: refereePitchStation === 1 ? 'var(--color-primary)' : 'transparent',
                                color: refereePitchStation === 1 ? '#000' : 'var(--color-text-muted)',
                                cursor: matchState.isRunning ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Pitch 1
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchStation(2)}
                            disabled={matchState.isRunning}
                            style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-sm)',
                                border: refereePitchStation === 2 ? '1px solid #60a5fa' : '1px solid var(--color-border)',
                                backgroundColor: refereePitchStation === 2 ? '#60a5fa' : 'transparent',
                                color: refereePitchStation === 2 ? '#000' : 'var(--color-text-muted)',
                                cursor: matchState.isRunning ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Pitch 2
                        </button>
                    </div>
                </div>

                {!selectedMatch ? (
                    <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '2.5rem' }}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <h2 className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                <UserCheck size={20} /> Select Fixture
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                Choose the tournament match you are officiating on <strong>Pitch {refereePitchStation}</strong>.
                            </p>
                        </div>

                        {/* Pitch Filter Pills */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => setPitchFilter('my_pitch')}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: pitchFilter === 'my_pitch' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                                    color: pitchFilter === 'my_pitch' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    border: pitchFilter === 'my_pitch' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    cursor: 'pointer'
                                }}
                            >
                                ⭐ My Pitch ({refereePitchStation})
                            </button>
                            <button
                                type="button"
                                onClick={() => setPitchFilter('1')}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: pitchFilter === '1' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: pitchFilter === '1' ? '#fff' : 'var(--color-text-muted)',
                                    border: '1px solid var(--color-border)',
                                    cursor: 'pointer'
                                }}
                            >
                                Pitch 1
                            </button>
                            <button
                                type="button"
                                onClick={() => setPitchFilter('2')}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: pitchFilter === '2' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: pitchFilter === '2' ? '#fff' : 'var(--color-text-muted)',
                                    border: '1px solid var(--color-border)',
                                    cursor: 'pointer'
                                }}
                            >
                                Pitch 2
                            </button>
                            <button
                                type="button"
                                onClick={() => setPitchFilter('all')}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: pitchFilter === 'all' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: pitchFilter === 'all' ? '#fff' : 'var(--color-text-muted)',
                                    border: '1px solid var(--color-border)',
                                    cursor: 'pointer'
                                }}
                            >
                                All ({matches.length})
                            </button>
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
                                        {(() => {
                                            const filteredMatches = matches.filter(m => {
                                                const p = Number(m.pitchNumber || m.pitch || 1);
                                                if (pitchFilter === 'my_pitch') return p === refereePitchStation;
                                                if (pitchFilter === '1') return p === 1;
                                                if (pitchFilter === '2') return p === 2;
                                                return true;
                                            });

                                            if (filteredMatches.length === 0) {
                                                return <div style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No matches found for this filter</div>;
                                            }

                                            return filteredMatches.map(m => {
                                                const mPitch = Number(m.pitchNumber || m.pitch || 1);
                                                const isLive = (m.status || '').toUpperCase() === 'LIVE';
                                                const claimOnOther = (activeReferees[String(mPitch)]?.matchId === m.id.toString()) && mPitch !== refereePitchStation;
                                                const isLocked = (isLive || claimOnOther) && (
                                                    mPitch !== refereePitchStation ||
                                                    (m.officiatedBy && Number(m.officiatedBy.pitch) !== refereePitchStation)
                                                );
                                                const refName = m.officiatedBy?.refereeName || activeReferees[String(mPitch)]?.refereeName || `Referee ${mPitch}`;

                                                return (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => {
                                                            handleSelectMatch(m.id.toString());
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '0.9rem 1rem',
                                                            cursor: isLocked ? 'not-allowed' : 'pointer',
                                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                            backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                                                            borderLeft: isLocked ? '4px solid #ef4444' : '4px solid transparent',
                                                            color: 'white',
                                                            transition: 'background-color 0.2s ease',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isLocked) {
                                                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                                                e.currentTarget.style.color = 'var(--color-primary)';
                                                            } else {
                                                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = isLocked ? 'rgba(239, 68, 68, 0.08)' : 'transparent';
                                                            e.currentTarget.style.color = 'white';
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
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
                                                            {isLocked ? (
                                                                <span style={{
                                                                    fontSize: '0.7rem',
                                                                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                                                                    color: '#ef4444',
                                                                    fontWeight: 800,
                                                                    marginLeft: 'auto',
                                                                    padding: '0.15rem 0.5rem',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.3rem'
                                                                }}>
                                                                    <Lock size={11} /> LOCKED • REF {mPitch} ONLY
                                                                </span>
                                                            ) : m.status === 'COMPLETED' ? (
                                                                <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, marginLeft: 'auto' }}>
                                                                    FINAL ({m.homeScore} - {m.awayScore})
                                                                </span>
                                                            ) : m.status === 'LIVE' ? (
                                                                <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginLeft: 'auto' }}>
                                                                    ● LIVE ({m.homeScore} - {m.awayScore})
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div style={{ fontSize: '0.95rem' }}>
                                                            <span style={{ fontWeight: 700, color: '#fff' }}>{m.homeTeam?.name || 'TBD'}</span>
                                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0 0.5rem' }}>vs</span>
                                                            <span style={{ fontWeight: 700, color: '#fff' }}>{m.awayTeam?.name || 'TBD'}</span>
                                                        </div>
                                                        {isLocked && (
                                                            <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.25rem' }}>
                                                                Actively playing & officiated on Pitch {mPitch} by {refName}. Prohibited for other referee.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '700px', padding: '2.5rem', borderTop: '4px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Match In Progress by Other Referee Warning */}
                        {isLockedToOtherRef && (
                            <div style={{
                                padding: '1.25rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '2px solid rgba(239, 68, 68, 0.5)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                color: '#fca5a5'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <Lock size={22} color="#ef4444" />
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171' }}>
                                        MATCH LOCKED — OFFICIATED BY {otherRefName.toUpperCase()} ON PITCH {selectedMatchPitch}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#fecaca', lineHeight: 1.5 }}>
                                    Two simultaneous matches can only be officiated by two separate referees. This match is actively playing on Pitch {selectedMatchPitch} under {otherRefName}. You are stationed on <strong>Pitch {refereePitchStation}</strong> and are not allowed to control this match.
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleExitMatch}
                                        className="btn btn-primary"
                                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
                                    >
                                        Exit to Pitch {refereePitchStation} Fixtures
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Match Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    {selectedMatch.stageBadge && (
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
                                    )}
                                    {/* Referee override button for knockout matches */}
                                    {(selectedMatch.stage !== 'group' || selectedMatch.id.startsWith('sf-') || selectedMatch.id.startsWith('fn-')) && (
                                        <button
                                            onClick={openKnockoutTeamPicker}
                                            disabled={isLockedToOtherRef}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                backgroundColor: isLockedToOtherRef ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.18)',
                                                border: isLockedToOtherRef ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(59, 130, 246, 0.45)',
                                                color: isLockedToOtherRef ? 'var(--color-text-muted)' : '#60a5fa',
                                                padding: '0.2rem 0.65rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                cursor: isLockedToOtherRef ? 'not-allowed' : 'pointer',
                                                opacity: isLockedToOtherRef ? 0.5 : 1,
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => { if (!isLockedToOtherRef) e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)'; }}
                                            onMouseLeave={(e) => { if (!isLockedToOtherRef) e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.18)'; }}
                                            title="Manually choose or override which teams advanced to this stage"
                                        >
                                            <Sliders size={13} />
                                            Choose Advancing Teams
                                        </button>
                                    )}
                                </div>
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
                                {matchState.matchFormat === 'halves'
                                    ? `HALF ${matchState.currentHalf}`
                                    : '15 MIN MATCH • NO HALF TIME'}
                            </div>
                            <div style={{ fontSize: '5rem', fontWeight: 800, lineHeight: 1, color: matchState.isPaused ? '#eab308' : 'white', fontFamily: 'monospace' }}>
                                {formatTime(matchState.timerSeconds)}
                            </div>

                            {!matchState.isRunning && !matchState.isPaused && !matchState.matchEnded &&
                                matchState.currentHalf === 1 &&
                                matchState.timerSeconds === getMatchDurationSeconds(matchState.matchFormat) && (
                                    <div role="group" aria-label="Match format" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        {([
                                            { format: 'continuous' as const, label: '15 min • No halves' },
                                            { format: 'halves' as const, label: '20 min halves' }
                                        ]).map(({ format, label }) => {
                                            const selected = matchState.matchFormat === format;
                                            return (
                                                <button
                                                    key={format}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    onClick={() => setMatchState(prev => ({
                                                        ...prev,
                                                        matchFormat: format,
                                                        currentHalf: 1,
                                                        timerSeconds: getMatchDurationSeconds(format)
                                                    }))}
                                                    className={selected ? 'btn btn-primary' : 'btn btn-secondary'}
                                                    style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

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
                                        <button
                                            className="btn btn-primary flex-center gap-2"
                                            onClick={togglePlayPause}
                                            disabled={isLockedToOtherRef}
                                            style={{
                                                padding: '0.75rem 2rem',
                                                opacity: isLockedToOtherRef ? 0.4 : 1,
                                                cursor: isLockedToOtherRef ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <Play size={18} /> {!matchState.isRunning && matchState.timerSeconds === getMatchDurationSeconds(matchState.matchFormat)
                                                ? matchState.matchFormat === 'halves' ? `Start Half ${matchState.currentHalf}` : 'Start Match'
                                                : 'Resume'}
                                        </button>
                                    ) : (
                                        <button
                                            className="btn"
                                            onClick={togglePlayPause}
                                            disabled={isLockedToOtherRef}
                                            style={{
                                                padding: '0.75rem 2rem',
                                                backgroundColor: '#eab308',
                                                color: '#000',
                                                border: 'none',
                                                fontWeight: 600,
                                                display: 'flex',
                                                gap: '0.5rem',
                                                alignItems: 'center',
                                                opacity: isLockedToOtherRef ? 0.4 : 1,
                                                cursor: isLockedToOtherRef ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <Pause size={18} /> Pause Match
                                        </button>
                                    )}

                                    <button
                                        className="btn btn-secondary flex-center gap-2"
                                        onClick={nextHalf}
                                        disabled={isLockedToOtherRef || (matchState.timerSeconds > 0 && !matchState.isPaused)}
                                        style={{
                                            padding: '0.75rem 2rem',
                                            opacity: (isLockedToOtherRef || (matchState.timerSeconds > 0 && !matchState.isPaused)) ? 0.5 : 1,
                                            cursor: isLockedToOtherRef ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <Square size={18} /> {matchState.matchFormat === 'halves' && matchState.currentHalf === 1 ? 'End 1st Half' : 'End Match'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Score Board */}
                        <div style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', alignItems: 'center', padding: '1rem 0' }}>
                            {/* Home Side */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', minWidth: '140px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateScore(Math.max(0, matchState.homeScore - 1), matchState.awayScore)}
                                        disabled={isLockedToOtherRef || matchState.matchEnded || matchState.homeScore <= 0}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            borderRadius: '6px',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: (isLockedToOtherRef || matchState.homeScore <= 0) ? 'not-allowed' : 'pointer',
                                            opacity: (isLockedToOtherRef || matchState.homeScore <= 0) ? 0.35 : 1,
                                            fontWeight: 800,
                                            fontSize: '1.2rem',
                                            transition: 'all 0.15s ease'
                                        }}
                                        title="Decrease Home Score (-1)"
                                    >
                                        -
                                    </button>
                                    <div style={{ fontSize: '3.75rem', fontWeight: 800, lineHeight: 1, color: 'white', minWidth: '2ch', textAlign: 'center' }}>
                                        {matchState.homeScore}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateScore(matchState.homeScore + 1, matchState.awayScore)}
                                        disabled={isLockedToOtherRef || matchState.matchEnded}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            borderRadius: '6px',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: isLockedToOtherRef ? 'not-allowed' : 'pointer',
                                            opacity: isLockedToOtherRef ? 0.35 : 1,
                                            fontWeight: 800,
                                            fontSize: '1.2rem',
                                            transition: 'all 0.15s ease'
                                        }}
                                        title="Quick +1 Home Score"
                                    >
                                        +
                                    </button>
                                </div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', textAlign: 'center', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedMatch.homeTeam?.name}>
                                    {selectedMatch.homeTeam?.name || 'HOME'}
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    disabled={isLockedToOtherRef || matchState.matchEnded}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        fontSize: '0.9rem',
                                        width: '100%',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        opacity: isLockedToOtherRef ? 0.4 : 1,
                                        cursor: isLockedToOtherRef ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={() => openGoalModal('home')}
                                >
                                    <span>⚽</span> + Goal
                                </button>
                            </div>

                            <div style={{ fontSize: '2.5rem', color: 'var(--color-border)', fontWeight: 300, paddingBottom: '3rem' }}>-</div>

                            {/* Away Side */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', minWidth: '140px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateScore(matchState.homeScore, Math.max(0, matchState.awayScore - 1))}
                                        disabled={isLockedToOtherRef || matchState.matchEnded || matchState.awayScore <= 0}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            borderRadius: '6px',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: (isLockedToOtherRef || matchState.awayScore <= 0) ? 'not-allowed' : 'pointer',
                                            opacity: (isLockedToOtherRef || matchState.awayScore <= 0) ? 0.35 : 1,
                                            fontWeight: 800,
                                            fontSize: '1.2rem',
                                            transition: 'all 0.15s ease'
                                        }}
                                        title="Decrease Away Score (-1)"
                                    >
                                        -
                                    </button>
                                    <div style={{ fontSize: '3.75rem', fontWeight: 800, lineHeight: 1, color: 'white', minWidth: '2ch', textAlign: 'center' }}>
                                        {matchState.awayScore}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateScore(matchState.homeScore, matchState.awayScore + 1)}
                                        disabled={isLockedToOtherRef || matchState.matchEnded}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            borderRadius: '6px',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: isLockedToOtherRef ? 'not-allowed' : 'pointer',
                                            opacity: isLockedToOtherRef ? 0.35 : 1,
                                            fontWeight: 800,
                                            fontSize: '1.2rem',
                                            transition: 'all 0.15s ease'
                                        }}
                                        title="Quick +1 Away Score"
                                    >
                                        +
                                    </button>
                                </div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', textAlign: 'center', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedMatch.awayTeam?.name}>
                                    {selectedMatch.awayTeam?.name || 'AWAY'}
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    disabled={isLockedToOtherRef || matchState.matchEnded}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        fontSize: '0.9rem',
                                        width: '100%',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        opacity: isLockedToOtherRef ? 0.4 : 1,
                                        cursor: isLockedToOtherRef ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={() => openGoalModal('away')}
                                >
                                    <span>⚽</span> + Goal
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
                        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-outline flex-center gap-2" style={{ flex: 1, borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)' }} onClick={handleExitMatch}>
                                <LogOut size={16} /> Exit Match
                            </button>
                            <button className="btn btn-outline flex-center gap-2" disabled={!isAdmin || isLockedToOtherRef} style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444', opacity: (isAdmin && !isLockedToOtherRef) ? 1 : 0.55, cursor: (isAdmin && !isLockedToOtherRef) ? 'pointer' : 'not-allowed' }} onClick={handleResetSelectedMatch} title={isAdmin ? 'Reset match back to Scheduled (0-0, 0 played)' : 'Only an administrator can reset match results.'}>
                                <RotateCcw size={16} /> {isAdmin ? 'Reset to Scheduled' : 'Reset (Admin only)'}
                            </button>
                            <button className="btn btn-primary" disabled={!matchState.matchEnded || isLockedToOtherRef} style={{ flex: 2, backgroundColor: (matchState.matchEnded && !isLockedToOtherRef) ? '#16a34a' : 'var(--color-bg-card)', color: (matchState.matchEnded && !isLockedToOtherRef) ? '#fff' : 'var(--color-text-muted)', border: 'none', cursor: (matchState.matchEnded && !isLockedToOtherRef) ? 'pointer' : 'not-allowed' }} onClick={finalizeWhistle}>
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
                                            15 Min Match
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
                                    const availableSquadPlayers = tournamentPlayers.filter(p => {
                                        if (!p) return false;
                                        const matchKey = pendingGoalTeam.teamKey;
                                        const matchName = (pendingGoalTeam.teamName || '').toLowerCase().trim();
                                        const pTeamKey = p.teamKey;
                                        const pTeamName = (p.team?.name || availableTeamsMap[p.teamKey]?.name || '').toLowerCase().trim();

                                        return (
                                            pTeamKey === matchKey ||
                                            (matchName && pTeamName === matchName) ||
                                            (matchName && (p.teamKey || '').toLowerCase() === matchName) ||
                                            (selectedMatch && (
                                                (pendingGoalTeam.side === 'home' && (pTeamKey === selectedMatch.homeTeamKey || (selectedMatch.homePlaceholder && pTeamName === selectedMatch.homePlaceholder.toLowerCase()))) ||
                                                (pendingGoalTeam.side === 'away' && (pTeamKey === selectedMatch.awayTeamKey || (selectedMatch.awayPlaceholder && pTeamName === selectedMatch.awayPlaceholder.toLowerCase())))
                                            ))
                                        );
                                    });

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

                {/* Knockout Stage Advancing Teams Selector Modal */}
                {isKnockoutPickerOpen && selectedMatch && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}>
                        <div className="glass-card animate-scale-up" style={{
                            width: '100%',
                            maxWidth: '520px',
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                            padding: '1.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem'
                        }}>
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#60a5fa'
                                    }}>
                                        <Sliders size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Choose Advancing Teams</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>
                                            {selectedMatch.stageBadge || 'Knockout Stage'} • Pitch {selectedMatch.pitchNumber}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsKnockoutPickerOpen(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                The referee can manually choose or change the two clubs advancing to this stage (e.g. following group stage deciders or penalty shootouts).
                            </p>

                            {/* Home Team Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                    Home Team
                                </label>
                                <select
                                    value={selectedKnockoutHomeKey}
                                    onChange={(e) => setSelectedKnockoutHomeKey(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: '#fff',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        outline: 'none'
                                    }}
                                >
                                    <option value="" disabled>-- Select Home Team --</option>
                                    <optgroup label="Group A">
                                        {Object.entries(availableTeamsMap)
                                            .filter(([_, t]: any) => t?.group === 'A')
                                            .map(([key, t]: any) => (
                                                <option key={key} value={key}>{t?.name || key}</option>
                                            ))}
                                    </optgroup>
                                    <optgroup label="Group B">
                                        {Object.entries(availableTeamsMap)
                                            .filter(([_, t]: any) => t?.group === 'B')
                                            .map(([key, t]: any) => (
                                                <option key={key} value={key}>{t?.name || key}</option>
                                            ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Away Team Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                    Away Team
                                </label>
                                <select
                                    value={selectedKnockoutAwayKey}
                                    onChange={(e) => setSelectedKnockoutAwayKey(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: '#fff',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        outline: 'none'
                                    }}
                                >
                                    <option value="" disabled>-- Select Away Team --</option>
                                    <optgroup label="Group A">
                                        {Object.entries(availableTeamsMap)
                                            .filter(([_, t]: any) => t?.group === 'A')
                                            .map(([key, t]: any) => (
                                                <option key={key} value={key}>{t?.name || key}</option>
                                            ))}
                                    </optgroup>
                                    <optgroup label="Group B">
                                        {Object.entries(availableTeamsMap)
                                            .filter(([_, t]: any) => t?.group === 'B')
                                            .map(([key, t]: any) => (
                                                <option key={key} value={key}>{t?.name || key}</option>
                                            ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Warning if same team selected */}
                            {selectedKnockoutHomeKey && selectedKnockoutAwayKey && selectedKnockoutHomeKey === selectedKnockoutAwayKey && (
                                <div style={{
                                    padding: '0.6rem 0.8rem',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: '#f87171',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    ⚠️ Home and Away teams cannot be the same club.
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    onClick={() => setIsKnockoutPickerOpen(false)}
                                    className="btn btn-outline"
                                    style={{ flex: 1, padding: '0.65rem', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveKnockoutTeams}
                                    disabled={!selectedKnockoutHomeKey || !selectedKnockoutAwayKey || selectedKnockoutHomeKey === selectedKnockoutAwayKey}
                                    className="btn btn-primary"
                                    style={{
                                        flex: 2,
                                        padding: '0.65rem',
                                        fontWeight: 700,
                                        opacity: (!selectedKnockoutHomeKey || !selectedKnockoutAwayKey || selectedKnockoutHomeKey === selectedKnockoutAwayKey) ? 0.5 : 1,
                                        cursor: (!selectedKnockoutHomeKey || !selectedKnockoutAwayKey || selectedKnockoutHomeKey === selectedKnockoutAwayKey) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Confirm Advancing Teams
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conflict Modal: Two matches can only be officiated by two referees */}
                {blockedMatchConflict && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1.5rem'
                    }}>
                        <div className="glass-card animate-fade-in" style={{
                            width: '100%',
                            maxWidth: '520px',
                            padding: '2rem',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderTop: '5px solid #ef4444',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <ShieldAlert size={28} color="#ef4444" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#f87171', fontWeight: 800 }}>
                                        Action Prohibited
                                    </h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        Referee Conflict Safeguard Active
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                marginBottom: '1.25rem'
                            }}>
                                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Lock size={14} /> Locked Match Details
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                                    {blockedMatchConflict.match.homeTeam?.name || 'Home'} vs {blockedMatchConflict.match.awayTeam?.name || 'Away'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    Pitch {blockedMatchConflict.match.pitchNumber} • Scheduled {blockedMatchConflict.match.time} • Status: <span style={{ color: '#ef4444', fontWeight: 700 }}>● LIVE / PLAYING</span>
                                </div>
                            </div>

                            <p style={{ color: '#e2e8f0', fontSize: '0.92rem', lineHeight: '1.55', marginBottom: '1.5rem' }}>
                                Two simultaneous matches can only be officiated by two separate referees. Because this match is currently playing and being officiated on Pitch {blockedMatchConflict.match.pitchNumber}, you are not allowed to select or modify it.
                            </p>

                            {blockedMatchConflict.recommendedMatch && (
                                <div style={{
                                    padding: '0.85rem 1rem',
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                        👉 Available on Your Pitch (Pitch {refereePitchStation})
                                    </div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                                        {blockedMatchConflict.recommendedMatch.homeTeam?.name || 'Home'} vs {blockedMatchConflict.recommendedMatch.awayTeam?.name || 'Away'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                        Pitch {blockedMatchConflict.recommendedMatch.pitchNumber} • {blockedMatchConflict.recommendedMatch.time} ({blockedMatchConflict.recommendedMatch.status})
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => setBlockedMatchConflict(null)}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
                                >
                                    Dismiss
                                </button>
                                {blockedMatchConflict.recommendedMatch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const rec = blockedMatchConflict.recommendedMatch;
                                            setBlockedMatchConflict(null);
                                            handleSelectMatch(rec.id.toString());
                                        }}
                                        className="btn btn-primary"
                                        style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 700 }}
                                    >
                                        Officiate Pitch {refereePitchStation} Match
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
