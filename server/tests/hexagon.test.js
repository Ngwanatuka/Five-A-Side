"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tournamentUseCases_1 = require("../src/hexagon/application/tournamentUseCases");
const createInitialSnapshot = () => ({
    teams: {
        'team-dench': { name: 'Dench City FC', group: 'A', color: '#12b84c' },
        'woza-madzala': { name: 'Ayoba FC', group: 'A', color: '#f59e0b' },
        'areyeng-fc': { name: 'Areyeng FC', group: 'A', color: '#3b82f6' },
        'bras-ba-kasi': { name: 'GSW FC', group: 'B', color: '#ef4444' },
        'gauteng-warriors': { name: 'Mambisa FC', group: 'B', color: '#8b5cf6' },
        'cpt-superstars': { name: 'Barcode FC', group: 'B', color: '#ec4899' }
    },
    matches: [
        { id: 'ga-m1', stage: 'group', group: 'A', homeTeamKey: 'team-dench', awayTeamKey: 'woza-madzala', homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'ga-m2', stage: 'group', group: 'A', homeTeamKey: 'team-dench', awayTeamKey: 'areyeng-fc', homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'ga-m3', stage: 'group', group: 'A', homeTeamKey: 'woza-madzala', awayTeamKey: 'areyeng-fc', homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'gb-m1', stage: 'group', group: 'B', homeTeamKey: 'bras-ba-kasi', awayTeamKey: 'gauteng-warriors', homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'gb-m2', stage: 'group', group: 'B', homeTeamKey: 'bras-ba-kasi', awayTeamKey: 'cpt-superstars', homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'gb-m3', stage: 'group', group: 'B', homeTeamKey: 'gauteng-warriors', awayTeamKey: 'cpt-superstars', homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'sf-1', stage: 'semi', homeTeamKey: null, awayTeamKey: null, homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'sf-2', stage: 'semi', homeTeamKey: null, awayTeamKey: null, homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'fn-3rd', stage: 'third_place', homeTeamKey: null, awayTeamKey: null, homeScore: null, awayScore: null, status: 'scheduled' },
        { id: 'fn-gold', stage: 'final', homeTeamKey: null, awayTeamKey: null, homeScore: null, awayScore: null, status: 'scheduled' }
    ],
    players: [],
    goalEvents: []
});
class InMemoryTournamentRepository {
    snapshot;
    constructor(initial) {
        this.snapshot = initial ? JSON.parse(JSON.stringify(initial)) : createInitialSnapshot();
    }
    async read() {
        return JSON.parse(JSON.stringify(this.snapshot));
    }
    async write(snapshot) {
        this.snapshot = JSON.parse(JSON.stringify(snapshot));
    }
    async update(mutator) {
        mutator(this.snapshot);
        return JSON.parse(JSON.stringify(this.snapshot));
    }
}
class SpyRelationalSyncAdapter {
    syncedMatches = [];
    async syncMatchScore(params) {
        this.syncedMatches.push(params);
    }
}
class SpyRealtimeBroadcaster {
    derbyUpdates = [];
    scoreUpdates = [];
    emitDerbyUpdate(snapshot) {
        this.derbyUpdates.push(snapshot);
    }
    emitScoreUpdate(matchPayload) {
        this.scoreUpdates.push(matchPayload);
    }
    emitTeamRegistered() { }
}
describe('Hexagonal Architecture - Tournament Domain & Use Cases', () => {
    it('records final score, preserves existing squad players, syncs relational port, and broadcasts realtime events', async () => {
        const snapshotWithCustomSquad = createInitialSnapshot();
        snapshotWithCustomSquad.players = [
            {
                id: 'custom-star-99',
                teamKey: 'team-dench',
                name: 'Sipho Tshabalala',
                jerseyNumber: 99,
                position: 'FWD',
                isCaptain: false
            }
        ];
        const repo = new InMemoryTournamentRepository(snapshotWithCustomSquad);
        const relationalSync = new SpyRelationalSyncAdapter();
        const broadcaster = new SpyRealtimeBroadcaster();
        const recordScoreUseCase = new tournamentUseCases_1.RecordTournamentMatchScoreUseCase(repo, relationalSync, broadcaster);
        const standingsUseCase = new tournamentUseCases_1.GetTournamentStandingsUseCase(repo);
        const response = await recordScoreUseCase.execute({
            matchId: 'ga-m1',
            homeScore: 4,
            awayScore: 1,
            status: 'completed',
            goalEvents: [
                {
                    id: 'goal-1',
                    matchId: 'ga-m1',
                    teamKey: 'team-dench',
                    scorerPlayerId: 'custom-star-99',
                    scorerPlayerName: 'Sipho Tshabalala',
                    minute: 12
                }
            ]
        });
        expect(response.outcome).toBe('ok');
        if (response.outcome === 'ok') {
            expect(response.resultMatch.homeScore).toBe(4);
            expect(response.resultMatch.awayScore).toBe(1);
            expect(response.resultMatch.status).toBe('COMPLETED');
        }
        expect(relationalSync.syncedMatches).toHaveLength(1);
        expect(broadcaster.derbyUpdates).toHaveLength(1);
        expect(broadcaster.scoreUpdates).toHaveLength(1);
        // Ensure custom player data was never lost
        const updatedSnapshot = await repo.read();
        expect(updatedSnapshot?.players?.some(p => p.id === 'custom-star-99')).toBe(true);
        expect(updatedSnapshot?.goalEvents).toHaveLength(1);
        // Verify League Standings Use Case reflects the win and goals
        const standings = await standingsUseCase.execute(new Map([
            ['team-dench', 1],
            ['woza-madzala', 2]
        ]));
        expect(standings).not.toBeNull();
        expect(standings[0]).toMatchObject({
            teamName: 'Dench City FC',
            played: 1,
            won: 1,
            goalsFor: 4,
            goalsAgainst: 1,
            goalDifference: 3,
            points: 3,
            form: ['W']
        });
    });
    it('migrates legacy group assignments on read while preserving completed match scores', async () => {
        const legacySnapshot = createInitialSnapshot();
        // Simulate legacy groups before migration where ga-m1 was already scored
        legacySnapshot.teams['cpt-superstars'].group = 'A';
        legacySnapshot.teams['areyeng-fc'].group = 'B';
        legacySnapshot.matches[0].homeScore = 2;
        legacySnapshot.matches[0].awayScore = 0;
        legacySnapshot.matches[0].status = 'completed';
        // Legacy unplayed match pairing
        legacySnapshot.matches[1].homeTeamKey = 'team-dench';
        legacySnapshot.matches[1].awayTeamKey = 'cpt-superstars';
        const repo = new InMemoryTournamentRepository(legacySnapshot);
        const standingsUseCase = new tournamentUseCases_1.GetTournamentStandingsUseCase(repo);
        const standings = await standingsUseCase.execute(new Map());
        expect(standings).not.toBeNull();
        const denchRow = standings.find(r => r.teamName === 'Dench City FC');
        expect(denchRow?.points).toBe(3);
        expect(denchRow?.goalsFor).toBe(2);
    });
});
//# sourceMappingURL=hexagon.test.js.map