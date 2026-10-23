"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const prisma_1 = __importDefault(require("../src/prisma"));
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
        prisma_1.default.teamSeasonRegistration.findMany.mockResolvedValue(mockTeams);
        prisma_1.default.match.createMany.mockResolvedValue({ count: 56 });
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/league/seasons/1/divisions/1/generate-fixtures')
            .send({ startDate: '2026-03-01', pitches: [1, 2] });
        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toMatch(/56 matches generated/);
        expect(prisma_1.default.teamSeasonRegistration.findMany).toHaveBeenCalledTimes(1);
        expect(prisma_1.default.match.createMany).toHaveBeenCalledTimes(1);
        // Let's verify exactly 56 matches were attempted to be created
        const createArgs = prisma_1.default.match.createMany.mock.calls[0][0];
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
        prisma_1.default.teamSeasonRegistration.findMany.mockResolvedValue(mockTeams);
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/league/seasons/1/divisions/1/generate-fixtures')
            .send({ startDate: '2026-03-01', pitches: [1, 2] });
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/Division must have exactly 8 approved teams/);
        expect(prisma_1.default.match.createMany).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=fixture.test.js.map