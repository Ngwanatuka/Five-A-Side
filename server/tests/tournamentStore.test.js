"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const previousDataFile = process.env.TOURNAMENT_DATA_FILE;
const testDirectory = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'dench-tournament-store-'));
process.env.TOURNAMENT_DATA_FILE = path_1.default.join(testDirectory, 'tournament.json');
jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        tournamentState: {
            findUnique: jest.fn(),
            create: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn()
        },
        $transaction: jest.fn()
    }
}));
const prisma = require('../src/prisma').default;
const tournamentStore = require('../src/services/tournamentStore');
const { DATA_FILE, readTournamentData, writeTournamentData } = tournamentStore;
const updateTournamentData = tournamentStore.updateTournamentData;
describe('persistent tournament state', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (fs_1.default.existsSync(DATA_FILE))
            fs_1.default.unlinkSync(DATA_FILE);
    });
    afterAll(() => {
        if (fs_1.default.existsSync(DATA_FILE))
            fs_1.default.unlinkSync(DATA_FILE);
        fs_1.default.rmdirSync(testDirectory);
        if (previousDataFile === undefined) {
            delete process.env.TOURNAMENT_DATA_FILE;
        }
        else {
            process.env.TOURNAMENT_DATA_FILE = previousDataFile;
        }
    });
    it('imports the existing JSON snapshot only when MySQL has no tournament row', async () => {
        const snapshot = { teams: { alpha: { name: 'Alpha' } }, matches: [], goalEvents: [] };
        fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(snapshot));
        prisma.tournamentState.findUnique.mockResolvedValue(null);
        prisma.tournamentState.create.mockResolvedValue({ id: 'dench-derby', payload: snapshot });
        await expect(readTournamentData()).resolves.toEqual(snapshot);
        expect(prisma.tournamentState.create).toHaveBeenCalledWith({
            data: { id: 'dench-derby', payload: snapshot }
        });
    });
    it('treats the MySQL row as authoritative when a local mirror exists', async () => {
        const databaseState = { teams: { beta: { name: 'Beta' } }, matches: [] };
        fs_1.default.writeFileSync(DATA_FILE, JSON.stringify({ teams: {}, matches: [] }));
        prisma.tournamentState.findUnique.mockResolvedValue({
            id: 'dench-derby',
            payload: databaseState
        });
        await expect(readTournamentData()).resolves.toEqual(databaseState);
        expect(prisma.tournamentState.create).not.toHaveBeenCalled();
    });
    it('writes state to MySQL before updating the best-effort local mirror', async () => {
        const nextState = { teams: {}, matches: [{ id: 'final', homeScore: 2, awayScore: 1 }] };
        prisma.tournamentState.upsert.mockResolvedValue({});
        await writeTournamentData(nextState);
        expect(prisma.tournamentState.upsert).toHaveBeenCalledWith({
            where: { id: 'dench-derby' },
            create: { id: 'dench-derby', payload: nextState },
            update: { payload: nextState }
        });
        expect(JSON.parse(fs_1.default.readFileSync(DATA_FILE, 'utf-8'))).toEqual(nextState);
    });
    it('updates the locked MySQL state and returns the committed snapshot', async () => {
        let databaseState = {
            teams: {},
            matches: [{ id: 'group-1', homeScore: null, awayScore: null }],
            goalEvents: []
        };
        prisma.tournamentState.findUnique.mockResolvedValue({
            id: 'dench-derby',
            payload: databaseState
        });
        prisma.$transaction.mockImplementation(async (operation) => operation({
            $queryRaw: jest.fn().mockImplementation(async () => [{ payload: databaseState }]),
            tournamentState: {
                update: jest.fn().mockImplementation(async ({ data }) => {
                    databaseState = data.payload;
                })
            }
        }));
        const updatedState = await updateTournamentData(state => {
            state.matches[0].homeScore = 2;
            state.matches[0].awayScore = 1;
        });
        expect(updatedState.matches[0]).toMatchObject({ homeScore: 2, awayScore: 1 });
        expect(databaseState.matches[0]).toMatchObject({ homeScore: 2, awayScore: 1 });
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=tournamentStore.test.js.map