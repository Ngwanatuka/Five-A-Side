import prisma from '../../../prisma';
import {
    readTournamentData,
    updateTournamentData,
    writeTournamentData
} from '../../../services/tournamentStore';
import { type TournamentSnapshot } from '../../domain/tournamentDomain';
import {
    type RealtimeBroadcasterPort,
    type RelationalSyncPort,
    type TournamentRepositoryPort
} from '../../ports/outboundPorts';

export class PrismaTournamentRepositoryAdapter implements TournamentRepositoryPort {
    async read(): Promise<TournamentSnapshot | null> {
        return readTournamentData<TournamentSnapshot>();
    }

    async write(snapshot: TournamentSnapshot): Promise<void> {
        await writeTournamentData(snapshot);
    }

    async update(mutator: (snapshot: TournamentSnapshot) => void): Promise<TournamentSnapshot> {
        return updateTournamentData<TournamentSnapshot>(mutator);
    }
}

export class PrismaRelationalSyncAdapter implements RelationalSyncPort {
    async syncMatchScore(params: {
        homeTeamKey?: string | null | undefined;
        awayTeamKey?: string | null | undefined;
        homeScore: number | null;
        awayScore: number | null;
        status?: string | undefined;
        time?: string | undefined;
        pitchNumber?: number | undefined;
    }): Promise<void> {
        const { homeTeamKey, awayTeamKey, homeScore, awayScore, status, time, pitchNumber } = params;
        if (!homeTeamKey || !awayTeamKey) return;

        const [homeTeam, awayTeam] = await Promise.all([
            prisma.team.findFirst({ where: { managerContact: `${homeTeamKey}@tournament.local` } }),
            prisma.team.findFirst({ where: { managerContact: `${awayTeamKey}@tournament.local` } })
        ]);
        if (!homeTeam || !awayTeam) return;

        const databaseMatch = await prisma.match.findFirst({
            where: {
                seasonId: 1,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id
            }
        });

        const normalizedStatus = status?.toLowerCase();
        const prismaStatus = normalizedStatus === 'completed'
            ? 'COMPLETED'
            : normalizedStatus === 'live'
                ? 'LIVE'
                : normalizedStatus
                    ? 'UPCOMING'
                    : undefined;

        if (!databaseMatch) {
            if (typeof (prisma.match as any).create === 'function') {
                await prisma.match.create({
                    data: {
                        seasonId: 1,
                        divisionId: 1,
                        homeTeamId: homeTeam.id,
                        awayTeamId: awayTeam.id,
                        date: new Date('2026-10-28T18:30:00+02:00'),
                        time: time || '18:30',
                        pitchNumber: pitchNumber || 1,
                        homeScore,
                        awayScore,
                        status: prismaStatus || 'UPCOMING'
                    }
                });
            }
            return;
        }

        await prisma.match.update({
            where: { id: databaseMatch.id },
            data: {
                homeScore,
                awayScore,
                ...(prismaStatus && { status: prismaStatus })
            }
        });
    }
}

export class SocketIoBroadcasterAdapter implements RealtimeBroadcasterPort {
    constructor(private readonly io: { emit: (event: string, payload?: unknown) => void } | null | undefined) {}

    emitDerbyUpdate(snapshot: TournamentSnapshot): void {
        this.io?.emit('derbyUpdate', snapshot);
    }

    emitScoreUpdate(match?: unknown): void {
        if (match !== undefined) {
            this.io?.emit('scoreUpdate', match);
        } else {
            this.io?.emit('scoreUpdate');
        }
    }

    emitTeamRegistered(): void {
        this.io?.emit('teamRegistered');
    }
}

