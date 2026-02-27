import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        match: {
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        player: {
            findUnique: jest.fn(),
        },
        matchRoster: {
            count: jest.fn(),
            create: jest.fn(),
        },
        playerSeasonFinance: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('Match Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should record a match score and mark it COMPLETED', async () => {
        (prisma.match.update as jest.Mock).mockResolvedValue({
            id: 1, homeScore: 2, awayScore: 1, status: 'COMPLETED'
        });

        const res = await request(app)
            .patch('/api/matches/1/score')
            .send({ homeScore: 2, awayScore: 1 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('COMPLETED');
        expect(prisma.match.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { homeScore: 2, awayScore: 1, status: 'COMPLETED' },
        });
    });

    describe('Match Roster Cap & Payment Integration (9 Players)', () => {
        it('should add a prepaying player to the roster successfully and decrement credits', async () => {
            // Mock match fetch to ensure player team belongs to match
            (prisma.match.findUnique as jest.Mock).mockResolvedValue({
                id: 1, homeTeamId: 10, awayTeamId: 20, seasonId: 100
            });
            // Mock player fetch
            (prisma.player.findUnique as jest.Mock).mockResolvedValue({
                id: 100, teamId: 10 // Belongs to home team
            });
            // Mock roster count
            (prisma.matchRoster.count as jest.Mock).mockResolvedValue(5); // Less than 9

            // Mock finance fetch
            (prisma.playerSeasonFinance.findUnique as jest.Mock).mockResolvedValue({
                id: 50, playerId: 100, seasonId: 100, paymentTier: 'HALF', gamesCredited: 7
            });

            // Mock create
            (prisma.matchRoster.create as jest.Mock).mockResolvedValue({
                id: 1, matchId: 1, playerId: 100, payOnDayStatus: 'PAID'
            });

            const res = await request(app)
                .post('/api/matches/1/roster')
                .send({ playerId: 100 });

            expect(res.statusCode).toEqual(201);
            expect(res.body.payOnDayStatus).toEqual('PAID');
            expect(prisma.playerSeasonFinance.update).toHaveBeenCalledWith({
                where: { playerId_seasonId: { playerId: 100, seasonId: 100 } },
                data: { gamesCredited: 6 }
            });
            expect(prisma.matchRoster.create).toHaveBeenCalledWith({
                data: { matchId: 1, playerId: 100, payOnDayStatus: 'PAID' }
            });
        });

        it('should add a pay-on-day player to the roster and mark OWES', async () => {
            // Mock match fetch to ensure player team belongs to match
            (prisma.match.findUnique as jest.Mock).mockResolvedValue({
                id: 2, homeTeamId: 10, awayTeamId: 20, seasonId: 100
            });
            // Mock player fetch
            (prisma.player.findUnique as jest.Mock).mockResolvedValue({
                id: 200, teamId: 20 // Belongs to away team
            });
            // Mock roster count
            (prisma.matchRoster.count as jest.Mock).mockResolvedValue(8); // Cutting it close, but allowed

            // Mock finance fetch - 0 credits
            (prisma.playerSeasonFinance.findUnique as jest.Mock).mockResolvedValue({
                id: 51, playerId: 200, seasonId: 100, paymentTier: 'PAY_ON_DAY', gamesCredited: 0
            });

            // Mock create
            (prisma.matchRoster.create as jest.Mock).mockResolvedValue({
                id: 2, matchId: 2, playerId: 200, payOnDayStatus: 'OWES'
            });

            const res = await request(app)
                .post('/api/matches/2/roster')
                .send({ playerId: 200 });

            expect(res.statusCode).toEqual(201);
            expect(res.body.payOnDayStatus).toEqual('OWES');
            expect(prisma.playerSeasonFinance.update).not.toHaveBeenCalled(); // No decrement if 0 credits
            expect(prisma.matchRoster.create).toHaveBeenCalledWith({
                data: { matchId: 2, playerId: 200, payOnDayStatus: 'OWES' }
            });
        });

        it('should fail to add a 10th player to the roster', async () => {
            // Mock match fetch
            (prisma.match.findUnique as jest.Mock).mockResolvedValue({
                id: 1, homeTeamId: 10, awayTeamId: 20
            });
            // Mock player fetch
            (prisma.player.findUnique as jest.Mock).mockResolvedValue({
                id: 100, teamId: 10
            });
            // Mock roster count returning 9 (limit reached)
            (prisma.matchRoster.count as jest.Mock).mockResolvedValue(9);

            const res = await request(app)
                .post('/api/matches/1/roster')
                .send({ playerId: 100 });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toMatch(/Team 10 has already reached the maximum/);
            expect(prisma.matchRoster.create).not.toHaveBeenCalled();
        });

        it('should fail if player team is not part of the match', async () => {
            // Mock match fetch
            (prisma.match.findUnique as jest.Mock).mockResolvedValue({
                id: 1, homeTeamId: 10, awayTeamId: 20
            });
            // Mock player fetch (teamId is 30, not in match)
            (prisma.player.findUnique as jest.Mock).mockResolvedValue({
                id: 100, teamId: 30
            });

            const res = await request(app)
                .post('/api/matches/1/roster')
                .send({ playerId: 100 });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toMatch(/Player does not belong to either team in this match/);
        });
    });
});
