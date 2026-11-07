import { type LeagueStandingsRow, type ScoreUpdateCommand } from '../domain/tournamentDomain';
import { type RealtimeBroadcasterPort, type RelationalSyncPort, type TournamentRepositoryPort } from '../ports/outboundPorts';
export type RecordMatchScoreResponse = {
    outcome: 'not_found';
    error: string;
} | {
    outcome: 'invalid_tie_break';
    error: string;
} | {
    outcome: 'ok';
    resultMatch: {
        id: string;
        seasonId: number;
        divisionId: number;
        pitchNumber: number;
        time: string;
        homeScore: number | null;
        awayScore: number | null;
        tieBreakWinnerKey: string | null;
        status: string;
        stage?: string | undefined;
        group?: string | undefined;
        homeTeam: {
            id: string;
            name: string;
        };
        awayTeam: {
            id: string;
            name: string;
        };
    };
};
export declare class RecordTournamentMatchScoreUseCase {
    private readonly tournamentRepository;
    private readonly relationalSync;
    private readonly broadcaster;
    constructor(tournamentRepository: TournamentRepositoryPort, relationalSync: RelationalSyncPort, broadcaster: RealtimeBroadcasterPort);
    execute(command: ScoreUpdateCommand): Promise<RecordMatchScoreResponse>;
}
export declare class GetTournamentStandingsUseCase {
    private readonly tournamentRepository;
    constructor(tournamentRepository: TournamentRepositoryPort);
    execute(teamKeyToDbId?: Map<string, number>): Promise<LeagueStandingsRow[] | null>;
}
//# sourceMappingURL=tournamentUseCases.d.ts.map