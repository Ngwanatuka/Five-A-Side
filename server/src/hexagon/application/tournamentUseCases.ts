import {
    applyTournamentScoreUpdate,
    calculateTournamentLeagueStandings,
    type LeagueStandingsRow,
    type ScoreUpdateCommand
} from '../domain/tournamentDomain';
import {
    type RealtimeBroadcasterPort,
    type RelationalSyncPort,
    type TournamentRepositoryPort
} from '../ports/outboundPorts';

export type RecordMatchScoreResponse =
    | { outcome: 'not_found'; error: string }
    | { outcome: 'invalid_tie_break'; error: string }
    | {
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
            homeTeam: { id: string; name: string };
            awayTeam: { id: string; name: string };
        };
    };

export class RecordTournamentMatchScoreUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepositoryPort,
        private readonly relationalSync: RelationalSyncPort,
        private readonly broadcaster: RealtimeBroadcasterPort
    ) {}

    async execute(command: ScoreUpdateCommand): Promise<RecordMatchScoreResponse> {
        const outcomeRef: { status: 'ok' | 'not_found' | 'invalid_tie_break' } = { status: 'ok' };

        const updatedSnapshot = await this.tournamentRepository.update(snapshot => {
            const result = applyTournamentScoreUpdate(snapshot, command);
            outcomeRef.status = result.status;
        });

        if (outcomeRef.status === 'not_found') {
            return { outcome: 'not_found', error: 'Tournament match not found' };
        }
        if (outcomeRef.status === 'invalid_tie_break') {
            return {
                outcome: 'invalid_tie_break',
                error: 'A tie-break winner must be one of the teams in a completed, tied knockout match.'
            };
        }

        const tm = updatedSnapshot.matches.find(match => match.id === command.matchId);
        if (!tm) {
            return { outcome: 'not_found', error: 'Tournament match not found' };
        }

        try {
            await this.relationalSync.syncMatchScore({
                homeTeamKey: tm.homeTeamKey,
                awayTeamKey: tm.awayTeamKey,
                homeScore: tm.homeScore,
                awayScore: tm.awayScore,
                status: tm.status,
                time: tm.time,
                pitchNumber: tm.pitch
            });
        } catch (dbErr) {
            console.error('Notice syncing tournament match score to database:', dbErr);
        }

        const derbyTeams = updatedSnapshot.teams || {};
        const homeName = tm.homeTeamKey && derbyTeams[tm.homeTeamKey]?.name
            ? derbyTeams[tm.homeTeamKey]!.name
            : (tm.homePlaceholder || 'TBD');
        const awayName = tm.awayTeamKey && derbyTeams[tm.awayTeamKey]?.name
            ? derbyTeams[tm.awayTeamKey]!.name
            : (tm.awayPlaceholder || 'TBD');

        const resultMatch = {
            id: tm.id,
            seasonId: 1,
            divisionId: 1,
            pitchNumber: tm.pitch || 1,
            time: tm.time || '18:30',
            homeScore: tm.homeScore,
            awayScore: tm.awayScore,
            tieBreakWinnerKey: tm.tieBreakWinnerKey || null,
            status: (tm.status || 'scheduled').toUpperCase(),
            stage: tm.stage,
            group: tm.group,
            homeTeam: { id: tm.homeTeamKey || tm.id, name: homeName },
            awayTeam: { id: tm.awayTeamKey || tm.id, name: awayName }
        };

        this.broadcaster.emitDerbyUpdate(updatedSnapshot);
        this.broadcaster.emitScoreUpdate(resultMatch);

        return { outcome: 'ok', resultMatch };
    }
}

export class GetTournamentStandingsUseCase {
    constructor(private readonly tournamentRepository: TournamentRepositoryPort) {}

    async execute(teamKeyToDbId: Map<string, number> = new Map()): Promise<LeagueStandingsRow[] | null> {
        const snapshot = await this.tournamentRepository.read();
        if (!snapshot?.teams || !Array.isArray(snapshot.matches)) {
            return null;
        }
        const rows = calculateTournamentLeagueStandings(snapshot, teamKeyToDbId);
        return rows.length > 0 ? rows : null;
    }
}
