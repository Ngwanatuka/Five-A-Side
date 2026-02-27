import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        teamSeasonRegistration: {
            findMany: jest.fn(),
        },
        match: {
            createMany: jest.fn(),
        },
    },
}));

describe('Fixture Generator Endpoint', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should generate exactly 56 matches for an 8 team division using double round robin', async () => {
        // Mock 8 registered teams in the division
        const mockTeams = Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            teamId: i + 101, // Mock team IDs
            seasonId: 1,
            divisionId: 1,
            status: 'APPROVED'
        }));

        (prisma.teamSeasonRegistration.findMany as jest.Mock).mockResolvedValue(mockTeams);
        (prisma.match.createMany as jest.Mock).mockResolvedValue({ count: 56 });

        const res = await request(app)
            .post('/api/league/seasons/1/divisions/1/generate-fixtures')
            .send({ startDate: '2026-03-01', pitches: [1, 2] });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toMatch(/56 matches generated/);
        
        expect(prisma.teamSeasonRegistration.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.match.createMany).toHaveBeenCalledTimes(1);
        
        // Let's verify exactly 56 matches were attempted to be created
        const createArgs = (prisma.match.createMany as jest.Mock).mock.calls[0][0];
        expect(createArgs.data.length).toBe(56);
    });

    it('should fail if division does not have exactly 8 teams', async () => {
        // Mock 7 registered teams in the division
        const mockTeams = Array.from({ length: 7 }, (_, i) => ({
            id: i + 1,
            teamId: i + 101,
            seasonId: 1,
            divisionId: 1,
            status: 'APPROVED'
        }));

        (prisma.teamSeasonRegistration.findMany as jest.Mock).mockResolvedValue(mockTeams);

        const res = await request(app)
            .post('/api/league/seasons/1/divisions/1/generate-fixtures')
            .send({ startDate: '2026-03-01', pitches: [1, 2] });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/Division must have exactly 8 approved teams/);
        expect(prisma.match.createMany).not.toHaveBeenCalled();
    });
});
