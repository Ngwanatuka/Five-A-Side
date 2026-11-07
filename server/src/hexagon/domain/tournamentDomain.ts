import {
    calculateGroupStandings,
    getKnockoutOutcome,
    isGroupStageComplete,
    migrateRequestedTournamentGroups,
    type GroupStanding
} from '../../../../shared/tournamentProgress';

export type DomainTeam = {
    id?: string;
    name: string;
    group: 'A' | 'B' | string;
    color?: string;
    secondaryColor?: string;
    city?: string;
    slogan?: string;
    founded?: string;
    captain?: string;
};

export type DomainGoalEvent = {
    id: string;
    matchId: string;
    teamKey: string;
    scorerPlayerId: string;
    scorerPlayerName?: string | undefined;
    assistPlayerId?: string | null | undefined;
    assistPlayerName?: string | null | undefined;
    minute: number;
    side?: 'home' | 'away' | undefined;
    [key: string]: unknown;
};

export type DomainMatch = {
    id: string;
    stage?: string;
    group?: 'A' | 'B' | string;
    matchOrder?: number;
    homeTeamKey?: string | null;
    awayTeamKey?: string | null;
    homePlaceholder?: string;
    awayPlaceholder?: string;
    time?: string;
    pitch?: number;
    homeScore: number | null;
    awayScore: number | null;
    tieBreakWinnerKey?: string | null;
    status?: string;
    note?: string;
    officiatedBy?: unknown;
};

export type DomainPlayer = {
    id: string;
    teamKey: string;
    name: string;
    jerseyNumber?: number;
    position?: string;
    isCaptain?: boolean;
};

export type TournamentSnapshot = {
    teams: Record<string, DomainTeam>;
    matches: DomainMatch[];
    players?: DomainPlayer[];
    goalEvents?: DomainGoalEvent[];
    activeReferees?: Record<string, unknown>;
    updatedAt?: string;
};

export type LeagueStandingsRow = {
    teamId: number;
    teamName: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    form: string[];
};

export type ScoreUpdateCommand = {
    matchId: string;
    homeScore: number | null;
    awayScore: number | null;
    status?: string | undefined;
    tieBreakWinnerKey?: string | null | undefined;
    goalEvents?: DomainGoalEvent[] | undefined;
};

export type ScoreUpdateDomainResult =
    | { status: 'not_found' }
    | { status: 'invalid_tie_break' }
    | { status: 'ok'; match: DomainMatch; snapshot: TournamentSnapshot };

/**
 * Pure domain function: normalizes group assignments and unplayed group fixtures
 * without losing any existing players, captains, or scored matches.
 */
export const normalizeTournamentSnapshot = (snapshot: TournamentSnapshot): boolean => {
    if (!snapshot.teams || !Array.isArray(snapshot.matches)) {
        return false;
    }
    return migrateRequestedTournamentGroups(snapshot.teams, snapshot.matches);
};

/**
 * Pure domain function: resolves knockout match participants from completed group standings
 * and semifinal outcomes when knockout team keys are not yet persisted.
 */
export const resolveKnockoutParticipants = (
    teams: Record<string, DomainTeam>,
    matches: DomainMatch[],
    targetMatch: DomainMatch
): void => {
    if (!['semi', 'final', 'third_place'].includes(targetMatch.stage || '')) {
        return;
    }
    if (targetMatch.homeTeamKey && targetMatch.awayTeamKey) {
        return;
    }

    const teamsWithColor = Object.fromEntries(
        Object.entries(teams).map(([k, t]) => [k, { name: t.name, color: t.color || '#12b84c', group: t.group }])
    );
    const normalizedMatches = matches.map(m => ({
        ...m,
        stage: m.stage || 'group'
    }));

    const standingsA: GroupStanding[] = calculateGroupStandings(teamsWithColor, normalizedMatches, 'A');
    const standingsB: GroupStanding[] = calculateGroupStandings(teamsWithColor, normalizedMatches, 'B');
    const groupAComplete = isGroupStageComplete(normalizedMatches, 'A');
    const groupBComplete = isGroupStageComplete(normalizedMatches, 'B');

    const a1stKey = standingsA[0]?.teamKey || null;
    const a2ndKey = standingsA[1]?.teamKey || null;
    const b1stKey = standingsB[0]?.teamKey || null;
    const b2ndKey = standingsB[1]?.teamKey || null;

    const sf1 = matches.find(m => m.id === 'sf-1');
    const sf2 = matches.find(m => m.id === 'sf-2');
    const sf1HomeKey = sf1?.homeTeamKey || (groupAComplete ? a1stKey : null);
    const sf1AwayKey = sf1?.awayTeamKey || (groupBComplete ? b2ndKey : null);
    const sf2HomeKey = sf2?.homeTeamKey || (groupAComplete ? a2ndKey : null);
    const sf2AwayKey = sf2?.awayTeamKey || (groupBComplete ? b1stKey : null);

    const sf1Outcome = getKnockoutOutcome(sf1, sf1HomeKey, sf1AwayKey);
    const sf2Outcome = getKnockoutOutcome(sf2, sf2HomeKey, sf2AwayKey);

    if (targetMatch.id === 'sf-1') {
        targetMatch.homeTeamKey = targetMatch.homeTeamKey || sf1HomeKey;
        targetMatch.awayTeamKey = targetMatch.awayTeamKey || sf1AwayKey;
    } else if (targetMatch.id === 'sf-2') {
        targetMatch.homeTeamKey = targetMatch.homeTeamKey || sf2HomeKey;
        targetMatch.awayTeamKey = targetMatch.awayTeamKey || sf2AwayKey;
    } else if (targetMatch.id === 'fn-3rd') {
        targetMatch.homeTeamKey = targetMatch.homeTeamKey || sf1Outcome.loserKey;
        targetMatch.awayTeamKey = targetMatch.awayTeamKey || sf2Outcome.loserKey;
    } else if (targetMatch.id === 'fn-gold') {
        targetMatch.homeTeamKey = targetMatch.homeTeamKey || sf1Outcome.winnerKey;
        targetMatch.awayTeamKey = targetMatch.awayTeamKey || sf2Outcome.winnerKey;
    }
};

/**
 * Pure domain function: applies a referee/admin score update to a tournament snapshot,
 * enforcing completion immutability against delayed live updates and knockout shootout rules.
 */
export const applyTournamentScoreUpdate = (
    snapshot: TournamentSnapshot,
    command: ScoreUpdateCommand
): ScoreUpdateDomainResult => {
    if (!Array.isArray(snapshot.matches)) {
        return { status: 'not_found' };
    }

    if (snapshot.teams && typeof snapshot.teams === 'object') {
        normalizeTournamentSnapshot(snapshot);
    }

    const matchIndex = snapshot.matches.findIndex(m => m.id === command.matchId);
    if (matchIndex === -1) {
        return { status: 'not_found' };
    }

    const tm = snapshot.matches[matchIndex]!;

    // Prevent delayed live score updates from reverting an already completed match
    if (tm.status?.toLowerCase() === 'completed' && command.status?.toLowerCase() !== 'completed') {
        return { status: 'ok', match: tm, snapshot };
    }

    if (snapshot.teams) {
        resolveKnockoutParticipants(snapshot.teams, snapshot.matches, tm);
    }

    if (command.tieBreakWinnerKey !== undefined) {
        const isKnockout = ['semi', 'final', 'third_place'].includes(tm.stage || '');
        const hasTiedScore =
            command.homeScore !== null &&
            command.awayScore !== null &&
            command.homeScore === command.awayScore;
        const isParticipant =
            command.tieBreakWinnerKey === tm.homeTeamKey ||
            command.tieBreakWinnerKey === tm.awayTeamKey;

        if (
            command.tieBreakWinnerKey !== null &&
            (!isKnockout || !hasTiedScore || command.status?.toLowerCase() !== 'completed' || !isParticipant)
        ) {
            return { status: 'invalid_tie_break' };
        }
        tm.tieBreakWinnerKey = command.tieBreakWinnerKey;
    } else if (command.status?.toLowerCase() !== 'completed' || command.homeScore !== command.awayScore) {
        tm.tieBreakWinnerKey = null;
    }

    tm.homeScore = command.homeScore;
    tm.awayScore = command.awayScore;

    if (command.status) {
        const lower = command.status.toLowerCase();
        tm.status = lower === 'completed' ? 'completed' : lower === 'live' ? 'live' : 'scheduled';
    }

    if (command.goalEvents) {
        const existingGoalEvents = Array.isArray(snapshot.goalEvents) ? snapshot.goalEvents : [];
        snapshot.goalEvents = [
            ...existingGoalEvents.filter(ev => ev.matchId !== command.matchId),
            ...command.goalEvents
        ];
    }

    snapshot.updatedAt = new Date().toISOString();
    return { status: 'ok', match: tm, snapshot };
};

/**
 * Pure domain function: calculates league/tournament standings rows from a TournamentSnapshot.
 */
export const calculateTournamentLeagueStandings = (
    snapshot: TournamentSnapshot,
    teamKeyToDbId: Map<string, number> = new Map()
): LeagueStandingsRow[] => {
    if (!snapshot.teams || !Array.isArray(snapshot.matches)) {
        return [];
    }

    normalizeTournamentSnapshot(snapshot);

    const standingsMap = new Map<string, LeagueStandingsRow>();
    Object.entries(snapshot.teams).forEach(([teamKey, team], index) => {
        if (!team?.name) return;
        standingsMap.set(teamKey, {
            teamId: teamKeyToDbId.get(teamKey) ?? index + 1,
            teamName: team.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            form: []
        });
    });

    snapshot.matches.forEach(m => {
        const statusLower = String(m.status || '').toLowerCase();
        if (!['completed', 'live'].includes(statusLower)) return;
        if (m.homeScore === null || m.homeScore === undefined || m.awayScore === null || m.awayScore === undefined) return;
        if (!m.homeTeamKey || !m.awayTeamKey) return;

        const home = standingsMap.get(m.homeTeamKey);
        const away = standingsMap.get(m.awayTeamKey);
        if (!home || !away) return;

        const homeScore = Number(m.homeScore);
        const awayScore = Number(m.awayScore);
        if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return;

        home.played += 1;
        away.played += 1;
        home.goalsFor += homeScore;
        home.goalsAgainst += awayScore;
        away.goalsFor += awayScore;
        away.goalsAgainst += homeScore;

        if (homeScore > awayScore) {
            home.won += 1;
            home.points += 3;
            home.form.push('W');
            away.lost += 1;
            away.form.push('L');
        } else if (awayScore > homeScore) {
            away.won += 1;
            away.points += 3;
            away.form.push('W');
            home.lost += 1;
            home.form.push('L');
        } else {
            home.drawn += 1;
            away.drawn += 1;
            home.points += 1;
            away.points += 1;
            home.form.push('D');
            away.form.push('D');
        }

        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;
    });

    return Array.from(standingsMap.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });
};

