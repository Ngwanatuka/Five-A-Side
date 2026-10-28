import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { useToast, useConfirm } from '../components/Toast';
import {
    Trophy,
    Calendar,
    Clock,
    Shield,
    Medal,
    Flame,
    Play,
    RotateCcw,
    Sparkles,
    Info,
    Users,
    Award,
    Share2,
    Sliders,
    Plus,
    UserPlus,
    X,
    Trash2,
    CheckCircle2,
    ClipboardList,
    Lock,
    Crown
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getDerbyData, saveDerbyData, resetDerbyData, resetSingleMatch, getBackendUrl, deletePlayer, setPlayerCaptain } from '../services/api';
import { useRole } from '../context/RoleContext';
import { DEFAULT_TOURNAMENT_PLAYERS, type TournamentPlayer } from '../data/tournamentPlayers';

const socket = io(getBackendUrl());

export type TeamInfo = {
    id: string;
    name: string;
    group: 'A' | 'B';
    color: string;
    secondaryColor: string;
    city: string;
    slogan: string;
    founded: string;
};

export type { TournamentPlayer };

const assignTeamCaptain = (
    roster: TournamentPlayer[],
    teamKey: string,
    captainPlayerId: string
): TournamentPlayer[] =>
    roster.map(player =>
        player.teamKey === teamKey
            ? { ...player, isCaptain: player.id === captainPlayerId }
            : player
    );

export type GoalEvent = {
    id: string;
    matchId: string;
    teamKey: string;
    scorerPlayerId: string;
    assistPlayerId?: string | null;
    minute: number;
};

export type TournamentMatch = {
    id: string;
    stage: 'group' | 'semi' | 'final' | 'third_place';
    group?: 'A' | 'B';
    matchOrder: number;
    homeTeamKey: string | null;
    awayTeamKey: string | null;
    homePlaceholder: string;
    awayPlaceholder: string;
    time: string;
    pitch: number;
    homeScore: number | null;
    awayScore: number | null;
    status: 'scheduled' | 'live' | 'completed';
    note?: string;
};

export type GroupStanding = {
    teamKey: string;
    name: string;
    color: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
};

export const DEFAULT_TEAMS: Record<string, TeamInfo> = {
    'team-dench': {
        id: 'team-dench',
        name: 'Dench City FC',
        group: 'A',
        color: '#12b84c',
        secondaryColor: '#0ea141',
        city: 'Dench Grounds',
        slogan: 'The Pride of Dench City',
        founded: '2023'
    },
    'cpt-superstars': {
        id: 'cpt-superstars',
        name: 'BARCODE FC',
        group: 'A',
        color: '#3b82f6',
        secondaryColor: '#1d4ed8',
        city: 'Cape Town',
        slogan: 'Scanning The Field, Striking With Precision',
        founded: '2022'
    },
    'bras-ba-kasi': {
        id: 'bras-ba-kasi',
        name: 'GSW FC',
        group: 'A',
        color: '#f59e0b',
        secondaryColor: '#d97706',
        city: 'Gauteng',
        slogan: 'Golden State Warriors on Pitch',
        founded: '2021'
    },
    'gauteng-warriors': {
        id: 'gauteng-warriors',
        name: 'Mambisa FC',
        group: 'B',
        color: '#8b5cf6',
        secondaryColor: '#6d28d9',
        city: 'Mambisa',
        slogan: 'Royal Purple, Pure Football Flair',
        founded: '2022'
    },
    'woza-madzala': {
        id: 'woza-madzala',
        name: 'Ayoba fc',
        group: 'B',
        color: '#ef4444',
        secondaryColor: '#b91c1c',
        city: 'Ekurhuleni',
        slogan: 'Ayoba! Pure Kasi Magic & Speed',
        founded: '2020'
    },
    'areyeng-fc': {
        id: 'areyeng-fc',
        name: 'Areyeng fc',
        group: 'B',
        color: '#06b6d4',
        secondaryColor: '#0891b2',
        city: 'Tshwane',
        slogan: 'Forward Together, Never Back',
        founded: '2024'
    }
};

export const TEAMS = DEFAULT_TEAMS;

export const INITIAL_PLAYERS: TournamentPlayer[] = DEFAULT_TOURNAMENT_PLAYERS;

const DEFAULT_MATCHES: TournamentMatch[] = [
    // GROUP A MATCHES
    {
        id: 'ga-m1',
        stage: 'group',
        group: 'A',
        matchOrder: 1,
        homeTeamKey: 'team-dench',
        awayTeamKey: 'cpt-superstars',
        homePlaceholder: 'Dench City FC',
        awayPlaceholder: 'BARCODE FC',
        time: '18:30',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Opening Clash'
    },
    {
        id: 'ga-m2',
        stage: 'group',
        group: 'A',
        matchOrder: 3,
        homeTeamKey: 'cpt-superstars',
        awayTeamKey: 'bras-ba-kasi',
        homePlaceholder: 'BARCODE FC',
        awayPlaceholder: 'GSW FC',
        time: '19:05',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Round 2'
    },
    {
        id: 'ga-m3',
        stage: 'group',
        group: 'A',
        matchOrder: 5,
        homeTeamKey: 'bras-ba-kasi',
        awayTeamKey: 'team-dench',
        homePlaceholder: 'GSW FC',
        awayPlaceholder: 'Dench City FC',
        time: '19:40',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Decider'
    },

    // GROUP B MATCHES
    {
        id: 'gb-m1',
        stage: 'group',
        group: 'B',
        matchOrder: 2,
        homeTeamKey: 'gauteng-warriors',
        awayTeamKey: 'woza-madzala',
        homePlaceholder: 'Mambisa FC',
        awayPlaceholder: 'Ayoba fc',
        time: '18:30',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B High-Stakes Opener'
    },
    {
        id: 'gb-m2',
        stage: 'group',
        group: 'B',
        matchOrder: 4,
        homeTeamKey: 'woza-madzala',
        awayTeamKey: 'areyeng-fc',
        homePlaceholder: 'Ayoba fc',
        awayPlaceholder: 'Areyeng fc',
        time: '19:05',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B Round 2'
    },
    {
        id: 'gb-m3',
        stage: 'group',
        group: 'B',
        matchOrder: 6,
        homeTeamKey: 'areyeng-fc',
        awayTeamKey: 'gauteng-warriors',
        homePlaceholder: 'Areyeng fc',
        awayPlaceholder: 'Mambisa FC',
        time: '19:40',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B Decider'
    },

    // SEMI-FINALS
    {
        id: 'sf-1',
        stage: 'semi',
        matchOrder: 7,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Group A ( 1st spot )',
        awayPlaceholder: 'Group B ( 2nd spot )',
        time: '20:15',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Semi-Final 1'
    },
    {
        id: 'sf-2',
        stage: 'semi',
        matchOrder: 8,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Group A ( 2nd spot )',
        awayPlaceholder: 'Group B ( 1st spot )',
        time: '20:15',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Semi-Final 2'
    },

    // FINALS
    {
        id: 'fn-3rd',
        stage: 'third_place',
        matchOrder: 9,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'First match (Competing for 3rd spot)',
        awayPlaceholder: 'Loser SF 2',
        time: '20:55',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'First match (Competing for 3rd spot)'
    },
    {
        id: 'fn-gold',
        stage: 'final',
        matchOrder: 10,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Winner SF 1',
        awayPlaceholder: 'Winner SF 2',
        time: '21:00',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Second match ( Final Competing for 1st spot 🥇 )'
    }
];

const SIMULATED_SCORES: Record<string, { home: number; away: number }> = {
    'ga-m1': { home: 4, away: 2 },
    'gb-m1': { home: 3, away: 3 },
    'ga-m2': { home: 3, away: 1 },
    'gb-m2': { home: 2, away: 1 },
    'ga-m3': { home: 2, away: 3 },
    'gb-m3': { home: 1, away: 4 },
    'sf-1': { home: 3, away: 2 },
    'sf-2': { home: 2, away: 4 },
    'fn-3rd': { home: 3, away: 1 },
    'fn-gold': { home: 5, away: 4 }
};

export const SIMULATED_GOAL_EVENTS: GoalEvent[] = [];

const COLOR_PRESETS = [
    { label: 'Emerald Green', hex: '#12b84c' },
    { label: 'Electric Blue', hex: '#3b82f6' },
    { label: 'Amber Gold', hex: '#f59e0b' },
    { label: 'Crimson Red', hex: '#ef4444' },
    { label: 'Violet Purple', hex: '#8b5cf6' },
    { label: 'Neon Cyan', hex: '#06b6d4' },
    { label: 'Vibrant Orange', hex: '#f97316' },
    { label: 'Hot Pink', hex: '#ec4899' },
    { label: 'Lime Yellow', hex: '#84cc16' },
    { label: 'Midnight Slate', hex: '#64748b' }
];

export const DenchDerby = () => {
    const { role, captainTeamKey, captainTeamName, canEditTeam, isPastDeadline, deadlineRemaining, openRoleModal } = useRole();

    // 0. TEAMS STATE (Customizable & Editable)
    const [teams, setTeams] = useState<Record<string, TeamInfo>>(() => {
        try {
            const saved = localStorage.getItem('dench_derby_teams_v4');
            if (saved) {
                const parsed = JSON.parse(saved);
                let changed = false;
                if (parsed['team-dench']?.name === 'Team Dench') { parsed['team-dench'].name = 'Dench City FC'; changed = true; }
                if (parsed['cpt-superstars']?.name === 'CPT superstars fc') { parsed['cpt-superstars'].name = 'BARCODE FC'; changed = true; }
                if (parsed['bras-ba-kasi']?.name === 'Bras ba kasi') { parsed['bras-ba-kasi'].name = 'GSW FC'; changed = true; }
                if (parsed['gauteng-warriors']?.name === 'Gauteng state warriors') { parsed['gauteng-warriors'].name = 'Mambisa FC'; changed = true; }
                if (parsed['woza-madzala']?.name === 'Woza madzala fc') { parsed['woza-madzala'].name = 'Ayoba fc'; changed = true; }
                if (changed) {
                    localStorage.setItem('dench_derby_teams_v4', JSON.stringify(parsed));
                }
                return parsed;
            }
        } catch {
            // fallback
        }
        return DEFAULT_TEAMS;
    });

    // 1. MATCHES STATE
    const [matches, setMatches] = useState<TournamentMatch[]>(() => {
        try {
            const saved = localStorage.getItem('dench_derby_matches_v4');
            if (saved) {
                const parsed = JSON.parse(saved);
                let changed = false;
                parsed.forEach((m: any) => {
                    if (m.homePlaceholder === 'Team Dench') { m.homePlaceholder = 'Dench City FC'; changed = true; }
                    if (m.awayPlaceholder === 'CPT superstars fc') { m.awayPlaceholder = 'BARCODE FC'; changed = true; }
                    if (m.homePlaceholder === 'CPT superstars fc') { m.homePlaceholder = 'BARCODE FC'; changed = true; }
                    if (m.awayPlaceholder === 'Bras ba kasi') { m.awayPlaceholder = 'GSW FC'; changed = true; }
                    if (m.homePlaceholder === 'Bras ba kasi') { m.homePlaceholder = 'GSW FC'; changed = true; }
                    if (m.awayPlaceholder === 'Team Dench') { m.awayPlaceholder = 'Dench City FC'; changed = true; }
                    if (m.homePlaceholder === 'Gauteng state warriors') { m.homePlaceholder = 'Mambisa FC'; changed = true; }
                    if (m.awayPlaceholder === 'Woza madzala fc') { m.awayPlaceholder = 'Ayoba fc'; changed = true; }
                    if (m.homePlaceholder === 'Woza madzala fc') { m.homePlaceholder = 'Ayoba fc'; changed = true; }
                    if (m.awayPlaceholder === 'Gauteng state warriors') { m.awayPlaceholder = 'Mambisa FC'; changed = true; }

                    // Also synchronize accurate kickoff times & pitches for knockouts (18:30 start across 2 pitches)
                    if (m.id === 'sf-1') {
                        if (m.time === '15:00' || m.time === '20:20' || !m.time) { m.time = '20:15'; changed = true; }
                        if (m.pitch !== 1) { m.pitch = 1; changed = true; }
                    }
                    if (m.id === 'sf-2') {
                        if (m.time === '15:50' || m.time === '20:20' || !m.time) { m.time = '20:15'; changed = true; }
                        if (m.pitch !== 2) { m.pitch = 2; changed = true; }
                    }
                    if (m.id === 'fn-3rd') {
                        if (m.time === '16:45' || m.time === '21:05' || !m.time) { m.time = '20:55'; changed = true; }
                        if (m.pitch !== 2) { m.pitch = 2; changed = true; }
                    }
                    if (m.id === 'fn-gold') {
                        if (m.time === '17:30' || m.time === '21:40' || !m.time) { m.time = '21:00'; changed = true; }
                        if (m.pitch !== 1) { m.pitch = 1; changed = true; }
                    }
                });
                if (changed) {
                    localStorage.setItem('dench_derby_matches_v4', JSON.stringify(parsed));
                }
                return parsed;
            }
        } catch {
            // fallback
        }
        return DEFAULT_MATCHES;
    });

    // 2. PLAYERS STATE
    const [players, setPlayers] = useState<TournamentPlayer[]>(() => {
        try {
            const saved = localStorage.getItem('dench_derby_players_v4');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Filter out any mock players that were previously stored in localStorage
                    const filtered = parsed.filter(p =>
                        p && p.id &&
                        !p.id.startsWith('p-dench-') &&
                        !p.id.startsWith('p-cpt-') &&
                        !p.id.startsWith('p-bras-') &&
                        !p.id.startsWith('p-gaut-') &&
                        !p.id.startsWith('p-woza-') &&
                        !p.id.startsWith('p-arey-')
                    );
                    if (filtered.length > 0) return filtered;
                }
            }
        } catch {
            // fallback
        }
        return DEFAULT_TOURNAMENT_PLAYERS;
    });

    // 3. GOAL & ASSIST EVENTS STATE
    const [goalEvents, setGoalEvents] = useState<GoalEvent[]>(() => {
        try {
            const saved = localStorage.getItem('dench_derby_events_v4');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed.filter(ev =>
                        ev && ev.scorerPlayerId &&
                        !ev.scorerPlayerId.startsWith('p-dench-') &&
                        !ev.scorerPlayerId.startsWith('p-cpt-') &&
                        !ev.scorerPlayerId.startsWith('p-bras-') &&
                        !ev.scorerPlayerId.startsWith('p-gaut-') &&
                        !ev.scorerPlayerId.startsWith('p-woza-') &&
                        !ev.scorerPlayerId.startsWith('p-arey-')
                    );
                }
            }
        } catch {
            // fallback
        }
        return [];
    });

    // Helper for direct, instant persistence across local storage, REST, and DB
    const persistTournamentData = (
        newTeams: Record<string, TeamInfo>,
        newMatches: TournamentMatch[],
        newPlayers: TournamentPlayer[],
        newEvents: GoalEvent[],
        extraPayload?: Record<string, any>
    ) => {
        try {
            localStorage.setItem('dench_derby_teams_v4', JSON.stringify(newTeams));
            localStorage.setItem('dench_derby_matches_v4', JSON.stringify(newMatches));
            localStorage.setItem('dench_derby_players_v4', JSON.stringify(newPlayers));
            localStorage.setItem('dench_derby_events_v4', JSON.stringify(newEvents));
        } catch (e) {
            console.error('Failed to save to localStorage', e);
        }

        saveDerbyData({
            teams: newTeams,
            matches: newMatches,
            players: newPlayers,
            goalEvents: newEvents,
            ...(extraPayload || {})
        }).catch(err => {
            console.error('Failed to sync tournament data to server:', err);
        });
    };

    // Initial load from server + real-time cross-device sync via WebSockets
    useEffect(() => {
        let isMounted = true;
        const fetchRemote = async () => {
            try {
                const [data] = await Promise.all([
                    getDerbyData().catch(() => null)
                ]);

                if (isMounted) {
                    let localSavedTeams: any = null;
                    let localSavedPlayers: any[] = [];
                    try {
                        const rawTeams = localStorage.getItem('dench_derby_teams_v4');
                        if (rawTeams) localSavedTeams = JSON.parse(rawTeams);
                        const rawPlayers = localStorage.getItem('dench_derby_players_v4');
                        if (rawPlayers) localSavedPlayers = JSON.parse(rawPlayers);
                    } catch {}

                    // Combine remote teams with any local edits, prioritizing user's local edits if present
                    const effectiveTeams = {
                        ...(data?.teams || {}),
                        ...(localSavedTeams || {})
                    };

                    if (Object.keys(effectiveTeams).length > 0) {
                        setTeams(effectiveTeams);
                    }

                    // The server is the authoritative single source of truth for match fixtures and scores
                    const serverMatches = Array.isArray(data?.matches) && data.matches.length > 0 ? data.matches : DEFAULT_MATCHES;
                    const anyServerScored = serverMatches.some((m: any) => m.homeScore !== null || m.awayScore !== null || m.status === 'completed' || m.status === 'live');

                    const effectiveMatches = serverMatches;
                    setMatches(effectiveMatches);
                    try {
                        localStorage.setItem('dench_derby_matches_v4', JSON.stringify(effectiveMatches));
                        if (!anyServerScored) {
                            localStorage.removeItem('dench_derby_events_v4');
                            for (let i = localStorage.length - 1; i >= 0; i--) {
                                const key = localStorage.key(i);
                                if (key && (key.startsWith('match_state_') || key === 'active_match_id')) {
                                    localStorage.removeItem(key);
                                }
                            }
                        }
                    } catch {}

                    // Server JSON is the single source of truth for players
                    let unifiedPlayers: TournamentPlayer[] = [];
                    if (Array.isArray(data?.players) && data.players.length > 0) {
                        unifiedPlayers = data.players;
                    } else if (Array.isArray(localSavedPlayers) && localSavedPlayers.length > 0) {
                        // Offline fallback only
                        unifiedPlayers = localSavedPlayers;
                    } else {
                        unifiedPlayers = DEFAULT_TOURNAMENT_PLAYERS;
                    }
                    setPlayers(unifiedPlayers);
                    try {
                        localStorage.setItem('dench_derby_players_v4', JSON.stringify(unifiedPlayers));
                    } catch {}

                    if (Array.isArray(data?.goalEvents)) {
                        setGoalEvents(data.goalEvents);
                    }

                }
            } catch (e) {
                console.error('Remote derby fetch notice:', e);
            }
        };
        fetchRemote();

        const handleRemoteUpdate = (data: any) => {
            if (!data) return;
            if (data.teams && Object.keys(data.teams).length > 0) {
                setTeams(data.teams);
                try { localStorage.setItem('dench_derby_teams_v4', JSON.stringify(data.teams)); } catch {}
            }
            if (data.matches && data.matches.length > 0) {
                setMatches(data.matches);
                try {
                    localStorage.setItem('dench_derby_matches_v4', JSON.stringify(data.matches));
                    const anyScored = data.matches.some((m: any) => m.homeScore !== null || m.awayScore !== null || m.status === 'completed' || m.status === 'live');
                    if (!anyScored) {
                        localStorage.removeItem('dench_derby_events_v4');
                        for (let i = localStorage.length - 1; i >= 0; i--) {
                            const key = localStorage.key(i);
                            if (key && (key.startsWith('match_state_') || key === 'active_match_id')) {
                                localStorage.removeItem(key);
                            }
                        }
                    }
                } catch {}
            }
            if (Array.isArray(data.players)) {
                setPlayers(data.players);
                try { localStorage.setItem('dench_derby_players_v4', JSON.stringify(data.players)); } catch {}
            }
            if (Array.isArray(data.goalEvents)) {
                setGoalEvents(data.goalEvents);
                try { localStorage.setItem('dench_derby_events_v4', JSON.stringify(data.goalEvents)); } catch {}
            }
        };

        const handlePlayerDeleted = (deleted: any) => {
            if (deleted) {
                setPlayers(prev => prev.filter(p => {
                    if (deleted.id && p.id === deleted.id) return false;
                    if (deleted.dbId && (p.id === `p-${deleted.dbId}` || p.id === String(deleted.dbId))) return false;
                    if (deleted.teamKey && deleted.name && p.teamKey === deleted.teamKey && p.name.trim().toLowerCase() === deleted.name.trim().toLowerCase()) return false;
                    return true;
                }));
            }
        };

        socket.on('derbyUpdate', handleRemoteUpdate);
        socket.on('derbyReset', handleRemoteUpdate);
        socket.on('playerDeleted', handlePlayerDeleted);
        socket.on('playerAdded', () => { /* derbyUpdate socket handles the state update */ });

        return () => {
            isMounted = false;
            socket.off('derbyUpdate', handleRemoteUpdate);
            socket.off('derbyReset', handleRemoteUpdate);
            socket.off('playerDeleted', handlePlayerDeleted);
            socket.off('playerAdded');
        };
    }, []);

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<'bracket' | 'groups' | 'schedule' | 'leaderboard' | 'teams' | 'rules'>('bracket');

    // Add Player Modal State
    const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
    const [targetTeamKey, setTargetTeamKey] = useState<string>('team-dench');
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerNumber, setNewPlayerNumber] = useState('');
    const [newPlayerPosition, setNewPlayerPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
    const [newPlayerCaptain, setNewPlayerCaptain] = useState(false);

    // Edit Teams Modal State
    const [isEditTeamsOpen, setIsEditTeamsOpen] = useState(false);
    const [editTeamsMode, setEditTeamsMode] = useState<'quick' | 'detail'>('quick');
    const [selectedEditTeamKey, setSelectedEditTeamKey] = useState<string>('team-dench');

    // Quick rename buffer for all 6 teams
    const [quickTeamNames, setQuickTeamNames] = useState<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        Object.keys(DEFAULT_TEAMS).forEach(k => { map[k] = DEFAULT_TEAMS[k].name; });
        return map;
    });

    // Single team editor buffer
    const [editTeamData, setEditTeamData] = useState<TeamInfo>({
        id: 'team-dench',
        name: 'Team Dench',
        group: 'A',
        color: '#12b84c',
        secondaryColor: '#0ea141',
        city: 'Dench Grounds',
        slogan: 'Relentless Pace, Pure Passion',
        founded: '2023'
    });

    // Sync quickTeamNames and editTeamData when teams or selectedEditTeamKey change
    useEffect(() => {
        const map: Record<string, string> = {};
        Object.keys(teams).forEach(k => { map[k] = teams[k].name; });
        setQuickTeamNames(map);
    }, [teams]);

    useEffect(() => {
        if (teams[selectedEditTeamKey]) {
            setEditTeamData({ ...teams[selectedEditTeamKey] });
        }
    }, [selectedEditTeamKey, teams]);

    // Match Events & Score Modal State
    const [activeEventMatchId, setActiveEventMatchId] = useState<string | null>(null);
    const [eventTeamKey, setEventTeamKey] = useState<string>('');
    const [eventScorerId, setEventScorerId] = useState<string>('');
    const [eventAssistId, setEventAssistId] = useState<string>('');
    const [eventMinute, setEventMinute] = useState<number>(8);

    // Notification / Share
    const [copied, setCopied] = useState(false);

    // Secondary save safety: keep local storage updated
    useEffect(() => {
        try {
            localStorage.setItem('dench_derby_teams_v4', JSON.stringify(teams));
            localStorage.setItem('dench_derby_matches_v4', JSON.stringify(matches));
            if (players.length > 0) {
                localStorage.setItem('dench_derby_players_v4', JSON.stringify(players));
            }
            localStorage.setItem('dench_derby_events_v4', JSON.stringify(goalEvents));
        } catch (e) {
            console.error('Failed to save to localStorage', e);
        }
    }, [teams, matches, players, goalEvents]);

    // Countdown Timer calculation to 28 October 2026 18:30:00 SAST
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const targetDate = new Date('2026-10-28T18:30:00+02:00').getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft({ days, hours, minutes, seconds });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    // Standings calculation for Group A and Group B
    const calculateGroupStandings = (group: 'A' | 'B'): GroupStanding[] => {
        const teamKeys = Object.keys(teams).filter(key => teams[key].group === group);
        const map: Record<string, GroupStanding> = {};

        teamKeys.forEach(key => {
            map[key] = {
                teamKey: key,
                name: teams[key].name,
                color: teams[key].color,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0
            };
        });

        const groupMatches = matches.filter(m => m.stage === 'group' && m.group === group);

        groupMatches.forEach(m => {
            if (m.homeScore !== null && m.awayScore !== null && m.homeTeamKey && m.awayTeamKey) {
                const home = map[m.homeTeamKey];
                const away = map[m.awayTeamKey];
                if (!home || !away) return;

                home.played += 1;
                away.played += 1;
                home.goalsFor += m.homeScore;
                home.goalsAgainst += m.awayScore;
                away.goalsFor += m.awayScore;
                away.goalsAgainst += m.homeScore;

                if (m.homeScore > m.awayScore) {
                    home.won += 1;
                    home.points += 3;
                    away.lost += 1;
                } else if (m.homeScore < m.awayScore) {
                    away.won += 1;
                    away.points += 3;
                    home.lost += 1;
                } else {
                    home.drawn += 1;
                    away.drawn += 1;
                    home.points += 1;
                    away.points += 1;
                }

                home.goalDifference = home.goalsFor - home.goalsAgainst;
                away.goalDifference = away.goalsFor - away.goalsAgainst;
            }
        });

        return Object.values(map).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
    };

    const standingsA = useMemo(() => calculateGroupStandings('A'), [matches, teams]);
    const standingsB = useMemo(() => calculateGroupStandings('B'), [matches, teams]);
    const isGroupALive = useMemo(() => matches.some(m => m.stage === 'group' && m.group === 'A' && m.status === 'live'), [matches]);
    const isGroupBLive = useMemo(() => matches.some(m => m.stage === 'group' && m.group === 'B' && m.status === 'live'), [matches]);

    // Automatically derive Semi-Final and Final participants based on standings & matches
    const groupA1st = standingsA[0]?.played > 0 ? standingsA[0] : null;
    const groupA2nd = standingsA[1]?.played > 0 ? standingsA[1] : null;
    const groupB1st = standingsB[0]?.played > 0 ? standingsB[0] : null;
    const groupB2nd = standingsB[1]?.played > 0 ? standingsB[1] : null;

    // SF 1: Group A (1st spot) vs Group B (2nd spot) (or referee override)
    const sf1Match = matches.find(m => m.id === 'sf-1');
    const sf1HomeKey = sf1Match?.homeTeamKey || (groupA1st ? groupA1st.teamKey : null);
    const sf1AwayKey = sf1Match?.awayTeamKey || (groupB2nd ? groupB2nd.teamKey : null);

    // SF 2: Group A (2nd spot) vs Group B (1st spot) (or referee override)
    const sf2Match = matches.find(m => m.id === 'sf-2');
    const sf2HomeKey = sf2Match?.homeTeamKey || (groupA2nd ? groupA2nd.teamKey : null);
    const sf2AwayKey = sf2Match?.awayTeamKey || (groupB1st ? groupB1st.teamKey : null);

    // Determine SF winners & losers
    const getMatchOutcome = (match: TournamentMatch | undefined, homeKey: string | null, awayKey: string | null) => {
        if (!match || match.homeScore === null || match.awayScore === null || !homeKey || !awayKey) {
            return { winnerKey: null, loserKey: null };
        }
        if (match.homeScore > match.awayScore) {
            return { winnerKey: homeKey, loserKey: awayKey };
        } else if (match.awayScore > match.homeScore) {
            return { winnerKey: awayKey, loserKey: homeKey };
        }
        return { winnerKey: homeKey, loserKey: awayKey };
    };

    const sf1Outcome = getMatchOutcome(sf1Match, sf1HomeKey, sf1AwayKey);
    const sf2Outcome = getMatchOutcome(sf2Match, sf2HomeKey, sf2AwayKey);

    // 3rd place match: Loser SF 1 vs Loser SF 2 (or referee override)
    const thirdMatch = matches.find(m => m.id === 'fn-3rd');
    const thirdHomeKey = thirdMatch?.homeTeamKey || sf1Outcome.loserKey;
    const thirdAwayKey = thirdMatch?.awayTeamKey || sf2Outcome.loserKey;
    const thirdOutcome = getMatchOutcome(thirdMatch, thirdHomeKey, thirdAwayKey);

    // Final match (1st spot): Winner SF 1 vs Winner SF 2 (or referee override)
    const finalMatch = matches.find(m => m.id === 'fn-gold');
    const finalHomeKey = finalMatch?.homeTeamKey || sf1Outcome.winnerKey;
    const finalAwayKey = finalMatch?.awayTeamKey || sf2Outcome.winnerKey;
    const finalOutcome = getMatchOutcome(finalMatch, finalHomeKey, finalAwayKey);

    // Calculate individual player stats (Goals & Assists)
    const playerStatsMap = useMemo(() => {
        const map: Record<string, { goals: number; assists: number; matches: Set<string> }> = {};

        players.forEach(p => {
            map[p.id] = { goals: 0, assists: 0, matches: new Set() };
        });

        goalEvents.forEach(ev => {
            if (map[ev.scorerPlayerId]) {
                map[ev.scorerPlayerId].goals += 1;
                map[ev.scorerPlayerId].matches.add(ev.matchId);
            }
            if (ev.assistPlayerId && map[ev.assistPlayerId]) {
                map[ev.assistPlayerId].assists += 1;
                map[ev.assistPlayerId].matches.add(ev.matchId);
            }
        });

        return map;
    }, [players, goalEvents]);

    // Top Goalscorers (Golden Boot)
    const topScorers = useMemo(() => {
        return players
            .map(p => ({
                player: p,
                team: teams[p.teamKey],
                goals: playerStatsMap[p.id]?.goals || 0,
                assists: playerStatsMap[p.id]?.assists || 0,
                matchesPlayed: playerStatsMap[p.id]?.matches.size || 0
            }))
            .filter(item => item.goals > 0)
            .sort((a, b) => {
                if (b.goals !== a.goals) return b.goals - a.goals;
                if (b.assists !== a.assists) return b.assists - a.assists;
                return b.player.name.localeCompare(a.player.name);
            });
    }, [players, playerStatsMap, teams]);

    // Top Playmakers (Most Assists)
    const topAssists = useMemo(() => {
        return players
            .map(p => ({
                player: p,
                team: teams[p.teamKey],
                assists: playerStatsMap[p.id]?.assists || 0,
                goals: playerStatsMap[p.id]?.goals || 0,
                matchesPlayed: playerStatsMap[p.id]?.matches.size || 0
            }))
            .filter(item => item.assists > 0)
            .sort((a, b) => {
                if (b.assists !== a.assists) return b.assists - a.assists;
                if (b.goals !== a.goals) return b.goals - a.goals;
                return b.player.name.localeCompare(a.player.name);
            });
    }, [players, playerStatsMap, teams]);

    // Handlers for Players
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayerName.trim()) return;

        if (!canEditTeam(targetTeamKey)) {
            toast.warning('As Captain, you can only add players to your own assigned squad.');
            return;
        }

        let updated: TournamentPlayer[] = [];
        if (editingPlayerId) {
            updated = players.map(p => {
                if (p.id === editingPlayerId) {
                    return {
                        ...p,
                        teamKey: targetTeamKey,
                        name: newPlayerName.trim(),
                        jerseyNumber: parseInt(newPlayerNumber, 10) || p.jerseyNumber,
                        position: newPlayerPosition,
                        isCaptain: newPlayerCaptain
                    };
                }
                return p;
            });
            if (newPlayerCaptain) {
                updated = assignTeamCaptain(updated, targetTeamKey, editingPlayerId);
            }
            setPlayers(updated);
            setEditingPlayerId(null);
        } else {
            const newP: TournamentPlayer = {
                id: `p-${Date.now()}`,
                teamKey: targetTeamKey,
                name: newPlayerName.trim(),
                jerseyNumber: parseInt(newPlayerNumber, 10) || (players.filter(p => p.teamKey === targetTeamKey).length + 1),
                position: newPlayerPosition,
                isCaptain: newPlayerCaptain
            };
            updated = [...players, newP];
            if (newPlayerCaptain) {
                updated = assignTeamCaptain(updated, targetTeamKey, newP.id);
            }
            setPlayers(updated);
        }

        persistTournamentData(teams, matches, updated, goalEvents);

        setNewPlayerName('');
        setNewPlayerNumber('');
        setNewPlayerPosition('MID');
        setNewPlayerCaptain(false);
        setIsAddPlayerOpen(false);
    };

    // Helper to calculate next available jersey number for a squad
    const getNextJerseyNumber = (teamKey: string, currentPlayers: TournamentPlayer[]): number => {
        const teamNums = currentPlayers
            .filter(p => p.teamKey === teamKey)
            .map(p => p.jerseyNumber)
            .filter(n => typeof n === 'number' && !isNaN(n));
        for (let i = 1; i <= 99; i++) {
            if (!teamNums.includes(i)) return i;
        }
        return teamNums.length + 1;
    };

    // Inline Quick-Add State per team
    const [inlineTeamPlayer, setInlineTeamPlayer] = useState<Record<string, {
        name: string;
        jerseyNumber: string;
        position: 'GK' | 'DEF' | 'MID' | 'FWD';
        isCaptain: boolean;
    }>>({});

    const getInlineState = (teamKey: string) => {
        const existing = inlineTeamPlayer[teamKey];
        const teamPs = players.filter(p => p.teamKey === teamKey);
        const hasGk = teamPs.some(p => p.position === 'GK');
        const defaultPos: 'GK' | 'DEF' | 'MID' | 'FWD' = hasGk ? 'MID' : 'GK';
        const nextNum = getNextJerseyNumber(teamKey, players);

        return {
            name: existing?.name ?? '',
            jerseyNumber: existing?.jerseyNumber ?? nextNum.toString(),
            position: existing?.position ?? defaultPos,
            isCaptain: existing?.isCaptain ?? false
        };
    };

    const setInlineField = (teamKey: string, field: 'name' | 'jerseyNumber' | 'position' | 'isCaptain', value: any) => {
        const current = getInlineState(teamKey);
        setInlineTeamPlayer(prev => ({
            ...prev,
            [teamKey]: {
                ...current,
                [field]: value
            }
        }));
    };

    const handleInlineAdd = (teamKey: string, e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const curr = getInlineState(teamKey);
        const trimmed = curr.name.trim();
        if (!trimmed) return;

        if (!canEditTeam(teamKey)) {
            toast.warning('You can only add players to your own assigned squad.');
            return;
        }

        const num = parseInt(curr.jerseyNumber, 10) || getNextJerseyNumber(teamKey, players);
        const newP: TournamentPlayer = {
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            teamKey,
            name: trimmed,
            jerseyNumber: num,
            position: curr.position,
            isCaptain: curr.isCaptain
        };

        let updated = [...players, newP];
        if (curr.isCaptain) {
            updated = assignTeamCaptain(updated, teamKey, newP.id);
        }
        setPlayers(updated);
        persistTournamentData(teams, matches, updated, goalEvents);

        const nextNum = getNextJerseyNumber(teamKey, updated);
        const nextHasGk = updated.filter(p => p.teamKey === teamKey).some(p => p.position === 'GK');

        setInlineTeamPlayer(prev => ({
            ...prev,
            [teamKey]: {
                name: '',
                jerseyNumber: nextNum.toString(),
                position: nextHasGk ? 'MID' : 'GK',
                isCaptain: false
            }
        }));
    };

    // Save & Add Another in Modal 1
    const handleAddPlayerAndAnother = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayerName.trim()) return;

        if (!canEditTeam(targetTeamKey)) {
            toast.warning('As Captain, you can only add players to your own assigned squad.');
            return;
        }

        const num = parseInt(newPlayerNumber, 10) || getNextJerseyNumber(targetTeamKey, players);
        const newP: TournamentPlayer = {
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            teamKey: targetTeamKey,
            name: newPlayerName.trim(),
            jerseyNumber: num,
            position: newPlayerPosition,
            isCaptain: newPlayerCaptain
        };

        let updated = [...players, newP];
        if (newPlayerCaptain) {
            updated = assignTeamCaptain(updated, targetTeamKey, newP.id);
        }
        setPlayers(updated);
        persistTournamentData(teams, matches, updated, goalEvents);

        // Pre-fill next number and reset name, keep modal open
        const nextNum = getNextJerseyNumber(targetTeamKey, updated);
        setNewPlayerName('');
        setNewPlayerNumber(nextNum.toString());
        setNewPlayerCaptain(false);
    };

    // Bulk Paste Roster State & Logic
    const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);
    const [bulkTargetTeamKey, setBulkTargetTeamKey] = useState<string>('team-dench');
    const [bulkRosterText, setBulkRosterText] = useState<string>('');
    const [bulkReplaceMode, setBulkReplaceMode] = useState<'append' | 'replace'>('append');

    const handleOpenBulkPaste = (teamKey?: string) => {
        let myTeamKey = captainTeamKey;
        if (role === 'CAPTAIN' && (!myTeamKey || !teams[myTeamKey])) {
            const found = Object.values(teams).find(t => canEditTeam(t.id));
            if (found) myTeamKey = found.id;
        }
        const target = (role === 'CAPTAIN' && myTeamKey) ? myTeamKey : (teamKey || bulkTargetTeamKey);
        if (role === 'CAPTAIN' && !canEditTeam(target)) {
            toast.warning('As Captain, you can only paste players into your own squad.');
            return;
        }
        setBulkTargetTeamKey(target);
        setBulkRosterText('');
        setBulkReplaceMode('append');
        setIsBulkPasteOpen(true);
    };

    // Parse bulk roster text in real time for instant preview
    const parsedBulkPlayers = useMemo(() => {
        if (!bulkRosterText.trim()) return [];

        const lines = bulkRosterText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const existingForTeam = bulkReplaceMode === 'replace' ? [] : players.filter(p => p.teamKey === bulkTargetTeamKey);
        const usedNumbers = new Set(existingForTeam.map(p => p.jerseyNumber));

        let nextAvailable = 1;
        const getNextNum = (): number => {
            while (usedNumbers.has(nextAvailable)) {
                nextAvailable++;
            }
            usedNumbers.add(nextAvailable);
            return nextAvailable;
        };

        const result: Array<{ name: string; jerseyNumber: number; position: 'GK' | 'DEF' | 'MID' | 'FWD'; isCaptain: boolean }> = [];

        lines.forEach(line => {
            let isCaptain = false;
            let position: 'GK' | 'DEF' | 'MID' | 'FWD' = 'MID';

            // Captain detection
            if (/\b(\(c\)|\[c\]|captain|\(cap\))\b/i.test(line)) {
                isCaptain = true;
                line = line.replace(/\b(\(c\)|\[c\]|captain|\(cap\))\b/gi, '');
            }

            // Position detection
            if (/\b(\(gk\)|\[gk\]|gk|goalie|goalkeeper)\b/i.test(line)) {
                position = 'GK';
                line = line.replace(/\b(\(gk\)|\[gk\]|gk|goalie|goalkeeper)\b/gi, '');
            } else if (/\b(\(def\)|\[def\]|def|defender)\b/i.test(line)) {
                position = 'DEF';
                line = line.replace(/\b(\(def\)|\[def\]|def|defender)\b/gi, '');
            } else if (/\b(\(fwd\)|\[fwd\]|fwd|striker|att|attacker)\b/i.test(line)) {
                position = 'FWD';
                line = line.replace(/\b(\(fwd\)|\[fwd\]|fwd|striker|att|attacker)\b/gi, '');
            } else if (/\b(\(mid\)|\[mid\]|mid|midfield|midfielder)\b/i.test(line)) {
                position = 'MID';
                line = line.replace(/\b(\(mid\)|\[mid\]|mid|midfield|midfielder)\b/gi, '');
            }

            // Number detection (e.g., "1.", "#10", "4 -")
            let jerseyNumber: number | null = null;
            const leadingNumMatch = line.match(/^#?(\d+)[\.\-\s:]+/);
            if (leadingNumMatch) {
                const parsedNum = parseInt(leadingNumMatch[1], 10);
                if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum <= 99) {
                    jerseyNumber = parsedNum;
                    usedNumbers.add(jerseyNumber);
                    line = line.replace(/^#?\d+[\.\-\s:]+/, '');
                }
            }

            let cleanName = line.replace(/^[-•*>\s]+/, '').replace(/[\(\)\[\]]/g, '').trim();
            if (!cleanName) return;

            if (!jerseyNumber) {
                jerseyNumber = getNextNum();
            }

            // If no GK yet in existing team or parsed list, default #1 to GK
            const hasGk = existingForTeam.some(p => p.position === 'GK') || result.some(p => p.position === 'GK');
            if (position === 'MID' && jerseyNumber === 1 && !hasGk) {
                position = 'GK';
            }

            result.push({
                name: cleanName,
                jerseyNumber,
                position,
                isCaptain
            });
        });

        return result;
    }, [bulkRosterText, bulkTargetTeamKey, bulkReplaceMode, players]);

    const handleImportBulkRoster = () => {
        if (parsedBulkPlayers.length === 0) return;

        if (!canEditTeam(bulkTargetTeamKey)) {
            toast.warning('As Captain, you cannot import players into another team.');
            return;
        }

        const newPlayersList: TournamentPlayer[] = parsedBulkPlayers.map((p, idx) => ({
            id: `p-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            teamKey: bulkTargetTeamKey,
            name: p.name,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
            isCaptain: p.isCaptain
        }));

        const retained = bulkReplaceMode === 'replace'
            ? players.filter(p => p.teamKey !== bulkTargetTeamKey)
            : players;
        let updated = [...retained, ...newPlayersList];
        const importedCaptain = [...newPlayersList].reverse().find(player => player.isCaptain);
        if (importedCaptain) {
            updated = assignTeamCaptain(updated, bulkTargetTeamKey, importedCaptain.id);
        }
        setPlayers(updated);
        persistTournamentData(teams, matches, updated, goalEvents);

        setIsBulkPasteOpen(false);
        setBulkRosterText('');
    };

    const handleOpenAddPlayerModal = (teamKey?: string) => {
        let myTeamKey = captainTeamKey;
        if (role === 'CAPTAIN' && (!myTeamKey || !teams[myTeamKey])) {
            const found = Object.values(teams).find(t => canEditTeam(t.id));
            if (found) myTeamKey = found.id;
        }
        const target = (role === 'CAPTAIN' && myTeamKey) ? myTeamKey : (teamKey || targetTeamKey);
        if (role === 'CAPTAIN' && !canEditTeam(target)) {
            toast.warning('As Captain, you can only register players to your own assigned squad.');
            return;
        }

        setEditingPlayerId(null);
        setTargetTeamKey(target);
        setNewPlayerName('');
        const nextNum = getNextJerseyNumber(target, players);
        setNewPlayerNumber(nextNum.toString());
        const teamPs = players.filter(p => p.teamKey === target);
        const hasGk = teamPs.some(p => p.position === 'GK');
        setNewPlayerPosition(hasGk ? 'MID' : 'GK');
        setNewPlayerCaptain(false);
        setIsAddPlayerOpen(true);
    };

    const handleOpenEditPlayer = (p: TournamentPlayer) => {
        if (!canEditTeam(p.teamKey)) {
            toast.warning('You can only edit players on your own team.');
            return;
        }

        setEditingPlayerId(p.id);
        setTargetTeamKey(p.teamKey);
        setNewPlayerName(p.name);
        setNewPlayerNumber(p.jerseyNumber.toString());
        setNewPlayerPosition(p.position);
        setNewPlayerCaptain(!!p.isCaptain);
        setIsAddPlayerOpen(true);
    };

    const handleMakeCaptain = async (playerId: string) => {
        const targetPlayer = players.find(p => p.id === playerId);
        if (!targetPlayer) return;

        if (!canEditTeam(targetPlayer.teamKey)) {
            toast.warning('You can only designate captain for your own team.');
            return;
        }

        const teamKey = targetPlayer.teamKey;
        const updated = assignTeamCaptain(players, teamKey, playerId);
        setPlayers(updated);

        persistTournamentData(teams, matches, updated, goalEvents);

        try {
            await setPlayerCaptain(playerId, { teamKey, name: targetPlayer.name });
            toast.success(`👑 "${targetPlayer.name}" is now Captain of ${teams[teamKey]?.name || teamKey}!`);
        } catch (err: any) {
            console.warn('Notice calling setPlayerCaptain:', err);
        }
    };

    const handleDeletePlayer = async (playerId: string) => {
        const playerToDelete = players.find(p => p.id === playerId);
        if (!playerToDelete) return;

        if (!canEditTeam(playerToDelete.teamKey)) {
            toast.warning('You can only remove players from your own team.');
            return;
        }

        if (await confirm({ message: `Remove "${playerToDelete.name}" from the squad?`, confirmLabel: 'Remove', danger: true })) {
            const updated = players.filter(p => p.id !== playerId);
            const updatedEvents = goalEvents.filter(ev => ev.scorerPlayerId !== playerId && ev.assistPlayerId !== playerId);
            setPlayers(updated);
            setGoalEvents(updatedEvents);
            persistTournamentData(teams, matches, updated, updatedEvents, {
                deletedPlayerId: playerId,
                deletedPlayer: { id: playerId, name: playerToDelete.name, teamKey: playerToDelete.teamKey }
            });

            try {
                await deletePlayer(playerId, { teamKey: playerToDelete.teamKey, name: playerToDelete.name });
            } catch (err: any) {
                console.warn('Dedicated player delete notice:', err);
            }
        }
    };

    const handleClearScoresAndSquads = async () => {
        if (await confirm({ message: 'Clear all registered players, scores, and goal events?', confirmLabel: 'Clear All', danger: true })) {
            const cleanMatches = DEFAULT_MATCHES.map(m => ({
                ...m,
                homeScore: null,
                awayScore: null,
                status: 'scheduled' as const
            }));
            setPlayers([]);
            setGoalEvents([]);
            setMatches(cleanMatches);
            persistTournamentData(teams, cleanMatches, [], [], { clearAllSquads: true });
        }
    };

    const handleClearAllSquads = async () => {
        if (await confirm({ message: 'Remove all players from all squads?', confirmLabel: 'Clear Squads', danger: true })) {
            setPlayers([]);
            setGoalEvents([]);
            persistTournamentData(teams, matches, [], [], { clearAllSquads: true });
        }
    };

    // Handlers for Editing Teams
    const handleSaveQuickTeams = (e: React.FormEvent) => {
        e.preventDefault();
        if (role !== 'ADMIN') {
            toast.warning('Only League Admins can rename all tournament teams.');
            return;
        }

        const updatedTeams = { ...teams };
        Object.keys(quickTeamNames).forEach(k => {
            if (updatedTeams[k] && quickTeamNames[k]?.trim()) {
                updatedTeams[k] = { ...updatedTeams[k], name: quickTeamNames[k].trim() };
            }
        });

        // Also update match placeholders if they match
        const updatedMatches = matches.map(m => {
            let hp = m.homePlaceholder;
            let ap = m.awayPlaceholder;
            if (m.homeTeamKey && quickTeamNames[m.homeTeamKey]?.trim()) {
                hp = quickTeamNames[m.homeTeamKey].trim();
            }
            if (m.awayTeamKey && quickTeamNames[m.awayTeamKey]?.trim()) {
                ap = quickTeamNames[m.awayTeamKey].trim();
            }
            return { ...m, homePlaceholder: hp, awayPlaceholder: ap };
        });

        setTeams(updatedTeams);
        setMatches(updatedMatches);
        persistTournamentData(updatedTeams, updatedMatches, players, goalEvents);
        setIsEditTeamsOpen(false);
    };

    const handleSaveDetailTeam = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTeamData.name.trim()) return;

        if (!canEditTeam(selectedEditTeamKey)) {
            toast.warning('As Captain, you can only edit details for your own assigned squad.');
            return;
        }

        const updatedTeams = {
            ...teams,
            [selectedEditTeamKey]: { ...editTeamData }
        };

        const updatedMatches = matches.map(m => {
            let hp = m.homePlaceholder;
            let ap = m.awayPlaceholder;
            if (m.homeTeamKey === selectedEditTeamKey) {
                hp = editTeamData.name.trim();
            }
            if (m.awayTeamKey === selectedEditTeamKey) {
                ap = editTeamData.name.trim();
            }
            return { ...m, homePlaceholder: hp, awayPlaceholder: ap };
        });

        setTeams(updatedTeams);
        setMatches(updatedMatches);
        persistTournamentData(updatedTeams, updatedMatches, players, goalEvents);
        setIsEditTeamsOpen(false);
    };

    const handleResetTeamsToDefault = async () => {
        if (await confirm({ message: 'Reset all teams back to default? Any custom team names will be lost.', confirmLabel: 'Reset Teams', danger: true })) {
            setTeams(DEFAULT_TEAMS);
            persistTournamentData(DEFAULT_TEAMS, matches, players, goalEvents);
        }
    };

    // Open Match Event Logger Modal
    const handleOpenMatchEvents = (matchId: string) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        let homeKey = match.homeTeamKey;

        if (match.id === 'sf-1') {
            homeKey = sf1HomeKey;
        } else if (match.id === 'sf-2') {
            homeKey = sf2HomeKey;
        } else if (match.id === 'fn-3rd') {
            homeKey = thirdHomeKey;
        } else if (match.id === 'fn-gold') {
            homeKey = finalHomeKey;
        }

        const defaultTeam = homeKey || 'team-dench';
        setEventTeamKey(defaultTeam);

        const teamPlayers = players.filter(p => p.teamKey === defaultTeam);
        setEventScorerId(teamPlayers[0]?.id || '');
        setEventAssistId('');
        setEventMinute(8);
        setActiveEventMatchId(matchId);
    };

    // Add Goal Event to a match
    const handleAddGoalEvent = () => {
        if (!activeEventMatchId || !eventTeamKey || !eventScorerId) return;

        const newEvent: GoalEvent = {
            id: `ev-${Date.now()}`,
            matchId: activeEventMatchId,
            teamKey: eventTeamKey,
            scorerPlayerId: eventScorerId,
            assistPlayerId: eventAssistId || null,
            minute: eventMinute
        };

        const updatedEvents = [...goalEvents, newEvent];
        setGoalEvents(updatedEvents);

        // Recompute match score based on goal events for this match
        recalcMatchScoreFromEvents(activeEventMatchId, updatedEvents);

        // Reset assist and increment minute
        setEventAssistId('');
        setEventMinute(prev => Math.min(15, prev + 2));
    };

    // Delete a goal event
    const handleDeleteGoalEvent = (eventId: string) => {
        const updatedEvents = goalEvents.filter(ev => ev.id !== eventId);
        setGoalEvents(updatedEvents);

        if (activeEventMatchId) {
            recalcMatchScoreFromEvents(activeEventMatchId, updatedEvents);
        }
    };

    // Recalculates match score based on events
    const recalcMatchScoreFromEvents = (matchId: string, currentEvents: GoalEvent[]) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        let homeKey = match.homeTeamKey;
        let awayKey = match.awayTeamKey;

        if (match.id === 'sf-1') {
            homeKey = sf1HomeKey;
            awayKey = sf1AwayKey;
        } else if (match.id === 'sf-2') {
            homeKey = sf2HomeKey;
            awayKey = sf2AwayKey;
        } else if (match.id === 'fn-3rd') {
            homeKey = thirdHomeKey;
            awayKey = thirdAwayKey;
        } else if (match.id === 'fn-gold') {
            homeKey = finalHomeKey;
            awayKey = finalAwayKey;
        }

        const matchEvs = currentEvents.filter(e => e.matchId === matchId);
        const homeGoals = homeKey ? matchEvs.filter(e => e.teamKey === homeKey).length : 0;
        const awayGoals = awayKey ? matchEvs.filter(e => e.teamKey === awayKey).length : 0;

        const updatedMatches = matches.map(m => {
            if (m.id === matchId) {
                if (matchEvs.length === 0) {
                    return {
                        ...m,
                        homeScore: null,
                        awayScore: null,
                        status: 'scheduled' as const
                    };
                }
                return {
                    ...m,
                    homeScore: homeGoals,
                    awayScore: awayGoals,
                    status: 'completed' as const
                };
            }
            return m;
        });

        setMatches(updatedMatches);
        persistTournamentData(teams, updatedMatches, players, currentEvents);
    };

    // Reset a single match back to scheduled (0-0, 0 played)
    const handleResetMatch = async (matchId: string) => {
        const match = matches.find(m => m.id === matchId);
        const homeName = (match?.homeTeamKey && teams[match.homeTeamKey]?.name) || match?.homePlaceholder || 'Home Team';
        const awayName = (match?.awayTeamKey && teams[match.awayTeamKey]?.name) || match?.awayPlaceholder || 'Away Team';

        if (!await confirm({ message: `Reset "${homeName} vs ${awayName}" back to Scheduled?`, confirmLabel: 'Reset Match', danger: true })) {
            return;
        }

        try {
            await resetSingleMatch(matchId);
        } catch (apiErr) {
            console.warn('Backend single match reset notice, applying local fallback:', apiErr);
        }

        try {
            localStorage.removeItem(`match_state_${matchId}`);
            if (localStorage.getItem('active_match_id') === matchId) {
                localStorage.removeItem('active_match_id');
            }
        } catch {}

        const updatedMatches = matches.map(m => {
            if (m.id === matchId) {
                return {
                    ...m,
                    homeScore: null,
                    awayScore: null,
                    status: 'scheduled' as const
                };
            }
            return m;
        });

        const updatedEvents = goalEvents.filter(ev => ev.matchId !== matchId);
        setMatches(updatedMatches);
        setGoalEvents(updatedEvents);
        persistTournamentData(teams, updatedMatches, players, updatedEvents);
    };

    const handleSimulateTournament = () => {
        if (role !== 'ADMIN') {
            toast.error('Access Denied: Only an Administrator can simulate tournament scores.');
            return;
        }

        const updatedMatches = matches.map(m => {
            const sim = SIMULATED_SCORES[m.id];
            if (sim) {
                return {
                    ...m,
                    homeScore: sim.home,
                    awayScore: sim.away,
                    status: 'completed' as const
                };
            }
            return m;
        });
        setMatches(updatedMatches);
        setGoalEvents([]);
        persistTournamentData(teams, updatedMatches, players, []);
    };

    const handleResetTournament = async () => {
        if (role !== 'ADMIN') {
            toast.error('Access Denied: Only an Administrator can reset tournament matches and scores.');
            return;
        }

        if (!await confirm({ message: 'Reset all matches, scores, and goal records? All fixtures will return to scheduled across all devices.', confirmLabel: 'Reset Tournament', danger: true })) {
            return;
        }

        try {
            const res = await resetDerbyData();
            const resetMatches = res?.payload?.matches || DEFAULT_MATCHES;
            setMatches(resetMatches);
            setGoalEvents([]);

            try {
                localStorage.setItem('dench_derby_matches_v4', JSON.stringify(resetMatches));
                localStorage.removeItem('dench_derby_events_v4');
                localStorage.removeItem('active_match_id');
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('match_state_') || key === 'active_match_id')) {
                        localStorage.removeItem(key);
                    }
                }
            } catch {}
        } catch (err: any) {
            console.error('Failed to reset tournament:', err);
            toast.error(err.message || 'Failed to reset tournament. Make sure you are logged in as an Administrator.');
        }
    };

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const getTeamDisplayName = (key: string | null, placeholder: string) => {
        if (key && teams[key]) return teams[key].name;
        return placeholder;
    };

    const getTeamBadgeColor = (key: string | null) => {
        if (key && teams[key]) return teams[key].color;
        return '#6b7280';
    };

    // Current match being edited in modal
    const activeModalMatch = matches.find(m => m.id === activeEventMatchId);
    let modalHomeKey = activeModalMatch?.homeTeamKey;
    let modalAwayKey = activeModalMatch?.awayTeamKey;
    if (activeModalMatch?.id === 'sf-1') { modalHomeKey = sf1HomeKey; modalAwayKey = sf1AwayKey; }
    else if (activeModalMatch?.id === 'sf-2') { modalHomeKey = sf2HomeKey; modalAwayKey = sf2AwayKey; }
    else if (activeModalMatch?.id === 'fn-3rd') { modalHomeKey = thirdHomeKey; modalAwayKey = thirdAwayKey; }
    else if (activeModalMatch?.id === 'fn-gold') { modalHomeKey = finalHomeKey; modalAwayKey = finalAwayKey; }

    const activeMatchGoalEvents = goalEvents.filter(e => e.matchId === activeEventMatchId);
    const selectedEventTeam = teams[eventTeamKey];
    const eventTeamPlayers = players.filter(p =>
        p && (
            p.teamKey === eventTeamKey ||
            (selectedEventTeam && (
                p.teamKey === selectedEventTeam.name ||
                (p as any).team?.name === selectedEventTeam.name
            ))
        )
    );

    const { toast } = useToast();
    const { confirm, ConfirmUI } = useConfirm();

    return (
        <div className="app-container">
            <Navbar />
            <ConfirmUI />

            <main className="main-content">

                {/* Banner Notification */}
                <div style={{
                    backgroundColor: 'rgba(18, 184, 76, 0.08)',
                    border: '1px solid rgba(18, 184, 76, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1.25rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor: role === 'ADMIN' ? '#a855f7' : (role === 'CAPTAIN' ? '#f59e0b' : 'var(--color-primary)'),
                            color: role === 'ADMIN' ? '#ffffff' : '#050505',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {role === 'ADMIN' ? <Crown size={13} /> : (role === 'CAPTAIN' ? <span>🧢</span> : <Flame size={13} />)}
                            {role === 'ADMIN' ? 'League Admin' : (role === 'CAPTAIN' ? `Captain: ${captainTeamName || 'Your Team'}` : 'Participant View')}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                            {role === 'CAPTAIN' ? (
                                isPastDeadline ? (
                                    <span style={{ color: '#ef4444' }}>
                                        🔒 <strong>Roster Locked:</strong> Squad editing deadline expired on 28th October at 18:30.
                                    </span>
                                ) : (
                                    <span>
                                        ⏰ Roster Window: <strong>Open until 28 Oct 18:30 ({deadlineRemaining} remaining)</strong>
                                    </span>
                                )
                            ) : role === 'ADMIN' ? (
                                <span>
                                    👑 <strong>Admin Mode:</strong> Full power to edit any team, add players, or adjust tournament schedule.
                                </span>
                            ) : (
                                <span>
                                    Dench Derby kicks off on <strong>Wednesday, 28th October 2026 at 18:30 SAST</strong>!
                                </span>
                            )}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Admin Action Buttons */}
                        {role === 'ADMIN' && (
                            <>
                                <button
                                    onClick={() => setIsEditTeamsOpen(true)}
                                    className="btn btn-sm btn-primary"
                                    title="Register and customize tournament teams"
                                >
                                    <Sliders size={14} /> Register & Edit Teams
                                </button>
                                <button
                                    onClick={() => handleOpenAddPlayerModal()}
                                    className="btn btn-sm btn-secondary"
                                    title="Add a player to a tournament squad"
                                >
                                    <UserPlus size={14} /> Add Player
                                </button>
                                <button
                                    onClick={handleSimulateTournament}
                                    className="btn btn-sm btn-secondary"
                                    title="Fill in realistic scores & goalscorers to test full leaderboard"
                                >
                                    <Sparkles size={14} color="#f59e0b" /> Simulate Results
                                </button>
                                <button
                                    onClick={handleResetTournament}
                                    className="btn btn-sm btn-outline"
                                    title="Reset matches & goal events"
                                >
                                    <RotateCcw size={14} /> Reset
                                </button>
                            </>
                        )}

                        {/* Captain Action Buttons */}
                        {role === 'CAPTAIN' && (
                            <>
                                {!isPastDeadline && (
                                    <>
                                        <button
                                            onClick={() => {
                                                if (captainTeamKey && teams[captainTeamKey]) {
                                                    setSelectedEditTeamKey(captainTeamKey);
                                                    setEditTeamsMode('detail');
                                                    setIsEditTeamsOpen(true);
                                                } else {
                                                    setIsEditTeamsOpen(true);
                                                }
                                            }}
                                            className="btn btn-sm btn-primary"
                                            style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#050505' }}
                                            title="Edit your squad details"
                                        >
                                            <Sliders size={14} /> Edit My Team
                                        </button>
                                        <button
                                            onClick={() => handleOpenAddPlayerModal(captainTeamKey || undefined)}
                                            className="btn btn-sm btn-secondary"
                                            title="Add a player to your team"
                                        >
                                            <UserPlus size={14} /> Add Player to Squad
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {/* Role Switcher button */}
                        <button
                            onClick={openRoleModal}
                            className="btn btn-sm btn-outline"
                            title="Switch active role"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                        >
                            Switch Role
                        </button>

                        <button
                            onClick={handleShare}
                            className="btn btn-sm btn-secondary"
                            title="Copy link to this tournament"
                        >
                            <Share2 size={14} /> {copied ? 'Copied!' : 'Share'}
                        </button>
                    </div>
                </div>

                {/* Hero Header */}
                <div className="derby-hero">
                    <div style={{
                        position: 'absolute',
                        top: '-60px',
                        right: '-60px',
                        width: '260px',
                        height: '260px',
                        background: 'radial-gradient(circle, rgba(18, 184, 76, 0.25) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1, maxWidth: '850px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            marginBottom: '0.75rem',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            <Calendar size={16} /> 28 October 2026 • 18:30 SAST Kickoff • 5-A-Side Championship
                        </div>

                        <h1 className="derby-title">
                            Dench Derby <span className="gradient-text">Tournament</span>
                        </h1>

                        <p className="derby-subtitle">
                            The battle for five-a-side supremacy. 6 elite clubs split into Group A and Group B,
                            fighting through group fixtures, semi-final clashes, and the grand final for 1st spot 🥇.
                            Register your own clubs, build your squads, and track every goal and assist live!
                        </p>

                        {/* Live Countdown & Info Pill */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '1.25rem'
                        }}>
                            {/* Countdown Cards */}
                            <div className="derby-countdown-box" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'rgba(5, 5, 5, 0.75)',
                                padding: '0.75rem 1.25rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
                                    <Clock size={18} color="var(--color-primary)" />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Kick-off in:</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', textAlign: 'center' }}>
                                    <div style={{ minWidth: '40px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{timeLeft.days}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Days</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--color-border)', alignSelf: 'center' }}>:</span>
                                    <div style={{ minWidth: '35px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{timeLeft.hours}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Hrs</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--color-border)', alignSelf: 'center' }}>:</span>
                                    <div style={{ minWidth: '35px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{timeLeft.minutes}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Min</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--color-border)', alignSelf: 'center' }}>:</span>
                                    <div style={{ minWidth: '35px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{timeLeft.seconds}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Sec</div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Scorer Spotlight */}
                            {topScorers.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: 'var(--radius-lg)'
                            }}>
                                    <Award size={22} color="#f59e0b" />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.05em' }}>
                                            Golden Boot Leader
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                                            {topScorers[0].player.name} ({topScorers[0].goals} ⚽)
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Champion Spotlight if tournament complete */}
                            {finalOutcome.winnerKey && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(18, 184, 76, 0.1) 100%)',
                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: 'var(--radius-lg)'
                                }}>
                                    <Trophy size={22} color="#f59e0b" />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.05em' }}>
                                            Tournament Champion
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                                            {teams[finalOutcome.winnerKey]?.name} 🥇
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tournament Navigation Tabs */}
                <div className="derby-tabs-bar">
                    <button
                        className={`derby-tab-btn ${activeTab === 'bracket' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('bracket')}
                    >
                        <Trophy size={16} /> Tournament Bracket
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'groups' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('groups')}
                    >
                        <Users size={16} /> Groups & Standings
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        <Clock size={16} /> Match Schedule & Goals
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('leaderboard')}
                    >
                        <Medal size={16} color="#f59e0b" /> Scorers & Assists 🥇
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('teams')}
                    >
                        <Shield size={16} /> Squad Rosters ({players.length})
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('rules')}
                    >
                        <Info size={16} /> Format & Rules
                    </button>
                </div>

                {/* TAB 1: TOURNAMENT BRACKET */}
                {activeTab === 'bracket' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                        {/* Visual Summary Card */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Tournament Progression</h2>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        Roadmap from Group Stage (18:30 kickoff across Pitches 1 & 2) to the Grand Final 🥇
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        onClick={handleSimulateTournament}
                                        className="btn btn-sm btn-primary"
                                    >
                                        <Play size={14} /> Quick Test All Matches
                                    </button>
                                </div>
                            </div>

                            {/* Tournament Bracket Tree */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '2rem',
                                alignItems: 'stretch'
                            }}>

                                {/* Column 1: Group Stage Qualifiers */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: 'var(--color-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Users size={16} /> Stage 1: Group Standings
                                    </div>

                                    {/* Group A Box */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        border: isGroupALive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--color-border)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                            <strong style={{ color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                Group A
                                                {isGroupALive && (
                                                    <span style={{ fontSize: '0.65rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 800 }}>
                                                        ● LIVE
                                                    </span>
                                                )}
                                            </strong>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Pitch 1 • 18:30</span>
                                                <span style={{ color: 'var(--color-text-muted)' }}>• Top 2 Advance</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {standingsA.map((t, idx) => (
                                                <div key={t.teamKey} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: idx < 2 ? 'rgba(18, 184, 76, 0.08)' : 'transparent',
                                                    border: idx < 2 ? '1px solid rgba(18, 184, 76, 0.2)' : '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: idx < 2 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                            width: '16px'
                                                        }}>
                                                            {idx + 1}
                                                        </span>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.color }} />
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{t.name}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--color-text-muted)' }}>{t.played}P</span>
                                                        <strong style={{ color: 'var(--color-primary)' }}>{t.points} pts</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Group B Box */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        border: isGroupBLive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--color-border)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                            <strong style={{ color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                Group B
                                                {isGroupBLive && (
                                                    <span style={{ fontSize: '0.65rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 800 }}>
                                                        ● LIVE
                                                    </span>
                                                )}
                                            </strong>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Pitch 2 • 18:30</span>
                                                <span style={{ color: 'var(--color-text-muted)' }}>• Top 2 Advance</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {standingsB.map((t, idx) => (
                                                <div key={t.teamKey} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: idx < 2 ? 'rgba(18, 184, 76, 0.08)' : 'transparent',
                                                    border: idx < 2 ? '1px solid rgba(18, 184, 76, 0.2)' : '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: idx < 2 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                            width: '16px'
                                                        }}>
                                                            {idx + 1}
                                                        </span>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.color }} />
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{t.name}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--color-text-muted)' }}>{t.played}P</span>
                                                        <strong style={{ color: 'var(--color-primary)' }}>{t.points} pts</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Semi-Finals */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Shield size={16} /> Stage 2: Semi-Finals
                                    </div>

                                    {/* Semi-Final 1 Card */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        border: sf1Match?.status === 'completed' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--color-border)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>SEMI-FINAL 1 • {sf1Match?.time || '20:15'}</span>
                                            <span>Pitch {sf1Match?.pitch ?? 1}</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {/* Home: Group A 1st */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: sf1Outcome.winnerKey === sf1HomeKey && sf1HomeKey ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: sf1Outcome.winnerKey === sf1HomeKey && sf1HomeKey ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(sf1HomeKey) }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                            {getTeamDisplayName(sf1HomeKey, 'Group A ( 1st spot )')}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Group A 1st Place</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                    {sf1Match?.homeScore !== null ? sf1Match?.homeScore : '-'}
                                                </span>
                                            </div>

                                            {/* Away: Group B 2nd */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: sf1Outcome.winnerKey === sf1AwayKey && sf1AwayKey ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: sf1Outcome.winnerKey === sf1AwayKey && sf1AwayKey ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(sf1AwayKey) }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                            {getTeamDisplayName(sf1AwayKey, 'Group B ( 2nd spot )')}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Group B 2nd Place</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                    {sf1Match?.awayScore !== null ? sf1Match?.awayScore : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenMatchEvents(sf1Match!.id)}
                                            className="btn btn-sm btn-outline"
                                            style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
                                        >
                                            <Sliders size={13} /> Log Goals & Assists
                                        </button>
                                    </div>

                                    {/* Semi-Final 2 Card */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        border: sf2Match?.status === 'completed' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--color-border)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>SEMI-FINAL 2 • {sf2Match?.time || '20:15'}</span>
                                            <span>Pitch {sf2Match?.pitch ?? 2}</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {/* Home: Group A 2nd */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: sf2Outcome.winnerKey === sf2HomeKey && sf2HomeKey ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: sf2Outcome.winnerKey === sf2HomeKey && sf2HomeKey ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(sf2HomeKey) }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                            {getTeamDisplayName(sf2HomeKey, 'Group A ( 2nd spot )')}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Group A 2nd Place</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                    {sf2Match?.homeScore !== null ? sf2Match?.homeScore : '-'}
                                                </span>
                                            </div>

                                            {/* Away: Group B 1st */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: sf2Outcome.winnerKey === sf2AwayKey && sf2AwayKey ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: sf2Outcome.winnerKey === sf2AwayKey && sf2AwayKey ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(sf2AwayKey) }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                            {getTeamDisplayName(sf2AwayKey, 'Group B ( 1st spot )')}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Group B 1st Place</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                    {sf2Match?.awayScore !== null ? sf2Match?.awayScore : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenMatchEvents(sf2Match!.id)}
                                            className="btn btn-sm btn-outline"
                                            style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
                                        >
                                            <Sliders size={13} /> Log Goals & Assists
                                        </button>
                                    </div>
                                </div>

                                {/* Column 3: Finals (3rd spot & 1st spot 🥇) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#f59e0b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Trophy size={16} /> Stage 3: Finals
                                    </div>

                                    {/* 3rd Place Match Card */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        border: '1px solid rgba(245, 158, 11, 0.25)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Medal size={14} /> 3RD PLACE PLAYOFF
                                            </span>
                                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                                {thirdMatch?.time || '20:55'} • Pitch {thirdMatch?.pitch ?? 2}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                            First match (Competing for 3rd spot)
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: thirdOutcome.winnerKey === thirdHomeKey && thirdHomeKey ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
                                                    {getTeamDisplayName(thirdHomeKey, 'Loser SF 1')}
                                                </span>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                                                    {thirdMatch?.homeScore !== null ? thirdMatch?.homeScore : '-'}
                                                </span>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: thirdOutcome.winnerKey === thirdAwayKey && thirdAwayKey ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
                                                    {getTeamDisplayName(thirdAwayKey, 'Loser SF 2')}
                                                </span>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                                                    {thirdMatch?.awayScore !== null ? thirdMatch?.awayScore : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenMatchEvents(thirdMatch!.id)}
                                            className="btn btn-sm btn-outline"
                                            style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
                                        >
                                            <Sliders size={13} /> Log Goals & Assists
                                        </button>
                                    </div>

                                    {/* Grand Final Card (Competing for 1st spot 🥇) */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, rgba(10, 10, 10, 0.95) 100%)',
                                        border: '2px solid rgba(245, 158, 11, 0.5)',
                                        boxShadow: '0 0 25px rgba(245, 158, 11, 0.15)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <Award size={16} /> GRAND FINAL 🥇
                                            </span>
                                            <span style={{ color: 'white', fontWeight: 600 }}>
                                                {finalMatch?.time || '21:00'} • Pitch {finalMatch?.pitch ?? 1}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.6rem' }}>
                                            Second match ( Final Competing for 1st spot 🥇 )
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.6rem 0.75rem',
                                                backgroundColor: finalOutcome.winnerKey === finalHomeKey && finalHomeKey ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: finalOutcome.winnerKey === finalHomeKey && finalHomeKey ? '1px solid #f59e0b' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(finalHomeKey) }} />
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>
                                                        {getTeamDisplayName(finalHomeKey, 'Winner SF 1')}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                                                    {finalMatch?.homeScore !== null ? finalMatch?.homeScore : '-'}
                                                </span>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.6rem 0.75rem',
                                                backgroundColor: finalOutcome.winnerKey === finalAwayKey && finalAwayKey ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: finalOutcome.winnerKey === finalAwayKey && finalAwayKey ? '1px solid #f59e0b' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(finalAwayKey) }} />
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>
                                                        {getTeamDisplayName(finalAwayKey, 'Winner SF 2')}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                                                    {finalMatch?.awayScore !== null ? finalMatch?.awayScore : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenMatchEvents(finalMatch!.id)}
                                            className="btn btn-sm btn-primary"
                                            style={{ width: '100%', marginTop: '0.85rem', fontWeight: 700 }}
                                        >
                                            <Sliders size={13} /> Log Grand Final Goals 🥇
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                )}

                {/* TAB 2: GROUPS & STANDINGS */}
                {activeTab === 'groups' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="grid-responsive-2">

                            {/* Group A Standings Table */}
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--color-primary)'
                                            }}></span>
                                            Group A Table
                                            {isGroupALive && (
                                                <span style={{ fontSize: '0.7rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                                                    ● LIVE (Virtual Standings)
                                                </span>
                                            )}
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Top 2 qualify for Semi-Finals</p>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: 'rgba(18, 184, 76, 0.15)',
                                        color: 'var(--color-primary)',
                                        fontWeight: 700,
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        3 Teams
                                    </span>
                                </div>

                                <div className="table-container" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>Pos</th>
                                                <th>Team</th>
                                                <th style={{ textAlign: 'center' }}>P</th>
                                                <th style={{ textAlign: 'center' }}>W</th>
                                                <th style={{ textAlign: 'center' }}>D</th>
                                                <th style={{ textAlign: 'center' }}>L</th>
                                                <th style={{ textAlign: 'center' }}>GF</th>
                                                <th style={{ textAlign: 'center' }}>GA</th>
                                                <th style={{ textAlign: 'center' }}>GD</th>
                                                <th style={{ textAlign: 'center', color: 'white' }}>Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {standingsA.map((row, index) => {
                                                const qualifies = index < 2;
                                                return (
                                                    <tr key={row.teamKey} style={{
                                                        backgroundColor: qualifies ? 'rgba(18, 184, 76, 0.03)' : 'transparent'
                                                    }}>
                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 700 }}>
                                                            <div style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                backgroundColor: qualifies ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                                                color: qualifies ? '#050505' : 'var(--color-text-muted)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.8rem'
                                                            }}>
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: 'white' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color }} />
                                                                <span>{row.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.played}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.won}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.drawn}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.lost}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsFor}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsAgainst}</td>
                                                        <td style={{
                                                            textAlign: 'center',
                                                            fontWeight: 600,
                                                            color: row.goalDifference > 0 ? 'var(--color-primary)' : (row.goalDifference < 0 ? '#ef4444' : 'inherit')
                                                        }}>
                                                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                                                            {row.points}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Group B Standings Table */}
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: '#3b82f6'
                                            }}></span>
                                            Group B Table
                                            {isGroupBLive && (
                                                <span style={{ fontSize: '0.7rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                                                    ● LIVE (Virtual Standings)
                                                </span>
                                            )}
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Top 2 qualify for Semi-Finals</p>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                        color: '#3b82f6',
                                        fontWeight: 700,
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        3 Teams
                                    </span>
                                </div>

                                <div className="table-container" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>Pos</th>
                                                <th>Team</th>
                                                <th style={{ textAlign: 'center' }}>P</th>
                                                <th style={{ textAlign: 'center' }}>W</th>
                                                <th style={{ textAlign: 'center' }}>D</th>
                                                <th style={{ textAlign: 'center' }}>L</th>
                                                <th style={{ textAlign: 'center' }}>GF</th>
                                                <th style={{ textAlign: 'center' }}>GA</th>
                                                <th style={{ textAlign: 'center' }}>GD</th>
                                                <th style={{ textAlign: 'center', color: 'white' }}>Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {standingsB.map((row, index) => {
                                                const qualifies = index < 2;
                                                return (
                                                    <tr key={row.teamKey} style={{
                                                        backgroundColor: qualifies ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                                                    }}>
                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 700 }}>
                                                            <div style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                backgroundColor: qualifies ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                                                color: qualifies ? 'white' : 'var(--color-text-muted)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.8rem'
                                                            }}>
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: 'white' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color }} />
                                                                <span>{row.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.played}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.won}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.drawn}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.lost}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsFor}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsAgainst}</td>
                                                        <td style={{
                                                            textAlign: 'center',
                                                            fontWeight: 600,
                                                            color: row.goalDifference > 0 ? 'var(--color-primary)' : (row.goalDifference < 0 ? '#ef4444' : 'inherit')
                                                        }}>
                                                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                                                            {row.points}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* TAB 3: MATCH SCHEDULE & GOAL EVENTS */}
                {activeTab === 'schedule' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Match Schedule & Live Scorers</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    Click <strong>"Log Goals & Assists"</strong> on any match to record who scored and assisted!
                                </p>
                            </div>
                            {role === 'ADMIN' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={handleSimulateTournament} className="btn btn-sm btn-primary">
                                        <Sparkles size={14} /> Simulate Sample Results
                                    </button>
                                    <button onClick={handleResetTournament} className="btn btn-sm btn-secondary">
                                        <RotateCcw size={14} /> Clear Scores
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Schedule List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {matches.map((m) => {
                                const isSemi = m.stage === 'semi';
                                const isFinal = m.stage === 'final' || m.stage === 'third_place';

                                let homeDisplay = m.homePlaceholder;
                                let awayDisplay = m.awayPlaceholder;

                                if (m.id === 'sf-1') {
                                    homeDisplay = getTeamDisplayName(sf1HomeKey, 'Group A ( 1st spot )');
                                    awayDisplay = getTeamDisplayName(sf1AwayKey, 'Group B ( 2nd spot )');
                                } else if (m.id === 'sf-2') {
                                    homeDisplay = getTeamDisplayName(sf2HomeKey, 'Group A ( 2nd spot )');
                                    awayDisplay = getTeamDisplayName(sf2AwayKey, 'Group B ( 1st spot )');
                                } else if (m.id === 'fn-3rd') {
                                    homeDisplay = getTeamDisplayName(thirdHomeKey, 'Loser SF 1');
                                    awayDisplay = getTeamDisplayName(thirdAwayKey, 'Loser SF 2');
                                } else if (m.id === 'fn-gold') {
                                    homeDisplay = getTeamDisplayName(finalHomeKey, 'Winner SF 1');
                                    awayDisplay = getTeamDisplayName(finalAwayKey, 'Winner SF 2');
                                } else {
                                    if (m.homeTeamKey) homeDisplay = teams[m.homeTeamKey]?.name || m.homePlaceholder;
                                    if (m.awayTeamKey) awayDisplay = teams[m.awayTeamKey]?.name || m.awayPlaceholder;
                                }

                                const matchGoals = goalEvents.filter(ev => ev.matchId === m.id);
                                const homeScore = m.homeScore ?? 0;
                                const awayScore = m.awayScore ?? 0;
                                const isLive = m.status === 'live';
                                const hasScore = m.homeScore !== null && m.awayScore !== null;
                                const homeLeading = isLive && hasScore && homeScore > awayScore;
                                const awayLeading = isLive && hasScore && awayScore > homeScore;

                                return (
                                    <div key={m.id} className="glass-card" style={{
                                        padding: '1.25rem 1.5rem',
                                        border: isLive
                                            ? '1px solid rgba(239, 68, 68, 0.6)'
                                            : (isFinal ? '1px solid rgba(245, 158, 11, 0.4)' : (isSemi ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--color-border)')),
                                        boxShadow: isLive ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none'
                                    }}>
                                        <div className="derby-match-row">

                                            {/* Match Info & Timing */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '180px' }}>
                                                <div style={{
                                                    backgroundColor: isLive
                                                        ? 'rgba(239, 68, 68, 0.18)'
                                                        : (isFinal ? 'rgba(245, 158, 11, 0.15)' : (isSemi ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)')),
                                                    padding: '0.4rem 0.75rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    textAlign: 'center',
                                                    border: isLive ? '1px solid rgba(239, 68, 68, 0.4)' : 'none'
                                                }}>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{m.time}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Pitch {m.pitch}</div>
                                                </div>

                                                <div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        color: isFinal ? '#f59e0b' : (isSemi ? '#3b82f6' : 'var(--color-primary)'),
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {m.note}
                                                    </div>
                                                    {isLive ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: 800,
                                                                color: '#ef4444',
                                                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '4px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                                                LIVE
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: homeScore === awayScore ? '#eab308' : '#22c55e' }}>
                                                                {homeLeading
                                                                    ? `${homeDisplay} leading`
                                                                    : (awayLeading
                                                                        ? `${awayDisplay} leading`
                                                                        : 'Scores level')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                            {m.status === 'completed' ? 'Full Time' : 'Scheduled'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Teams & Scores */}
                                            <div className="derby-score-board">
                                                <div style={{
                                                    flex: 1,
                                                    textAlign: 'right',
                                                    fontWeight: homeLeading ? 800 : 600,
                                                    color: homeLeading ? '#22c55e' : 'white',
                                                    fontSize: '1rem',
                                                    transition: 'color 0.2s ease'
                                                }}>
                                                    {homeDisplay}
                                                    {homeLeading && (
                                                        <span style={{ fontSize: '0.7rem', color: '#22c55e', marginLeft: '0.4rem', fontWeight: 800 }}>◀ LEADING</span>
                                                    )}
                                                </div>

                                                <div style={{
                                                    padding: '0.4rem 1rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    backgroundColor: isLive
                                                        ? 'rgba(239, 68, 68, 0.18)'
                                                        : (m.homeScore !== null ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255, 255, 255, 0.04)'),
                                                    border: isLive
                                                        ? '1px solid rgba(239, 68, 68, 0.5)'
                                                        : (m.homeScore !== null ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid var(--color-border)'),
                                                    minWidth: '80px',
                                                    textAlign: 'center',
                                                    boxShadow: isLive ? '0 0 15px rgba(239, 68, 68, 0.25)' : 'none'
                                                }}>
                                                    {hasScore ? (
                                                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isLive ? '#ff6b6b' : 'white' }}>
                                                            {homeScore} - {awayScore}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                            vs
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{
                                                    flex: 1,
                                                    textAlign: 'left',
                                                    fontWeight: awayLeading ? 800 : 600,
                                                    color: awayLeading ? '#22c55e' : 'white',
                                                    fontSize: '1rem',
                                                    transition: 'color 0.2s ease'
                                                }}>
                                                    {awayLeading && (
                                                        <span style={{ fontSize: '0.7rem', color: '#22c55e', marginRight: '0.4rem', fontWeight: 800 }}>LEADING ▶</span>
                                                    )}
                                                    {awayDisplay}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => handleOpenMatchEvents(m.id)}
                                                    className="btn btn-sm btn-secondary"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                                >
                                                    <Sliders size={13} /> Log Goals & Assists ({matchGoals.length})
                                                </button>
                                                {(role === 'ADMIN' || role === 'REFEREE') && (m.homeScore !== null || m.awayScore !== null || m.status === 'completed' || m.id === 'ga-m1' || matchGoals.length > 0) && (
                                                    <button
                                                        onClick={() => handleResetMatch(m.id)}
                                                        className="btn btn-sm btn-outline"
                                                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                                        title="Reset match back to Scheduled (0-0, 0 played)"
                                                    >
                                                        <RotateCcw size={13} /> Reset
                                                    </button>
                                                )}
                                            </div>

                                        </div>

                                        {/* Match Goals & Scorers Preview Chips */}
                                        {matchGoals.length > 0 && (
                                            <div style={{
                                                marginTop: '0.75rem',
                                                paddingTop: '0.75rem',
                                                borderTop: '1px solid var(--color-border)',
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                                    Match Events:
                                                </span>
                                                {matchGoals.map(ev => {
                                                    const scorer = players.find(p => p.id === ev.scorerPlayerId);
                                                    const assist = players.find(p => p.id === ev.assistPlayerId);
                                                    return (
                                                        <span key={ev.id} style={{
                                                            fontSize: '0.75rem',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                            border: '1px solid var(--color-border)',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '999px',
                                                            color: 'white'
                                                        }}>
                                                            ⚽ <strong>{scorer?.name || 'Goal'}</strong> {ev.minute}'
                                                            {assist && <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>(👟 {assist.name})</span>}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 4: LEADERBOARD & STATS (GOLDEN BOOT & ASSISTS) */}
                {activeTab === 'leaderboard' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Tournament Player Statistics</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    Keep track of who scores and assists in every match.
                                </p>
                            </div>
                            <button onClick={() => handleOpenAddPlayerModal()} className="btn btn-sm btn-primary">
                                <UserPlus size={14} /> Add Player to Squad
                            </button>
                        </div>

                        {/* Top Scorers & Top Assists 2-Column Grid */}
                        <div className="grid-responsive-2">

                            {/* Golden Boot (Top Scorers) */}
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Award size={20} color="#f59e0b" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>Golden Boot (Top Scorers)</h3>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Most goals scored</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>
                                        {topScorers.length} Scorers
                                    </span>
                                </div>

                                <div className="table-container" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>#</th>
                                                <th>Player</th>
                                                <th>Club</th>
                                                <th style={{ textAlign: 'center' }}>Assists</th>
                                                <th style={{ textAlign: 'center', color: '#f59e0b', fontSize: '1rem' }}>Goals ⚽</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topScorers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                                                        No goals logged yet. Click "Log Goals & Assists" on any match to record scorers!
                                                    </td>
                                                </tr>
                                            ) : (
                                                topScorers.map((item, index) => (
                                                    <tr key={item.player.id} style={{
                                                        backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
                                                    }}>
                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 700 }}>
                                                            {index === 0 ? (
                                                                <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>🥇</span>
                                                            ) : index === 1 ? (
                                                                <span style={{ color: '#9ca3af', fontSize: '1.1rem' }}>🥈</span>
                                                            ) : index === 2 ? (
                                                                <span style={{ color: '#d97706', fontSize: '1.1rem' }}>🥉</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--color-text-muted)' }}>{index + 1}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: 'white' }}>
                                                                {item.player.name}
                                                                {item.player.isCaptain && (
                                                                    <span style={{ fontSize: '0.65rem', marginLeft: '6px', backgroundColor: 'var(--color-primary)', color: '#050505', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>C</span>
                                                                )}
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                #{item.player.jerseyNumber} • {item.player.position}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.team?.color || '#999' }} />
                                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.team?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                                            {item.assists}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.25rem', color: '#f59e0b' }}>
                                                            {item.goals}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Top Playmakers (Most Assists) */}
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Trophy size={20} color="#3b82f6" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>Playmaker Award (Assists)</h3>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Most assists provided</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700 }}>
                                        {topAssists.length} Playmakers
                                    </span>
                                </div>

                                <div className="table-container" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>#</th>
                                                <th>Player</th>
                                                <th>Club</th>
                                                <th style={{ textAlign: 'center' }}>Goals</th>
                                                <th style={{ textAlign: 'center', color: '#3b82f6', fontSize: '1rem' }}>Assists 👟</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topAssists.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                                                        No assists logged yet. Record assist providers when adding goal events!
                                                    </td>
                                                </tr>
                                            ) : (
                                                topAssists.map((item, index) => (
                                                    <tr key={item.player.id} style={{
                                                        backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                                                    }}>
                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 700 }}>
                                                            {index === 0 ? (
                                                                <span style={{ color: '#3b82f6', fontSize: '1.1rem' }}>🎯</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--color-text-muted)' }}>{index + 1}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: 'white' }}>
                                                                {item.player.name}
                                                                {item.player.isCaptain && (
                                                                    <span style={{ fontSize: '0.65rem', marginLeft: '6px', backgroundColor: 'var(--color-primary)', color: '#050505', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>C</span>
                                                                )}
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                #{item.player.jerseyNumber} • {item.player.position}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.team?.color || '#999' }} />
                                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.team?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                                            {item.goals}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.25rem', color: '#3b82f6' }}>
                                                            {item.assists}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* TAB 5: SQUAD ROSTERS & PLAYER MANAGEMENT */}
                {activeTab === 'teams' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Club Squads & Players</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    Manage players, jersey numbers, and monitor individual tournament statistics.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {role === 'ADMIN' && (
                                    <>
                                        <button
                                            onClick={() => setIsEditTeamsOpen(true)}
                                            className="btn btn-primary"
                                            title="Register and edit all 6 tournament clubs"
                                        >
                                            <Sliders size={15} /> Register / Edit Teams
                                        </button>
                                        <button
                                            onClick={() => handleOpenBulkPaste()}
                                            className="btn btn-secondary"
                                            title="Paste a full squad list from WhatsApp, Notes, or Excel"
                                        >
                                            <ClipboardList size={15} /> Paste Squad List
                                        </button>
                                        <button
                                            onClick={() => handleOpenAddPlayerModal()}
                                            className="btn btn-primary"
                                            title="Open registration dialog for a player"
                                        >
                                            <Plus size={15} /> + Add Player
                                        </button>
                                        <button
                                            onClick={handleClearAllSquads}
                                            className="btn btn-outline"
                                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                                            title="Wipe all registered players from all squads to start fresh"
                                        >
                                            <Trash2 size={14} /> Clear All Squads
                                        </button>
                                    </>
                                )}

                                {role === 'CAPTAIN' && (
                                    <>
                                        {!isPastDeadline ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        let targetKey = captainTeamKey;
                                                        if (!targetKey || !teams[targetKey]) {
                                                            const found = Object.values(teams).find(t => canEditTeam(t.id));
                                                            if (found) targetKey = found.id;
                                                        }
                                                        if (targetKey && teams[targetKey]) {
                                                            setSelectedEditTeamKey(targetKey);
                                                            setEditTeamsMode('detail');
                                                            setIsEditTeamsOpen(true);
                                                        }
                                                    }}
                                                    className="btn btn-primary"
                                                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#050505' }}
                                                >
                                                    <Sliders size={15} /> Edit My Team Details
                                                </button>
                                                <button
                                                    onClick={() => handleOpenBulkPaste(captainTeamKey || undefined)}
                                                    className="btn btn-secondary"
                                                >
                                                    <ClipboardList size={15} /> Paste My Squad
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAddPlayerModal(captainTeamKey || undefined)}
                                                    className="btn btn-primary"
                                                >
                                                    <Plus size={15} /> + Add Player
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{
                                                padding: '0.45rem 0.9rem',
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid #ef4444',
                                                borderRadius: 'var(--radius-sm)',
                                                color: '#f87171',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}>
                                                <Lock size={14} /> Squad editing deadline expired on 28 Oct at 18:30
                                            </div>
                                        )}
                                    </>
                                )}

                                {(role === 'SPECTATOR' || role === 'REFEREE') && (
                                    <div style={{
                                        padding: '0.4rem 0.85rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        👀 Participant View (Official Rosters)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Registration Quick Info Banner */}
                        <div style={{
                            backgroundColor: 'rgba(18, 184, 76, 0.06)',
                            border: '1px solid rgba(18, 184, 76, 0.25)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            fontSize: '0.85rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                                <CheckCircle2 size={16} color="var(--color-primary)" />
                                <span>
                                    <strong>Fast Player Registration:</strong> Type directly in the <strong>quick-add bar</strong> below any team & press <strong>Enter ↵</strong>, or click <strong>Paste Squad List</strong> to import entire WhatsApp rosters in 1 second!
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '999px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Total Registered: <strong style={{ color: 'white' }}>{players.length}</strong> Players
                                </span>
                            </div>
                        </div>

                        {/* 6 Squad Cards */}
                        <div className="grid-responsive-2">
                            {Object.values(teams).map(team => {
                                const teamPlayers = players.filter(p => p.teamKey === team.id);
                                const inlineState = getInlineState(team.id);
                                const isTeamEditable = canEditTeam(team.id);

                                return (
                                    <div key={team.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                        {/* Team Squad Header */}
                                        <div style={{
                                            padding: '1.25rem 1.5rem',
                                            borderBottom: '1px solid var(--color-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: `linear-gradient(90deg, ${team.color}15 0%, transparent 100%)`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    backgroundColor: `${team.color}25`,
                                                    border: `1px solid ${team.color}50`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Shield size={20} color={team.color} />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>{team.name}</h3>
                                                        {role === 'CAPTAIN' && isTeamEditable && (
                                                            <span style={{
                                                                fontSize: '0.68rem',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '999px',
                                                                background: 'rgba(34, 197, 94, 0.2)',
                                                                color: '#22c55e',
                                                                border: '1px solid rgba(34, 197, 94, 0.45)',
                                                                fontWeight: 700,
                                                                letterSpacing: '0.03em'
                                                            }}>
                                                                👑 YOUR SQUAD
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        Group {team.group} • {team.city || 'Dench Derby'} • {teamPlayers.length} player{teamPlayers.length === 1 ? '' : 's'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                {isTeamEditable ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenBulkPaste(team.id)}
                                                            className="btn btn-sm btn-outline"
                                                            style={{ fontSize: '0.78rem' }}
                                                            title="Paste squad roster from WhatsApp or Notes"
                                                        >
                                                            <ClipboardList size={13} /> Paste
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEditTeamKey(team.id);
                                                                setEditTeamsMode('detail');
                                                                setIsEditTeamsOpen(true);
                                                            }}
                                                            className="btn btn-sm btn-outline"
                                                            style={{ fontSize: '0.78rem' }}
                                                            title="Edit this team's name and details"
                                                        >
                                                            <Sliders size={13} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenAddPlayerModal(team.id)}
                                                            className="btn btn-sm btn-secondary"
                                                            style={{ fontSize: '0.78rem' }}
                                                            title="Open registration dialog for this squad"
                                                        >
                                                            <UserPlus size={13} /> + Modal
                                                        </button>
                                                    </>
                                                ) : (
                                                    role === 'CAPTAIN' && isPastDeadline ? (
                                                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <Lock size={12} /> Squad locked
                                                        </span>
                                                    ) : role === 'CAPTAIN' ? (
                                                        <span style={{
                                                            fontSize: '0.72rem',
                                                            color: 'var(--color-text-muted)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.3rem',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                                            padding: '0.25rem 0.55rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            border: '1px solid var(--color-border)'
                                                        }}>
                                                            <Lock size={11} /> Locked (Not Your Team)
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                            👀 Read-Only
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Roster Table */}
                                        <div style={{ padding: '0.75rem 1.25rem' }}>
                                            {teamPlayers.length === 0 ? (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '1.5rem 1rem',
                                                    color: 'var(--color-text-muted)',
                                                    fontSize: '0.85rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: '1px dashed var(--color-border)',
                                                    marginBottom: '0.75rem'
                                                }}>
                                                    <Users size={24} style={{ opacity: 0.35, margin: '0 auto 0.4rem auto', display: 'block' }} />
                                                    <div>No registered players in <strong>{team.name}</strong> yet.</div>
                                                    {isTeamEditable && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.6rem' }}>
                                                            <button
                                                                onClick={() => handleOpenBulkPaste(team.id)}
                                                                className="btn btn-sm btn-secondary"
                                                                style={{ fontSize: '0.78rem' }}
                                                            >
                                                                <ClipboardList size={12} /> Paste WhatsApp List
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
                                                    {teamPlayers.map(p => {
                                                        const stat = playerStatsMap[p.id];
                                                        return (
                                                            <div key={p.id} style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '0.55rem 0.75rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                                border: '1px solid var(--color-border)',
                                                                flexWrap: 'wrap',
                                                                gap: '0.5rem'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    <span style={{
                                                                        width: '26px',
                                                                        height: '26px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: `${team.color}25`,
                                                                        color: team.color,
                                                                        fontWeight: 800,
                                                                        fontSize: '0.75rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {p.jerseyNumber}
                                                                    </span>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                            {p.name}
                                                                            {p.isCaptain && (
                                                                                <span style={{
                                                                                    fontSize: '0.62rem',
                                                                                    backgroundColor: 'var(--color-primary)',
                                                                                    color: '#050505',
                                                                                    fontWeight: 800,
                                                                                    padding: '0.1rem 0.35rem',
                                                                                    borderRadius: '3px'
                                                                                }}>
                                                                                    CAPTAIN
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                            {p.position}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Player Stats & Actions */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <div style={{
                                                                        backgroundColor: stat?.goals ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                                                        border: stat?.goals ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                                                                        padding: '0.2rem 0.5rem',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 700,
                                                                        color: stat?.goals ? '#f59e0b' : 'var(--color-text-muted)'
                                                                    }} title="Goals scored">
                                                                        {stat?.goals || 0} ⚽
                                                                    </div>

                                                                    <div style={{
                                                                        backgroundColor: stat?.assists ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                                                        border: stat?.assists ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                                                        padding: '0.2rem 0.5rem',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 700,
                                                                        color: stat?.assists ? '#3b82f6' : 'var(--color-text-muted)'
                                                                    }} title="Assists made">
                                                                        {stat?.assists || 0} 👟
                                                                    </div>

                                                                    {p.isCaptain ? (
                                                                        <span style={{
                                                                            fontSize: '0.72rem',
                                                                            padding: '0.2rem 0.5rem',
                                                                            borderRadius: 'var(--radius-sm)',
                                                                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                                                            color: '#fbbf24',
                                                                            border: '1px solid rgba(245, 158, 11, 0.4)',
                                                                            fontWeight: 700,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.25rem'
                                                                        }}>
                                                                            <Crown size={12} /> Captain
                                                                        </span>
                                                                    ) : (
                                                                        isTeamEditable && (
                                                                            <button
                                                                                onClick={() => handleMakeCaptain(p.id)}
                                                                                className="btn-icon"
                                                                                style={{
                                                                                    padding: '0.25rem 0.45rem',
                                                                                    borderRadius: 'var(--radius-sm)',
                                                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                                                    color: '#fbbf24',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.75rem',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '0.25rem'
                                                                                }}
                                                                                title={`Designate ${p.name} as Team Captain`}
                                                                            >
                                                                                <Crown size={12} /> Captain
                                                                            </button>
                                                                        )
                                                                    )}

                                                                    {isTeamEditable && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleOpenEditPlayer(p)}
                                                                                className="btn-icon"
                                                                                style={{
                                                                                    padding: '0.25rem 0.45rem',
                                                                                    borderRadius: 'var(--radius-sm)',
                                                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                                                    border: '1px solid var(--color-border)',
                                                                                    color: 'var(--color-text-main)',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.75rem',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '0.25rem'
                                                                                }}
                                                                                title="Edit player details"
                                                                            >
                                                                                <Sliders size={12} /> Edit
                                                                            </button>

                                                                            <button
                                                                                onClick={() => handleDeletePlayer(p.id)}
                                                                                className="btn-icon"
                                                                                style={{
                                                                                    padding: '0.25rem 0.45rem',
                                                                                    borderRadius: 'var(--radius-sm)',
                                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                                    color: '#ef4444',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.75rem',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center'
                                                                                }}
                                                                                title="Remove player from squad"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* INLINE QUICK-ADD BAR: ONLY IF AUTHORIZED */}
                                            {isTeamEditable && (
                                                <form
                                                    onSubmit={(e) => handleInlineAdd(team.id, e)}
                                                    style={{
                                                        marginTop: '0.6rem',
                                                        paddingTop: '0.6rem',
                                                        borderTop: '1px dashed var(--color-border)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.35rem'
                                                    }}
                                                >
                                                    <div className="quick-add-bar">
                                                        {/* Jersey # Input (auto-suggested) */}
                                                        <input
                                                            type="text"
                                                            value={inlineState.jerseyNumber}
                                                            onChange={(e) => setInlineField(team.id, 'jerseyNumber', e.target.value)}
                                                            placeholder="#"
                                                            className="jersey-pill-input"
                                                            title="Jersey Number"
                                                        />

                                                        {/* Player Name Input */}
                                                        <input
                                                            type="text"
                                                            value={inlineState.name}
                                                            onChange={(e) => setInlineField(team.id, 'name', e.target.value)}
                                                            placeholder="Player name (type & press Enter ↵)"
                                                            className="quick-add-input"
                                                        />

                                                        {/* Position Pills */}
                                                        <div className="pos-pill-group">
                                                            {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => (
                                                                <span
                                                                    key={pos}
                                                                    onClick={() => setInlineField(team.id, 'position', pos)}
                                                                    className={`pos-pill ${inlineState.position === pos ? 'active' : ''}`}
                                                                    title={`Select position: ${pos}`}
                                                                >
                                                                    {pos}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Captain Toggle */}
                                                        <span
                                                            onClick={() => setInlineField(team.id, 'isCaptain', !inlineState.isCaptain)}
                                                            className={`pos-pill ${inlineState.isCaptain ? 'active' : ''}`}
                                                            style={{
                                                                backgroundColor: inlineState.isCaptain ? 'var(--color-primary)' : undefined,
                                                                color: inlineState.isCaptain ? '#050505' : undefined,
                                                                fontWeight: 800
                                                            }}
                                                            title="Mark as Captain"
                                                        >
                                                            (C)
                                                        </span>

                                                        {/* Quick Submit Button */}
                                                        <button
                                                            type="submit"
                                                            className="btn btn-sm btn-primary"
                                                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                                                            disabled={!inlineState.name.trim()}
                                                        >
                                                            <Plus size={13} /> Add
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--color-text-muted)', padding: '0 0.25rem' }}>
                                                        <span>⚡ Press <strong>Enter ↵</strong> to add player immediately</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenBulkPaste(team.id)}
                                                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
                                                        >
                                                            Or paste full team list
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 6: RULES & FORMAT */}
                {activeTab === 'rules' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
                                Dench Derby Tournament Regulations
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={18} /> 1. Group Stage Mechanics
                                    </h4>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        <li>6 clubs partitioned into <strong>Group A</strong> and <strong>Group B</strong> (3 teams per group).</li>
                                        <li>Single round-robin within each group (each team plays 2 matches).</li>
                                        <li>Win = <strong>3 Points</strong>, Draw = <strong>1 Point</strong>, Loss = <strong>0 Points</strong>.</li>
                                        <li>The top 2 clubs from Group A and Group B progress to the Semi-Finals.</li>
                                        <li>3rd placed teams in both groups are eliminated at the group stage.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: '#3b82f6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Shield size={18} /> 2. Knockout Crossover Structure
                                    </h4>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        <li><strong>Semi-Final 1:</strong> Group A (1st spot) vs Group B (2nd spot)</li>
                                        <li><strong>Semi-Final 2:</strong> Group A (2nd spot) vs Group B (1st spot)</li>
                                        <li>Both semi-final winners advance to the Grand Final.</li>
                                        <li>Both semi-final losers advance to the 3rd Place Playoff.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Trophy size={18} /> 3. Finals Showcase
                                    </h4>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        <li><strong>First match:</strong> Competing for 3rd spot (Bronze medal).</li>
                                        <li><strong>Second match:</strong> Final Competing for 1st spot 🥇 (Gold Trophy & Crown).</li>
                                        <li>Individual honours: <strong>Golden Boot (Top Scorer)</strong> and <strong>Playmaker Award (Most Assists)</strong>.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: '#ec4899', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle2 size={18} /> 4. Match Rules & Fair Play
                                    </h4>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        <li>Standard Five-A-Side rules apply (5 on pitch + up to 4 rolling subs).</li>
                                        <li>15 minutes straight per match with no half time interval (continuous play).</li>
                                        <li>Goalkeepers cannot leave their designated penalty area.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 1: ADD / EDIT PLAYER TO SQUAD */}
                {isAddPlayerOpen && (
                    <div className="derby-modal-overlay">
                        <div className="derby-modal-content" style={{ maxWidth: '480px' }}>
                            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <UserPlus size={20} color="var(--color-primary)" />
                                    <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'white' }}>
                                        {editingPlayerId ? 'Edit Player' : 'Register Player to Squad'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsAddPlayerOpen(false);
                                        setEditingPlayerId(null);
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                        Select Team
                                    </label>
                                    {role === 'CAPTAIN' ? (
                                        <div style={{
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid var(--color-border)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ fontWeight: 600 }}>{teams[targetTeamKey]?.name || targetTeamKey}</span>
                                            <span style={{ fontSize: '0.72rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                                                <Lock size={12} /> Your Squad Only
                                            </span>
                                        </div>
                                    ) : (
                                        <select
                                            value={targetTeamKey}
                                            onChange={(e) => setTargetTeamKey(e.target.value)}
                                            className="derby-input"
                                        >
                                            {Object.values(teams).map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} (Group {t.group})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                        Player Full Name / Nickname
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Sipho 'Star' Zulu"
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        className="derby-input"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            Jersey #
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            placeholder="e.g. 10"
                                            value={newPlayerNumber}
                                            onChange={(e) => setNewPlayerNumber(e.target.value)}
                                            className="derby-input"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            Position
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                                            {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => (
                                                <button
                                                    key={pos}
                                                    type="button"
                                                    onClick={() => setNewPlayerPosition(pos)}
                                                    className={`pos-pill ${newPlayerPosition === pos ? 'active' : ''}`}
                                                    style={{ padding: '0.45rem 0.2rem', textAlign: 'center', fontSize: '0.8rem' }}
                                                >
                                                    {pos === 'GK' && '🧤 '}
                                                    {pos === 'DEF' && '🛡️ '}
                                                    {pos === 'MID' && '⚡ '}
                                                    {pos === 'FWD' && '🎯 '}
                                                    {pos}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <input
                                        type="checkbox"
                                        id="newPlayerCap"
                                        checked={newPlayerCaptain}
                                        onChange={(e) => setNewPlayerCaptain(e.target.checked)}
                                        style={{ accentColor: 'var(--color-primary)' }}
                                    />
                                    <label htmlFor="newPlayerCap" style={{ fontSize: '0.85rem', color: 'white', cursor: 'pointer' }}>
                                        Designate as Team Captain
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ flex: 1, minWidth: '130px' }}
                                    >
                                        {editingPlayerId ? 'Save Player Changes' : 'Register Player'}
                                    </button>
                                    {!editingPlayerId && (
                                        <button
                                            type="button"
                                            onClick={handleAddPlayerAndAnother}
                                            className="btn btn-secondary"
                                            style={{ minWidth: '150px' }}
                                            title="Save this player and keep modal open for the next player"
                                        >
                                            Save & Add Another ➕
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddPlayerOpen(false);
                                            setEditingPlayerId(null);
                                        }}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: LOG GOALS & ASSISTS */}
                {activeEventMatchId && activeModalMatch && (
                    <div className="derby-modal-overlay">
                        <div className="derby-modal-content" style={{ maxWidth: '640px' }}>
                            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                                        {activeModalMatch.note} • 28 October 2026 • {activeModalMatch.time} (Pitch {activeModalMatch.pitch})
                                    </span>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>
                                        Log Goals & Assists
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setActiveEventMatchId(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Score Display Header */}
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                textAlign: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: 'white' }}>
                                    {modalHomeKey ? teams[modalHomeKey]?.name : activeModalMatch.homePlaceholder}
                                </div>
                                <div style={{
                                    margin: '0 1.5rem',
                                    fontSize: '1.75rem',
                                    fontWeight: 800,
                                    color: 'var(--color-primary)',
                                    minWidth: '60px'
                                }}>
                                    {activeModalMatch.homeScore ?? 0} - {activeModalMatch.awayScore ?? 0}
                                </div>
                                <div style={{ flex: 1, textAlign: 'left', fontWeight: 700, color: 'white' }}>
                                    {modalAwayKey ? teams[modalAwayKey]?.name : activeModalMatch.awayPlaceholder}
                                </div>
                            </div>

                            {/* Add Goal Event Form */}
                            <div style={{
                                backgroundColor: 'rgba(18, 184, 76, 0.05)',
                                border: '1px solid rgba(18, 184, 76, 0.2)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1.25rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={16} color="var(--color-primary)" /> Record New Goal & Assist
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    {/* Scoring Team */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Scoring Team
                                        </label>
                                        <select
                                            value={eventTeamKey}
                                            onChange={(e) => {
                                                const newTeam = e.target.value;
                                                setEventTeamKey(newTeam);
                                                const newPlayers = players.filter(p => p.teamKey === newTeam);
                                                setEventScorerId(newPlayers[0]?.id || '');
                                                setEventAssistId('');
                                            }}
                                            className="derby-input"
                                        >
                                            {modalHomeKey && teams[modalHomeKey] && (
                                                <option value={modalHomeKey}>{teams[modalHomeKey].name}</option>
                                            )}
                                            {modalAwayKey && teams[modalAwayKey] && (
                                                <option value={modalAwayKey}>{teams[modalAwayKey].name}</option>
                                            )}
                                        </select>
                                    </div>

                                    {/* Goal Scorer */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Goal Scorer ⚽
                                        </label>
                                        <select
                                            value={eventScorerId}
                                            onChange={(e) => setEventScorerId(e.target.value)}
                                            className="derby-input"
                                        >
                                            {eventTeamPlayers.length === 0 ? (
                                                <option value="">No registered players (Add in Squad tab)</option>
                                            ) : (
                                                eventTeamPlayers.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        #{p.jerseyNumber} {p.name} ({p.position})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    {/* Assist Provider */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Assist Provided By 👟
                                        </label>
                                        <select
                                            value={eventAssistId}
                                            onChange={(e) => setEventAssistId(e.target.value)}
                                            className="derby-input"
                                        >
                                            <option value="">None (Solo Goal / Penalty)</option>
                                            {eventTeamPlayers.filter(p => p.id !== eventScorerId).map(p => (
                                                <option key={p.id} value={p.id}>
                                                    #{p.jerseyNumber} {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Minute */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Minute (1 - 15)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="15"
                                            value={eventMinute}
                                            onChange={(e) => setEventMinute(Math.min(15, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                                            className="derby-input"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddGoalEvent}
                                    className="btn btn-sm btn-primary"
                                    style={{ width: '100%', fontWeight: 700 }}
                                    disabled={!eventScorerId}
                                >
                                    Record Goal Event (+1 Goal)
                                </button>
                            </div>

                            {/* Recorded Goals for this match */}
                            <div>
                                <h4 style={{ fontSize: '0.95rem', color: 'white', marginBottom: '0.5rem' }}>
                                    Match Event Timeline ({activeMatchGoalEvents.length} Goals)
                                </h4>

                                {activeMatchGoalEvents.length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                        No goals recorded yet for this match.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {activeMatchGoalEvents.map(ev => {
                                            const team = teams[ev.teamKey];
                                            const scorer = players.find(p => p.id === ev.scorerPlayerId);
                                            const assist = players.find(p => p.id === ev.assistPlayerId);

                                            return (
                                                <div key={ev.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.85rem', minWidth: '24px' }}>
                                                            {ev.minute}'
                                                        </span>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: team?.color || '#999' }} />
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                                ⚽ {scorer?.name || 'Player'}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                {team?.name} {assist && `• 👟 Assist by ${assist.name}`}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteGoalEvent(ev.id)}
                                                        title="Delete this goal"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            padding: '0.25rem'
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {(role === 'ADMIN' || role === 'REFEREE') && (
                                    <button
                                        onClick={() => {
                                            if (activeEventMatchId) {
                                                const idToReset = activeEventMatchId;
                                                setActiveEventMatchId(null);
                                                handleResetMatch(idToReset);
                                            }
                                        }}
                                        className="btn btn-sm btn-outline"
                                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <RotateCcw size={14} /> Reset Match to Scheduled (0-0, 0 played)
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveEventMatchId(null)}
                                    className="btn btn-sm btn-primary"
                                    style={{ marginLeft: 'auto' }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 3: REGISTER & EDIT TOURNAMENT TEAMS */}
                {isEditTeamsOpen && (
                    <div className="derby-modal-overlay">
                        <div className="derby-modal-content" style={{ maxWidth: '680px' }}>
                            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Sliders size={22} color="var(--color-primary)" />
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'white' }}>
                                            Register Tournament Teams
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            Register your 6 clubs into Group A & Group B for 28 October 2026 (18:30 Kickoff)
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditTeamsOpen(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            {/* Sub Tabs: Only Admins can register all 6 teams */}
                            {role === 'ADMIN' && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                                    <button
                                        onClick={() => setEditTeamsMode('quick')}
                                        className={`btn btn-sm ${editTeamsMode === 'quick' ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        ⚡ Quick Register All 6 Teams
                                    </button>
                                    <button
                                        onClick={() => setEditTeamsMode('detail')}
                                        className={`btn btn-sm ${editTeamsMode === 'detail' ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        🎨 Full Club Customizer
                                    </button>
                                </div>
                            )}

                            {(editTeamsMode === 'quick' && role === 'ADMIN') ? (
                                <form onSubmit={handleSaveQuickTeams} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{
                                        backgroundColor: 'rgba(18, 184, 76, 0.08)',
                                        border: '1px solid rgba(18, 184, 76, 0.25)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.85rem 1rem',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-text-main)'
                                    }}>
                                        Enter your club names below. Changes immediately update all match fixtures, group standings, bracket pathways, and squad lists!
                                    </div>

                                    <div className="quick-teams-grid">
                                        {/* Group A */}
                                        <div style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '1.25rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                                                <Users size={16} /> Group A (3 Clubs)
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                                {Object.values(teams).filter(t => t.group === 'A').map((t, idx) => (
                                                    <div key={t.id}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color }} />
                                                            Team A{idx + 1} Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={quickTeamNames[t.id] || ''}
                                                            onChange={(e) => setQuickTeamNames(prev => ({ ...prev, [t.id]: e.target.value }))}
                                                            placeholder={`e.g. Club ${idx + 1}`}
                                                            className="derby-input"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Group B */}
                                        <div style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '1.25rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#8b5cf6', fontWeight: 700, fontSize: '0.95rem' }}>
                                                <Users size={16} /> Group B (3 Clubs)
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                                {Object.values(teams).filter(t => t.group === 'B').map((t, idx) => (
                                                    <div key={t.id}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color }} />
                                                            Team B{idx + 1} Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={quickTeamNames[t.id] || ''}
                                                            onChange={(e) => setQuickTeamNames(prev => ({ ...prev, [t.id]: e.target.value }))}
                                                            placeholder={`e.g. Club ${idx + 4}`}
                                                            className="derby-input"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={handleClearScoresAndSquads}
                                            className="btn btn-outline"
                                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                                            title="Clear scores & players so tournament is completely fresh"
                                        >
                                            <Trash2 size={14} /> Clear Scores & Squads
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResetTeamsToDefault}
                                            className="btn btn-outline"
                                            title="Reset back to default tournament clubs"
                                        >
                                            Reset to Default
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditTeamsOpen(false)}
                                            className="btn btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            style={{ minWidth: '160px' }}
                                        >
                                            <CheckCircle2 size={16} /> Save & Register Teams
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleSaveDetailTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {/* Club Selector Pill Bar */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                            {role === 'CAPTAIN' ? 'Your Assigned Club' : 'Select Club to Customize'}
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {Object.values(teams)
                                                .filter(t => role === 'ADMIN' || canEditTeam(t.id))
                                                .map(t => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setSelectedEditTeamKey(t.id)}
                                                        className={`btn btn-sm ${selectedEditTeamKey === t.id ? 'btn-primary' : 'btn-secondary'}`}
                                                        style={{
                                                            borderLeft: `4px solid ${t.color}`,
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        {t.name} (Gr {t.group})
                                                    </button>
                                                ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Club Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={editTeamData.name}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, name: e.target.value }))}
                                                className="derby-input"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                City / Home Ground
                                            </label>
                                            <input
                                                type="text"
                                                value={editTeamData.city}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, city: e.target.value }))}
                                                placeholder="e.g. Cape Town, Johannesburg"
                                                className="derby-input"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Team Motto / Slogan
                                            </label>
                                            <input
                                                type="text"
                                                value={editTeamData.slogan}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, slogan: e.target.value }))}
                                                placeholder="e.g. Relentless Pace, Pure Passion"
                                                className="derby-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Group & Color */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Tournament Group
                                            </label>
                                            <select
                                                value={editTeamData.group}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, group: e.target.value as 'A' | 'B' }))}
                                                className="derby-input"
                                            >
                                                <option value="A">Group A</option>
                                                <option value="B">Group B</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Club Kit Color Accent
                                            </label>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {COLOR_PRESETS.map(c => (
                                                    <div
                                                        key={c.hex}
                                                        onClick={() => setEditTeamData(prev => ({ ...prev, color: c.hex, secondaryColor: c.hex }))}
                                                        className={`color-swatch ${editTeamData.color === c.hex ? 'active' : ''}`}
                                                        style={{ backgroundColor: c.hex }}
                                                        title={c.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditTeamsOpen(false)}
                                            className="btn btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            <CheckCircle2 size={16} /> Save Club Details
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* MODAL 4: BULK PASTE SQUAD ROSTER */}
                {isBulkPasteOpen && (
                    <div className="derby-modal-overlay">
                        <div className="derby-modal-content" style={{ maxWidth: '620px' }}>
                            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <ClipboardList size={22} color="var(--color-primary)" />
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'white' }}>
                                            Paste Squad List
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            Instantly import a whole team from WhatsApp, Notes, or text
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsBulkPasteOpen(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                {/* Target Club */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                        Import into Club:
                                    </label>
                                    {role === 'CAPTAIN' ? (
                                        <div style={{
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid var(--color-border)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ fontWeight: 600 }}>{teams[bulkTargetTeamKey]?.name || bulkTargetTeamKey}</span>
                                            <span style={{ fontSize: '0.72rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                                                <Lock size={12} /> Your Squad Only
                                            </span>
                                        </div>
                                    ) : (
                                        <select
                                            value={bulkTargetTeamKey}
                                            onChange={(e) => setBulkTargetTeamKey(e.target.value)}
                                            className="derby-input"
                                        >
                                            {Object.values(teams).map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} (Group {t.group})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Import Mode: Append or Replace */}
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'white', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="bulkMode"
                                            checked={bulkReplaceMode === 'append'}
                                            onChange={() => setBulkReplaceMode('append')}
                                            style={{ accentColor: 'var(--color-primary)' }}
                                        />
                                        Add to existing players
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#ef4444', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="bulkMode"
                                            checked={bulkReplaceMode === 'replace'}
                                            onChange={() => setBulkReplaceMode('replace')}
                                            style={{ accentColor: '#ef4444' }}
                                        />
                                        Replace existing squad
                                    </label>
                                </div>

                                {/* Textarea */}
                                <div>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                        <span>Paste names here (one per line):</span>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)' }}>
                                            ✨ Auto-detects numbers (#1), positions (GK/DEF/MID/FWD), and (C)
                                        </span>
                                    </label>
                                    <textarea
                                        value={bulkRosterText}
                                        onChange={(e) => setBulkRosterText(e.target.value)}
                                        placeholder={"1. Sipho Mokoena (GK)\n2. Thabo Khumalo (DEF)\n7. Marcus Dench (C)\n9. Chad Peters (FWD)\n10. Brian Sithole"}
                                        className="bulk-paste-textarea"
                                    />
                                </div>

                                {/* Live Parsed Preview */}
                                <div style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.85rem 1rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
                                            Parsed Players ({parsedBulkPlayers.length} detected)
                                        </span>
                                        {parsedBulkPlayers.length > 0 && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                                                Ready to import into {teams[bulkTargetTeamKey]?.name}
                                            </span>
                                        )}
                                    </div>

                                    {parsedBulkPlayers.length === 0 ? (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                            Paste or type a list above to see the instant live preview. You can also paste simple names without numbers, and we'll assign jerseys automatically!
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                                            {parsedBulkPlayers.map((p, i) => (
                                                <div key={i} style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid var(--color-border)',
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>#{p.jerseyNumber}</span>
                                                    <span style={{ color: 'white' }}>{p.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>({p.position})</span>
                                                    {p.isCaptain && (
                                                        <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--color-primary)', color: '#050505', fontWeight: 800, padding: '0.05rem 0.3rem', borderRadius: '2px' }}>
                                                            CAPTAIN
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Modal Actions */}
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsBulkPasteOpen(false)}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleImportBulkRoster}
                                        disabled={parsedBulkPlayers.length === 0}
                                        className="btn btn-primary"
                                        style={{ opacity: parsedBulkPlayers.length === 0 ? 0.5 : 1 }}
                                    >
                                        Import {parsedBulkPlayers.length} Players into {teams[bulkTargetTeamKey]?.name}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Link back to League */}
                <footer style={{
                    marginTop: '4rem',
                    paddingTop: '2rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={16} color="var(--color-primary)" />
                        <strong style={{ color: 'white' }}>Dench Derby 2026</strong> — Five-A-Side Soccer Platform
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <NavLink to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</NavLink>
                        <NavLink to="/standings" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>League Standings</NavLink>
                        <NavLink to="/fixtures" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Fixtures</NavLink>
                        <NavLink to="/teams" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Teams</NavLink>
                    </div>
                    <div>Taking place 28 October 2026</div>
                </footer>

            </main>
        </div>
    );
};
