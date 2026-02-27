import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        team: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

describe('Team Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new team', async () => {
        const mockTeam = {
            id: 1,
            name: 'Tigers FC',
            logoUrl: null,
            managerContact: 'john@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        (prisma.team.create as jest.Mock).mockResolvedValue(mockTeam);

        const res = await request(app)
            .post('/api/teams')
            .send({ name: 'Tigers FC', managerContact: 'john@example.com' });

        expect(res.statusCode).toEqual(201);
        expect(res.body.id).toEqual(mockTeam.id);
        expect(res.body.name).toEqual(mockTeam.name);
        expect(prisma.team.create).toHaveBeenCalledTimes(1);
        expect(prisma.team.create).toHaveBeenCalledWith({
            data: { name: 'Tigers FC', managerContact: 'john@example.com', logoUrl: undefined },
        });
    });

    it('should return 400 if validation fails', async () => {
        const res = await request(app)
            .post('/api/teams')
            .send({ name: '' }); // Missing managerContact

        expect(res.statusCode).toEqual(400);
        expect(prisma.team.create).not.toHaveBeenCalled();
    });
});
