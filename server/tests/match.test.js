"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const fs_1 = __importDefault(require("fs"));
const app_1 = require("../src/app");
const prisma_1 = __importDefault(require("../src/prisma"));
jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        match: {
            update: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockImplementation(({ where }) => Promise.resolve({
                id: where.homeTeamId === 10 ? 101 : 202
            })),
        },
        player: {
            findUnique: jest.fn(),
            findMany: jest.fn().mockResolvedValue([]),
        },
        matchRoster: {
            count: jest.fn(),
            create: jest.fn(),
        },
        playerSeasonFinance: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        team: {
            findFirst: jest.fn().mockImplementation(({ where }) => {
                const teamIds = {
                    'team-a@tournament.local': 10,
                    'team-a-away@tournament.local': 11,
                    'team-b@tournament.local': 20,
                    'team-b-away@tournament.local': 21
                };
                return Promise.resolve({ id: teamIds[where.managerContact] });
            }),
        },
        season: {
            upsert: jest.fn().mockResolvedValue({}),
        },
        division: {
            upsert: jest.fn().mockResolvedValue({}),
        },
        tournamentState: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
            upsert: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({})
        },
        $transaction: jest.fn(async (operation) => operation({
            $queryRaw: async () => [{
                    payload: JSON.parse(require('fs').readFileSync('mock-tournament-state', 'utf-8'))
                }],
            tournamentState: {
                update: jest.fn().mockResolvedValue({})
            }
        }))
    },
}));
describe('Match Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    it('preserves separate referee submissions and goal events for simultaneous tournament matches', async () => {
        let tournamentData = {
            teams: {},
            matches: [
                { id: 'ga-m1', homeScore: null, awayScore: null, status: 'scheduled', homeTeamKey: 'team-a', awayTeamKey: 'team-a-away' },
                { id: 'gb-m1', homeScore: null, awayScore: null, status: 'scheduled', homeTeamKey: 'team-b', awayTeamKey: 'team-b-away' }
            ],
            goalEvents: []
        };
        jest.spyOn(fs_1.default, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs_1.default, 'readFileSync').mockImplementation(() => JSON.stringify(tournamentData));
        jest.spyOn(fs_1.default, 'writeFileSync').mockImplementation((_path, contents) => {
            tournamentData = JSON.parse(contents.toString());
        });
        jest.spyOn(fs_1.default, 'renameSync').mockImplementation(() => undefined);
        const [pitchOne, pitchTwo] = await Promise.all([
            (0, supertest_1.default)(app_1.app)
                .patch('/api/matches/ga-m1/score')
                .set('x-user-role', 'REFEREE')
                .send({
                homeScore: 2,
                awayScore: 1,
                status: 'COMPLETED',
                goalEvents: [{
                        id: 'ev-ga-m1',
                        matchId: 'ga-m1',
                        teamKey: 'team-a',
                        scorerPlayerId: 'player-a',
                        assistPlayerId: 'player-a-assist',
                        assistPlayerName: 'Assist Player',
                        minute: 5
                    }]
            }),
            (0, supertest_1.default)(app_1.app)
                .patch('/api/matches/gb-m1/score')
                .set('x-user-role', 'REFEREE')
                .send({
                homeScore: 0,
                awayScore: 3,
                status: 'COMPLETED',
                goalEvents: [{
                        id: 'ev-gb-m1',
                        matchId: 'gb-m1',
                        teamKey: 'team-b',
                        scorerPlayerId: 'player-b',
                        minute: 8
                    }]
            })
        ]);
        expect(pitchOne.statusCode).toBe(200);
        expect(pitchTwo.statusCode).toBe(200);
        expect(tournamentData.matches).toEqual([
            { id: 'ga-m1', homeScore: 2, awayScore: 1, status: 'completed', homeTeamKey: 'team-a', awayTeamKey: 'team-a-away', tieBreakWinnerKey: null },
            { id: 'gb-m1', homeScore: 0, awayScore: 3, status: 'completed', homeTeamKey: 'team-b', awayTeamKey: 'team-b-away', tieBreakWinnerKey: null }
        ]);
        expect(tournamentData.goalEvents.map(event => event.id).sort()).toEqual(['ev-ga-m1', 'ev-gb-m1']);
        expect(prisma_1.default.match.update).toHaveBeenCalledTimes(2);
        expect(prisma_1.default.match.update).toHaveBeenCalledWith({
            where: { id: 101 },
            data: { homeScore: 2, awayScore: 1, status: 'COMPLETED' }
        });
        expect(prisma_1.default.match.update).toHaveBeenCalledWith({
            where: { id: 202 },
            data: { homeScore: 0, awayScore: 3, status: 'COMPLETED' }
        });
        expect(tournamentData.goalEvents.find(event => event.id === 'ev-ga-m1')).toMatchObject({
            assistPlayerId: 'player-a-assist',
            assistPlayerName: 'Assist Player'
        });
        const snapshotSave = await (0, supertest_1.default)(app_1.app)
            .post('/api/derby')
            .set('x-user-role', 'REFEREE')
            .send({
            matches: [
                { id: 'ga-m1', homeScore: null, awayScore: null, status: 'scheduled', homeTeamKey: 'team-a' },
                { id: 'gb-m1', homeScore: null, awayScore: null, status: 'scheduled', homeTeamKey: 'team-b' }
            ]
        });
        expect(snapshotSave.statusCode).toBe(200);
        expect(tournamentData.matches).toEqual([
            { id: 'ga-m1', homeScore: 2, awayScore: 1, status: 'completed', homeTeamKey: 'team-a', awayTeamKey: 'team-a-away', tieBreakWinnerKey: null },
            { id: 'gb-m1', homeScore: 0, awayScore: 3, status: 'completed', homeTeamKey: 'team-b', awayTeamKey: 'team-b-away', tieBreakWinnerKey: null }
        ]);
        expect(tournamentData.goalEvents.map(event => event.id).sort()).toEqual(['ev-ga-m1', 'ev-gb-m1']);
    });
    it('records a valid shootout winner for a tied knockout match and rejects a non-participant', async () => {
        let tournamentData = {
            teams: {
                'team-a': { name: 'Team A' },
                'team-b': { name: 'Team B' },
                'team-c': { name: 'Team C' }
            },
            matches: [{
                    id: 'sf-1',
                    stage: 'semi',
                    homeTeamKey: 'team-a',
                    awayTeamKey: 'team-b',
                    homeScore: 1,
                    awayScore: 1,
                    status: 'completed'
                }],
            goalEvents: []
        };
        jest.spyOn(fs_1.default, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs_1.default, 'readFileSync').mockImplementation(() => JSON.stringify(tournamentData));
        jest.spyOn(fs_1.default, 'writeFileSync').mockImplementation((_path, contents) => {
            tournamentData = JSON.parse(contents.toString());
        });
        jest.spyOn(fs_1.default, 'renameSync').mockImplementation(() => undefined);
        const validResult = await (0, supertest_1.default)(app_1.app)
            .patch('/api/matches/sf-1/score')
            .set('x-user-role', 'REFEREE')
            .send({
            homeScore: 1,
            awayScore: 1,
            status: 'COMPLETED',
            tieBreakWinnerKey: 'team-b'
        });
        expect(validResult.statusCode).toBe(200);
        expect(tournamentData.matches[0].tieBreakWinnerKey).toBe('team-b');
        expect(validResult.body.tieBreakWinnerKey).toBe('team-b');
        const validSnapshot = await (0, supertest_1.default)(app_1.app)
            .post('/api/derby')
            .set('x-user-role', 'REFEREE')
            .send({
            matches: [{
                    id: 'sf-1',
                    homeTeamKey: 'team-a',
                    awayTeamKey: 'team-b',
                    tieBreakWinnerKey: 'team-b'
                }]
        });
        expect(validSnapshot.statusCode).toBe(200);
        const invalidResult = await (0, supertest_1.default)(app_1.app)
            .patch('/api/matches/sf-1/score')
            .set('x-user-role', 'REFEREE')
            .send({
            homeScore: 1,
            awayScore: 1,
            status: 'COMPLETED',
            tieBreakWinnerKey: 'team-c'
        });
        expect(invalidResult.statusCode).toBe(400);
        expect(tournamentData.matches[0].tieBreakWinnerKey).toBe('team-b');
        const invalidSnapshot = await (0, supertest_1.default)(app_1.app)
            .post('/api/derby')
            .set('x-user-role', 'REFEREE')
            .send({
            matches: [{
                    id: 'sf-1',
                    tieBreakWinnerKey: 'team-c'
                }]
        });
        expect(invalidSnapshot.statusCode).toBe(400);
        expect(tournamentData.matches[0].tieBreakWinnerKey).toBe('team-b');
    });
    it('should record a match score and mark it COMPLETED', async () => {
        prisma_1.default.match.update.mockResolvedValue({
            id: 1, homeScore: 2, awayScore: 1, status: 'COMPLETED'
        });
        const res = await (0, supertest_1.default)(app_1.app)
            .patch('/api/matches/1/score')
            .set('x-user-role', 'REFEREE')
            .send({ homeScore: 2, awayScore: 1, status: 'COMPLETED' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('COMPLETED');
        expect(prisma_1.default.match.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { homeScore: 2, awayScore: 1, status: 'COMPLETED' },
            include: { homeTeam: true, awayTeam: true }
        });
    });
    describe('Match Roster Cap & Payment Integration (9 Players)', () => {
        it('should add a prepaying player to the roster successfully and decrement credits', async () => {
            // Mock match fetch to ensure player team belongs to match
            prisma_1.default.match.findUnique.mockResolvedValue({
                id: 1, homeTeamId: 10, awayTeamId: 20, seasonId: 100
            });
            // Mock player fetch
            prisma_1.default.player.findUnique.mockResolvedValue({
                id: 100, teamId: 10 // Belongs to home team
            });
            // Mock roster count
            prisma_1.default.matchRoster.count.mockResolvedValue(5); // Less than 9
            // Mock finance fetch
            prisma_1.default.playerSeasonFinance.findUnique.mockResolvedValue({
                id: 50, playerId: 100, seasonId: 100, paymentTier: 'HALF', gamesCredited: 7
            });
            // Mock create
            prisma_1.default.matchRoster.create.mockResolvedValue({
                id: 1, matchId: 1, playerId: 100, payOnDayStatus: 'PAID'
            });
            const res = await (0, supertest_1.default)(app_1.app)
                .post('/api/matches/1/roster')
                .set('x-user-role', 'REFEREE')
                .send({ playerId: 100 });
            expect(res.statusCode).toEqual(201);
            expect(res.body.payOnDayStatus).toEqual('PAID');
            expect(prisma_1.default.playerSeasonFinance.update).toHaveBeenCalledWith({
                where: { playerId_seasonId: { playerId: 100, seasonId: 100 } },
                data: { gamesCredited: 6 }
            });
            expect(prisma_1.default.matchRoster.create).toHaveBeenCalledWith({
                data: { matchId: 1, playerId: 100, payOnDayStatus: 'PAID' }
            });
        });
        it('should add a pay-on-day player to the roster and mark OWES', async () => {
            // Mock match fetch to ensure player team belongs to match
            prisma_1.default.match.findUnique.mockResolvedValue({
                id: 2, homeTeamId: 10, awayTeamId: 20, seasonId: 100
            });
            // Mock player fetch
            prisma_1.default.player.findUnique.mockResolvedValue({
                id: 200, teamId: 20 // Belongs to away team
            });
            // Mock roster count
            prisma_1.default.matchRoster.count.mockResolvedValue(8); // Cutting it close, but allowed
            // Mock finance fetch - 0 credits
            prisma_1.default.playerSeasonFinance.findUnique.mockResolvedValue({
                id: 51, playerId: 200, seasonId: 100, paymentTier: 'PAY_ON_DAY', gamesCredited: 0
            });
            // Mock create
            prisma_1.default.matchRoster.create.mockResolvedValue({
                id: 2, matchId: 2, playerId: 200, payOnDayStatus: 'OWES'
            });
            const res = await (0, supertest_1.default)(app_1.app)
                .post('/api/matches/2/roster')
                .set('x-user-role', 'REFEREE')
                .send({ playerId: 200 });
            expect(res.statusCode).toEqual(201);
            expect(res.body.payOnDayStatus).toEqual('OWES');
            expect(prisma_1.default.playerSeasonFinance.update).not.toHaveBeenCalled(); // No decrement if 0 credits
            expect(prisma_1.default.matchRoster.create).toHaveBeenCalledWith({
                data: { matchId: 2, playerId: 200, payOnDayStatus: 'OWES' }
            });
        });
        it('should fail to add a 10th player to the roster', async () => {
            // Mock match fetch
            prisma_1.default.match.findUnique.mockResolvedValue({
                id: 1, homeTeamId: 10, awayTeamId: 20
            });
            // Mock player fetch
            prisma_1.default.player.findUnique.mockResolvedValue({
                id: 100, teamId: 10
            });
            // Mock roster count returning 9 (limit reached)
            prisma_1.default.matchRoster.count.mockResolvedValue(9);
            const res = await (0, supertest_1.default)(app_1.app)
                .post('/api/matches/1/roster')
                .set('x-user-role', 'REFEREE')
                .send({ playerId: 100 });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toMatch(/Team 10 has already reached the maximum/);
            expect(prisma_1.default.matchRoster.create).not.toHaveBeenCalled();
        });
        it('should fail if player team is not part of the match', async () => {
            // Mock match fetch
            prisma_1.default.match.findUnique.mockResolvedValue({
                id: 1, homeTeamId: 10, awayTeamId: 20
            });
            // Mock player fetch (teamId is 30, not in match)
            prisma_1.default.player.findUnique.mockResolvedValue({
                id: 100, teamId: 30
            });
            const res = await (0, supertest_1.default)(app_1.app)
                .post('/api/matches/1/roster')
                .set('x-user-role', 'REFEREE')
                .send({ playerId: 100 });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toMatch(/Player does not belong to either team in this match/);
        });
    });
});
//# sourceMappingURL=match.test.js.map