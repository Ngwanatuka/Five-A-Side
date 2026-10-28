"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTournamentData = exports.writeTournamentData = exports.readTournamentData = exports.DATA_FILE = exports.DATA_DIR = void 0;
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../prisma"));
exports.DATA_DIR = path_1.default.join(__dirname, '../../data');
exports.DATA_FILE = path_1.default.resolve(process.env.TOURNAMENT_DATA_FILE || path_1.default.join(exports.DATA_DIR, 'derby-tournament.json'));
fs_1.default.mkdirSync(path_1.default.dirname(exports.DATA_FILE), { recursive: true });
const STATE_ID = 'dench-derby';
const readTournamentData = async () => {
    const stored = await prisma_1.default.tournamentState.findUnique({ where: { id: STATE_ID } });
    if (stored) {
        return stored.payload;
    }
    if (!fs_1.default.existsSync(exports.DATA_FILE)) {
        return null;
    }
    const fileData = JSON.parse(fs_1.default.readFileSync(exports.DATA_FILE, 'utf-8'));
    try {
        await prisma_1.default.tournamentState.create({
            data: {
                id: STATE_ID,
                payload: JSON.parse(JSON.stringify(fileData))
            }
        });
        return fileData;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const concurrentState = await prisma_1.default.tournamentState.findUnique({ where: { id: STATE_ID } });
            if (concurrentState) {
                return concurrentState.payload;
            }
        }
        throw error;
    }
};
exports.readTournamentData = readTournamentData;
const writeTournamentData = async (data) => {
    const payload = JSON.parse(JSON.stringify(data));
    await prisma_1.default.tournamentState.upsert({
        where: { id: STATE_ID },
        create: { id: STATE_ID, payload },
        update: { payload }
    });
    const temporaryFile = `${exports.DATA_FILE}.${process.pid}.${(0, crypto_1.randomUUID)()}.tmp`;
    try {
        fs_1.default.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), {
            encoding: 'utf-8',
            mode: 0o600
        });
        fs_1.default.renameSync(temporaryFile, exports.DATA_FILE);
    }
    catch (error) {
        if (fs_1.default.existsSync(temporaryFile)) {
            fs_1.default.unlinkSync(temporaryFile);
        }
        console.warn('Tournament state is saved in MySQL, but the local JSON mirror could not be updated:', error);
    }
};
exports.writeTournamentData = writeTournamentData;
const updateTournamentData = async (update) => {
    if (!(await (0, exports.readTournamentData)())) {
        throw new Error('Tournament state is not initialized.');
    }
    const updatedState = await prisma_1.default.$transaction(async (transaction) => {
        const rows = await transaction.$queryRaw `
            SELECT payload FROM \`TournamentState\` WHERE id = ${STATE_ID} FOR UPDATE
        `;
        const row = rows[0];
        if (!row) {
            throw new Error('Tournament state disappeared while acquiring its database lock.');
        }
        const data = row.payload;
        update(data);
        await transaction.tournamentState.update({
            where: { id: STATE_ID },
            data: { payload: JSON.parse(JSON.stringify(data)) }
        });
        return data;
    });
    const temporaryFile = `${exports.DATA_FILE}.${process.pid}.${(0, crypto_1.randomUUID)()}.tmp`;
    try {
        fs_1.default.writeFileSync(temporaryFile, JSON.stringify(updatedState, null, 2), {
            encoding: 'utf-8',
            mode: 0o600
        });
        fs_1.default.renameSync(temporaryFile, exports.DATA_FILE);
    }
    catch (error) {
        if (fs_1.default.existsSync(temporaryFile)) {
            fs_1.default.unlinkSync(temporaryFile);
        }
        console.warn('Tournament state is saved in MySQL, but the local JSON mirror could not be updated:', error);
    }
    return updatedState;
};
exports.updateTournamentData = updateTournamentData;
//# sourceMappingURL=tournamentStore.js.map