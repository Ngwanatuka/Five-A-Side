"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../src/prisma"));
const STATE_ID = 'dench-derby';
const importTournamentState = async () => {
    const snapshotPath = process.argv[2];
    if (!snapshotPath) {
        throw new Error('Provide the path to a verified /api/derby JSON snapshot.');
    }
    const resolvedPath = path_1.default.resolve(snapshotPath);
    const snapshot = JSON.parse(fs_1.default.readFileSync(resolvedPath, 'utf-8'));
    if (!snapshot?.teams || !Array.isArray(snapshot.matches)) {
        throw new Error('Snapshot must contain a teams object and matches array.');
    }
    const existing = await prisma_1.default.tournamentState.findUnique({ where: { id: STATE_ID } });
    if (existing) {
        console.log('Tournament state already exists in MySQL; import skipped without overwriting it.');
        return;
    }
    await prisma_1.default.tournamentState.create({
        data: {
            id: STATE_ID,
            payload: JSON.parse(JSON.stringify(snapshot))
        }
    });
    console.log(`Imported tournament snapshot from ${resolvedPath}.`);
};
importTournamentState()
    .catch(error => {
    console.error('Tournament snapshot import failed:', error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
//# sourceMappingURL=importTournamentState.js.map