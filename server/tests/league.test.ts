import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        match: {
            findMany: jest.fn(),
        },
        team: {
            findMany: jest.fn(),
        },
    },
}));

describe('League Log Algorithm', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockTeams = [
        { id: 1, name: 'Team A' },
        { id: 2, name: 'Team B' },
        { id: 3, name: 'Team C' },
    ];

    it('should calculate standings correctly considering win/draw/loss', async () => {
        (prisma.team.findMany as jest.Mock).mockResolvedValue(mockTeams);

        // Context:
        // Team A vs Team B: 2-0 (A wins 3pts, +2GD, 2GF | B 0pts, -2GD, 0GF)
        // Team A vs Team C: 1-1 (A draws 1pt,  0GD, 1GF | C 1pt,   0GD, 1GF)
        // Team B vs Team C: 3-1 (B wins 3pts, +2GD, 3GF | C 0pts, -2GD, 1GF)

        // Expected Standings:
        // 1. Team A: 4 pts, +2 GD, 3 GF
        // 2. Team B: 3 pts,  0 GD, 3 GF
        // 3. Team C: 1 pts, -2 GD, 2 GF

        const mockMatches = [
            { homeTeamId: 1, awayTeamId: 2, homeScore: 2, awayScore: 0, status: 'COMPLETED' },
            { homeTeamId: 1, awayTeamId: 3, homeScore: 1, awayScore: 1, status: 'COMPLETED' },
            { homeTeamId: 2, awayTeamId: 3, homeScore: 3, awayScore: 1, status: 'COMPLETED' },
        ];

        (prisma.match.findMany as jest.Mock).mockResolvedValue(mockMatches);

        const res = await request(app).get('/api/league/standings?seasonId=1&divisionId=1');

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(3);

        // Pos 1
        expect(res.body[0].teamName).toEqual('Team A');
        expect(res.body[0].points).toEqual(4);
        expect(res.body[0].goalDifference).toEqual(2);

        // Pos 2
        expect(res.body[1].teamName).toEqual('Team B');
        expect(res.body[1].points).toEqual(3);
        expect(res.body[1].goalDifference).toEqual(0);

        // Pos 3
        expect(res.body[2].teamName).toEqual('Team C');
        expect(res.body[2].points).toEqual(1);
        expect(res.body[2].goalDifference).toEqual(-2);
    });

    it('should resolve tie-breakers by Goal Difference and then Goals For', async () => {
        (prisma.team.findMany as jest.Mock).mockResolvedValue(mockTeams);

        // Team A vs Team B: 2-0 (A 3pts, +2GD, 2GF)
        // Team C vs Team B: 4-3 (C 3pts, +1GD, 4GF)
        // A and C both have 3 points. A has better GD (+2 vs +1)
        const mockMatches1 = [
            { homeTeamId: 1, awayTeamId: 2, homeScore: 2, awayScore: 0, status: 'COMPLETED' },
            { homeTeamId: 3, awayTeamId: 2, homeScore: 4, awayScore: 3, status: 'COMPLETED' },
        ];

        (prisma.match.findMany as jest.Mock).mockResolvedValue(mockMatches1);

        const res1 = await request(app).get('/api/league/standings?seasonId=1&divisionId=1');
        expect(res1.body[0].teamName).toEqual('Team A'); // +2 GD wins against +1 GD
        expect(res1.body[1].teamName).toEqual('Team C');
        expect(res1.body[2].teamName).toEqual('Team B');


        // Team A vs Team B: 2-1 (A 3pts, +1GD, 2GF)
        // Team C vs Team B: 3-2 (C 3pts, +1GD, 3GF)
        // A and C both have 3 points, both have +1 GD. C has better GF (3 vs 2)
        const mockMatches2 = [
            { homeTeamId: 1, awayTeamId: 2, homeScore: 2, awayScore: 1, status: 'COMPLETED' },
            { homeTeamId: 3, awayTeamId: 2, homeScore: 3, awayScore: 2, status: 'COMPLETED' },
        ];

        (prisma.match.findMany as jest.Mock).mockResolvedValue(mockMatches2);
        const res2 = await request(app).get('/api/league/standings?seasonId=2&divisionId=1');
        expect(res2.body[0].teamName).toEqual('Team C'); // 3 GF wins against 2 GF
        expect(res2.body[1].teamName).toEqual('Team A');
    });
});
