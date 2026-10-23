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
        prisma_1.default.team.findUnique.mockResolvedValue({ id: 1, name: 'Tigers FC' });
        prisma_1.default.player.count.mockResolvedValue(8);
        prisma_1.default.player.create.mockResolvedValue({ id: 1, teamId: 1, firstName: 'John', lastName: 'Doe' });
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/players')
            .send({ teamId: 1, firstName: 'John', lastName: 'Doe' });
        expect(res.statusCode).toEqual(201);
        expect(prisma_1.default.player.create).toHaveBeenCalledTimes(1);
        expect(prisma_1.default.player.create).toHaveBeenCalledWith({
            data: { teamId: 1, firstName: 'John', lastName: 'Doe' },
        });
    });
    it('should return 400 when trying to add a 10th player to a team', async () => {
        prisma_1.default.team.findUnique.mockResolvedValue({ id: 1, name: 'Tigers FC' });
        prisma_1.default.player.count.mockResolvedValue(9);
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/players')
            .send({ teamId: 1, firstName: 'Jane', lastName: 'Doe' });
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/maximum of 9 players/i);
        expect(prisma_1.default.player.create).not.toHaveBeenCalled();
    });
    it('should return 404 if the team does not exist', async () => {
        prisma_1.default.team.findUnique.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/players')
            .send({ teamId: 999, firstName: 'Ghost', lastName: 'Player' });
        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toMatch(/team not found/i);
    });
});
//# sourceMappingURL=player.test.js.map