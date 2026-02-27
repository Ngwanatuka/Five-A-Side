import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        team: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        teamSeasonRegistration: {
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
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
    it('should register a team for a season (Pending status)', async () => {
        const mockRegistration = {
            id: 1,
            teamId: 1,
            seasonId: 1,
            divisionId: null,
            status: 'PENDING',
        };

        (prisma.teamSeasonRegistration.create as jest.Mock).mockResolvedValue(mockRegistration);

        const res = await request(app)
            .post('/api/teams/register')
            .send({ teamId: 1, seasonId: 1 });

        expect(res.statusCode).toEqual(201);
        expect(res.body.status).toEqual('PENDING');
        expect(prisma.teamSeasonRegistration.create).toHaveBeenCalledWith({
            data: { teamId: 1, seasonId: 1, status: 'PENDING' },
        });
    });

    it('should approve a team registration and assign division', async () => {
        const mockApproved = {
            id: 1,
            teamId: 1,
            seasonId: 1,
            divisionId: 2,
            status: 'APPROVED',
        };

        // Assume < 8 teams are registered
        (prisma.teamSeasonRegistration.count as jest.Mock).mockResolvedValue(5);
        (prisma.teamSeasonRegistration.update as jest.Mock).mockResolvedValue(mockApproved);

        const res = await request(app)
            .put('/api/teams/registrations/1/approve')
            .send({ divisionId: 2 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('APPROVED');
        expect(res.body.divisionId).toEqual(2);
    });

    it('should fail to approve if division is full (8 teams)', async () => {
        (prisma.teamSeasonRegistration.count as jest.Mock).mockResolvedValue(8);

        const res = await request(app)
            .put('/api/teams/registrations/1/approve')
            .send({ divisionId: 2 });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/Division 2 is full/);
        expect(prisma.teamSeasonRegistration.update).not.toHaveBeenCalled();
    });
});
