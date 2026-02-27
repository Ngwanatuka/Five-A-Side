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

    describe('Match Roster Cap (9 Players)', () => {
        it('should add a player to the roster successfully', async () => {
            // Mock match fetch to ensure player team belongs to match
            (prisma.match.findUnique as jest.Mock).mockResolvedValue({
                id: 1, homeTeamId: 10, awayTeamId: 20
            });
            // Mock player fetch
            (prisma.player.findUnique as jest.Mock).mockResolvedValue({
                id: 100, teamId: 10 // Belongs to home team
            });
            // Mock roster count
            (prisma.matchRoster.count as jest.Mock).mockResolvedValue(5); // Less than 9
            // Mock create
            (prisma.matchRoster.create as jest.Mock).mockResolvedValue({
                id: 1, matchId: 1, playerId: 100, payOnDayStatus: 'PAID'
            });

            const res = await request(app)
                .post('/api/matches/1/roster')
                .send({ playerId: 100, payOnDayStatus: 'PAID' });

            expect(res.statusCode).toEqual(201);
            expect(res.body.payOnDayStatus).toEqual('PAID');
            expect(prisma.matchRoster.create).toHaveBeenCalledWith({
                data: { matchId: 1, playerId: 100, payOnDayStatus: 'PAID' }
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
                .send({ playerId: 100, payOnDayStatus: 'PAID' });

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
                .send({ playerId: 100, payOnDayStatus: 'PAID' });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toMatch(/Player does not belong to either team in this match/);
        });
    });
});
