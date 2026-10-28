export type TournamentProgressMatch = {
    id?: string;
    stage: string;
    group?: string;
    status?: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeamKey?: string | null;
    awayTeamKey?: string | null;
    tieBreakWinnerKey?: string | null;
};
export type TournamentProgressTeam = {
    name: string;
    color: string;
    group: string;
};
type GroupOrderTeam = {
    name: string;
    group: string;
};
type GroupOrderMatch = {
    id?: string;
    stage?: string;
    group?: string;
    status?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    homeTeamKey?: string | null;
    awayTeamKey?: string | null;
    homePlaceholder?: string;
    awayPlaceholder?: string;
};
export declare const migrateRequestedTournamentGroups: <Team extends GroupOrderTeam, Match extends GroupOrderMatch>(teams: Record<string, Team>, matches: Match[]) => boolean;
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
export declare const isGroupStageComplete: (matches: TournamentProgressMatch[], group: "A" | "B") => boolean;
export declare const calculateGroupStandings: (teams: Record<string, TournamentProgressTeam>, matches: TournamentProgressMatch[], group: "A" | "B") => GroupStanding[];
export declare const getKnockoutOutcome: (match: Pick<TournamentProgressMatch, "homeScore" | "awayScore" | "tieBreakWinnerKey"> | undefined, homeKey: string | null | undefined, awayKey: string | null | undefined) => {
    winnerKey: string | null;
    loserKey: string | null;
};
export {};
//# sourceMappingURL=tournamentProgress.d.ts.map