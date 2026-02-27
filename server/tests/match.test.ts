import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        match: {
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
});
