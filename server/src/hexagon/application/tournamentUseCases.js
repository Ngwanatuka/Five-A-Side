"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTournamentStandingsUseCase = exports.RecordTournamentMatchScoreUseCase = void 0;
const tournamentDomain_1 = require("../domain/tournamentDomain");
class RecordTournamentMatchScoreUseCase {
    tournamentRepository;
    relationalSync;
    broadcaster;
    constructor(tournamentRepository, relationalSync, broadcaster) {
        this.tournamentRepository = tournamentRepository;
        this.relationalSync = relationalSync;
        this.broadcaster = broadcaster;
    }
    async execute(command) {
        const outcomeRef = { status: 'ok' };
        const updatedSnapshot = await this.tournamentRepository.update(snapshot => {
            const result = (0, tournamentDomain_1.applyTournamentScoreUpdate)(snapshot, command);
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
        }
        catch (dbErr) {
            console.error('Notice syncing tournament match score to database:', dbErr);
        }
        const derbyTeams = updatedSnapshot.teams || {};
        const homeName = tm.homeTeamKey && derbyTeams[tm.homeTeamKey]?.name
            ? derbyTeams[tm.homeTeamKey].name
            : (tm.homePlaceholder || 'TBD');
        const awayName = tm.awayTeamKey && derbyTeams[tm.awayTeamKey]?.name
            ? derbyTeams[tm.awayTeamKey].name
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
exports.RecordTournamentMatchScoreUseCase = RecordTournamentMatchScoreUseCase;
class GetTournamentStandingsUseCase {
    tournamentRepository;
    constructor(tournamentRepository) {
        this.tournamentRepository = tournamentRepository;
    }
    async execute(teamKeyToDbId = new Map()) {
        const snapshot = await this.tournamentRepository.read();
        if (!snapshot?.teams || !Array.isArray(snapshot.matches)) {
            return null;
        }
        const rows = (0, tournamentDomain_1.calculateTournamentLeagueStandings)(snapshot, teamKeyToDbId);
        return rows.length > 0 ? rows : null;
    }
}
exports.GetTournamentStandingsUseCase = GetTournamentStandingsUseCase;
//# sourceMappingURL=tournamentUseCases.js.map