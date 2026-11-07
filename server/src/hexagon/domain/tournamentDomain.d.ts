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
export type ScoreUpdateDomainResult = {
    status: 'not_found';
} | {
    status: 'invalid_tie_break';
} | {
    status: 'ok';
    match: DomainMatch;
    snapshot: TournamentSnapshot;
};
/**
 * Pure domain function: normalizes group assignments and unplayed group fixtures
 * without losing any existing players, captains, or scored matches.
 */
export declare const normalizeTournamentSnapshot: (snapshot: TournamentSnapshot) => boolean;
/**
 * Pure domain function: resolves knockout match participants from completed group standings
 * and semifinal outcomes when knockout team keys are not yet persisted.
 */
export declare const resolveKnockoutParticipants: (teams: Record<string, DomainTeam>, matches: DomainMatch[], targetMatch: DomainMatch) => void;
/**
 * Pure domain function: applies a referee/admin score update to a tournament snapshot,
 * enforcing completion immutability against delayed live updates and knockout shootout rules.
 */
export declare const applyTournamentScoreUpdate: (snapshot: TournamentSnapshot, command: ScoreUpdateCommand) => ScoreUpdateDomainResult;
/**
 * Pure domain function: calculates league/tournament standings rows from a TournamentSnapshot.
 */
export declare const calculateTournamentLeagueStandings: (snapshot: TournamentSnapshot, teamKeyToDbId?: Map<string, number>) => LeagueStandingsRow[];
//# sourceMappingURL=tournamentDomain.d.ts.map