import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        playerSeasonFinance: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        matchRoster: {
            create: jest.fn(),
        }
    },
}));

describe('Finance Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should register player finance for a full season', async () => {
        (prisma.playerSeasonFinance.create as jest.Mock).mockResolvedValue({
            id: 1, playerId: 1, seasonId: 1, paymentTier: 'FULL', amountPaid: 622, gamesCredited: 14
        });

        const res = await request(app)
            .post('/api/finances/register')
            .send({ playerId: 1, seasonId: 1, paymentTier: 'FULL', amountPaid: 622 });

        expect(res.statusCode).toEqual(201);
        expect(prisma.playerSeasonFinance.create).toHaveBeenCalledWith({
            data: { playerId: 1, seasonId: 1, paymentTier: 'FULL', amountPaid: 622, gamesCredited: 14 }
        });
    });

    it('should register player finance for a half season', async () => {
        (prisma.playerSeasonFinance.create as jest.Mock).mockResolvedValue({
            id: 2, playerId: 2, seasonId: 1, paymentTier: 'HALF', amountPaid: 311, gamesCredited: 7
        });

        const res = await request(app)
            .post('/api/finances/register')
            .send({ playerId: 2, seasonId: 1, paymentTier: 'HALF', amountPaid: 311 });

        expect(res.statusCode).toEqual(201);
        expect(prisma.playerSeasonFinance.create).toHaveBeenCalledWith({
            data: { playerId: 2, seasonId: 1, paymentTier: 'HALF', amountPaid: 311, gamesCredited: 7 }
        });
    });

    it('should add player to match roster as PAID if gamesCredited > 0', async () => {
        (prisma.playerSeasonFinance.findUnique as jest.Mock).mockResolvedValue({
            id: 2, playerId: 2, seasonId: 1, paymentTier: 'HALF', amountPaid: 311, gamesCredited: 7
        });

        (prisma.matchRoster.create as jest.Mock).mockResolvedValue({
            id: 1, matchId: 1, playerId: 2, payOnDayStatus: 'PAID'
        });

        const res = await request(app)
            .post('/api/finances/roster')
            .send({ matchId: 1, playerId: 2, seasonId: 1 });

        expect(res.statusCode).toEqual(201);
        expect(res.body.payOnDayStatus).toEqual('PAID');
        expect(prisma.matchRoster.create).toHaveBeenCalledWith({
            data: { matchId: 1, playerId: 2, payOnDayStatus: 'PAID' }
        });
        expect(prisma.playerSeasonFinance.update).toHaveBeenCalledWith({
            where: { playerId_seasonId: { playerId: 2, seasonId: 1 } },
            data: { gamesCredited: 6 }
        });
    });

    it('should add player to match roster as OWES if gamesCredited is 0', async () => {
        (prisma.playerSeasonFinance.findUnique as jest.Mock).mockResolvedValue({
            id: 2, playerId: 2, seasonId: 1, paymentTier: 'HALF', amountPaid: 311, gamesCredited: 0
        });

        (prisma.matchRoster.create as jest.Mock).mockResolvedValue({
            id: 2, matchId: 2, playerId: 2, payOnDayStatus: 'OWES'
        });

        const res = await request(app)
            .post('/api/finances/roster')
            .send({ matchId: 2, playerId: 2, seasonId: 1 });

        expect(res.statusCode).toEqual(201);
        expect(res.body.payOnDayStatus).toEqual('OWES');
        expect(prisma.playerSeasonFinance.update).not.toHaveBeenCalled(); // No decrement if 0
    });
});
