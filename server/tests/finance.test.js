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
        prisma_1.default.playerSeasonFinance.create.mockResolvedValue({
            id: 1, playerId: 1, seasonId: 1, paymentTier: 'FULL', amountPaid: 622, gamesCredited: 14
        });
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/finances/register')
            .send({ playerId: 1, seasonId: 1, paymentTier: 'FULL', amountPaid: 622 });
        expect(res.statusCode).toEqual(201);
        expect(prisma_1.default.playerSeasonFinance.create).toHaveBeenCalledWith({
            data: { playerId: 1, seasonId: 1, paymentTier: 'FULL', amountPaid: 622, gamesCredited: 14 }
        });
    });
    it('should register player finance for a half season', async () => {
        prisma_1.default.playerSeasonFinance.create.mockResolvedValue({
            id: 2, playerId: 2, seasonId: 1, paymentTier: 'HALF', amountPaid: 311, gamesCredited: 7
        });
        const res = await (0, supertest_1.default)(app_1.app)
            .post('/api/finances/register')
            .send({ playerId: 2, seasonId: 1, paymentTier: 'HALF', amountPaid: 311 });
        expect(res.statusCode).toEqual(201);
        expect(prisma_1.default.playerSeasonFinance.create).toHaveBeenCalledWith({
            data: { playerId: 2, seasonId: 1, paymentTier: 'HALF', amountPaid: 311, gamesCredited: 7 }
        });
    });
});
//# sourceMappingURL=finance.test.js.map