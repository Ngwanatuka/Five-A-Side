import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import prisma from '../prisma';

export const DATA_DIR = path.join(__dirname, '../../data');
export const DATA_FILE = path.resolve(
    process.env.TOURNAMENT_DATA_FILE || path.join(DATA_DIR, 'derby-tournament.json')
);

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

const STATE_ID = 'dench-derby';

export const readTournamentData = async <T = Record<string, unknown>>(): Promise<T | null> => {
    const stored = await prisma.tournamentState.findUnique({ where: { id: STATE_ID } });
    if (stored) {
        return stored.payload as T;
    }

    if (!fs.existsSync(DATA_FILE)) {
        return null;
    }

    const fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as T;
    try {
        await prisma.tournamentState.create({
            data: {
                id: STATE_ID,
                payload: JSON.parse(JSON.stringify(fileData)) as Prisma.InputJsonValue
            }
        });
        return fileData;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const concurrentState = await prisma.tournamentState.findUnique({ where: { id: STATE_ID } });
            if (concurrentState) {
                return concurrentState.payload as T;
            }
        }
        throw error;
    }
};

export const writeTournamentData = async (data: unknown): Promise<void> => {
    const payload = JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
    await prisma.tournamentState.upsert({
        where: { id: STATE_ID },
        create: { id: STATE_ID, payload },
        update: { payload }
    });

    const temporaryFile = `${DATA_FILE}.${process.pid}.${randomUUID()}.tmp`;
    try {
        fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), {
            encoding: 'utf-8',
            mode: 0o600
        });
        fs.renameSync(temporaryFile, DATA_FILE);
    } catch (error) {
        if (fs.existsSync(temporaryFile)) {
            fs.unlinkSync(temporaryFile);
        }
        console.warn('Tournament state is saved in MySQL, but the local JSON mirror could not be updated:', error);
    }
};

export const updateTournamentData = async <T>(
    update: (data: T) => void
): Promise<T> => {
    if (!(await readTournamentData())) {
        throw new Error('Tournament state is not initialized.');
    }

    const updatedState = await prisma.$transaction(async transaction => {
        const rows = await transaction.$queryRaw<Array<{ payload: Prisma.JsonValue }>>`
            SELECT payload FROM \`TournamentState\` WHERE id = ${STATE_ID} FOR UPDATE
        `;
        const row = rows[0];
        if (!row) {
            throw new Error('Tournament state disappeared while acquiring its database lock.');
        }

        const data = row.payload as T;
        update(data);
        await transaction.tournamentState.update({
            where: { id: STATE_ID },
            data: { payload: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue }
        });
        return data;
    });

    const temporaryFile = `${DATA_FILE}.${process.pid}.${randomUUID()}.tmp`;
    try {
        fs.writeFileSync(temporaryFile, JSON.stringify(updatedState, null, 2), {
            encoding: 'utf-8',
            mode: 0o600
        });
        fs.renameSync(temporaryFile, DATA_FILE);
    } catch (error) {
        if (fs.existsSync(temporaryFile)) {
            fs.unlinkSync(temporaryFile);
        }
        console.warn('Tournament state is saved in MySQL, but the local JSON mirror could not be updated:', error);
    }

    return updatedState;
};
