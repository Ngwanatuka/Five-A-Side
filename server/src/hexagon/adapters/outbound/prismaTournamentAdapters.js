"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoBroadcasterAdapter = exports.PrismaRelationalSyncAdapter = exports.PrismaTournamentRepositoryAdapter = void 0;
const prisma_1 = __importDefault(require("../../../prisma"));
const tournamentStore_1 = require("../../../services/tournamentStore");
class PrismaTournamentRepositoryAdapter {
    async read() {
        return (0, tournamentStore_1.readTournamentData)();
    }
    async write(snapshot) {
        await (0, tournamentStore_1.writeTournamentData)(snapshot);
    }
    async update(mutator) {
        return (0, tournamentStore_1.updateTournamentData)(mutator);
    }
}
exports.PrismaTournamentRepositoryAdapter = PrismaTournamentRepositoryAdapter;
class PrismaRelationalSyncAdapter {
    async syncMatchScore(params) {
        const { homeTeamKey, awayTeamKey, homeScore, awayScore, status, time, pitchNumber } = params;
        if (!homeTeamKey || !awayTeamKey)
            return;
        const [homeTeam, awayTeam] = await Promise.all([
            prisma_1.default.team.findFirst({ where: { managerContact: `${homeTeamKey}@tournament.local` } }),
            prisma_1.default.team.findFirst({ where: { managerContact: `${awayTeamKey}@tournament.local` } })
        ]);
        if (!homeTeam || !awayTeam)
            return;
        const databaseMatch = await prisma_1.default.match.findFirst({
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
            if (typeof prisma_1.default.match.create === 'function') {
                await prisma_1.default.match.create({
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
        await prisma_1.default.match.update({
            where: { id: databaseMatch.id },
            data: {
                homeScore,
                awayScore,
                ...(prismaStatus && { status: prismaStatus })
            }
        });
    }
}
exports.PrismaRelationalSyncAdapter = PrismaRelationalSyncAdapter;
class SocketIoBroadcasterAdapter {
    io;
    constructor(io) {
        this.io = io;
    }
    emitDerbyUpdate(snapshot) {
        this.io?.emit('derbyUpdate', snapshot);
    }
    emitScoreUpdate(match) {
        if (match !== undefined) {
            this.io?.emit('scoreUpdate', match);
        }
        else {
            this.io?.emit('scoreUpdate');
        }
    }
    emitTeamRegistered() {
        this.io?.emit('teamRegistered');
    }
}
exports.SocketIoBroadcasterAdapter = SocketIoBroadcasterAdapter;
//# sourceMappingURL=prismaTournamentAdapters.js.map