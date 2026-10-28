import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import prisma from '../src/prisma';

const STATE_ID = 'dench-derby';

const importTournamentState = async (): Promise<void> => {
    const snapshotPath = process.argv[2];
    if (!snapshotPath) {
        throw new Error('Provide the path to a verified /api/derby JSON snapshot.');
    }

    const resolvedPath = path.resolve(snapshotPath);
    const snapshot = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    if (!snapshot?.teams || !Array.isArray(snapshot.matches)) {
        throw new Error('Snapshot must contain a teams object and matches array.');
    }

    const existing = await prisma.tournamentState.findUnique({ where: { id: STATE_ID } });
    if (existing) {
        console.log('Tournament state already exists in MySQL; import skipped without overwriting it.');
        return;
    }

    await prisma.tournamentState.create({
        data: {
            id: STATE_ID,
            payload: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue
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
        await prisma.$disconnect();
    });
