import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        player: {
            count: jest.fn(),
            create: jest.fn(),
        },
        team: {
            findUnique: jest.fn(),
        }
    },
}));

describe('Player Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a player when team has less than 9 players', async () => {
        (prisma.team.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'Tigers FC' });
        (prisma.player.count as jest.Mock).mockResolvedValue(8);
        (prisma.player.create as jest.Mock).mockResolvedValue({ id: 1, teamId: 1, firstName: 'John', lastName: 'Doe' });

        const res = await request(app)
            .post('/api/players')
            .send({ teamId: 1, firstName: 'John', lastName: 'Doe' });

        expect(res.statusCode).toEqual(201);
        expect(prisma.player.create).toHaveBeenCalledTimes(1);
        expect(prisma.player.create).toHaveBeenCalledWith({
            data: { teamId: 1, firstName: 'John', lastName: 'Doe' },
        });
    });

    it('should return 400 when trying to add a 10th player to a team', async () => {
        (prisma.team.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'Tigers FC' });
        (prisma.player.count as jest.Mock).mockResolvedValue(9);

        const res = await request(app)
            .post('/api/players')
            .send({ teamId: 1, firstName: 'Jane', lastName: 'Doe' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/maximum of 9 players/i);
        expect(prisma.player.create).not.toHaveBeenCalled();
    });

    it('should return 404 if the team does not exist', async () => {
        (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);

        const res = await request(app)
            .post('/api/players')
            .send({ teamId: 999, firstName: 'Ghost', lastName: 'Player' });

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toMatch(/team not found/i);
    });
});
