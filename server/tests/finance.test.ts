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
});
