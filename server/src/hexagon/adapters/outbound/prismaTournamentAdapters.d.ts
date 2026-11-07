import { type TournamentSnapshot } from '../../domain/tournamentDomain';
import { type RealtimeBroadcasterPort, type RelationalSyncPort, type TournamentRepositoryPort } from '../../ports/outboundPorts';
export declare class PrismaTournamentRepositoryAdapter implements TournamentRepositoryPort {
    read(): Promise<TournamentSnapshot | null>;
    write(snapshot: TournamentSnapshot): Promise<void>;
    update(mutator: (snapshot: TournamentSnapshot) => void): Promise<TournamentSnapshot>;
}
export declare class PrismaRelationalSyncAdapter implements RelationalSyncPort {
    syncMatchScore(params: {
        homeTeamKey?: string | null | undefined;
        awayTeamKey?: string | null | undefined;
        homeScore: number | null;
        awayScore: number | null;
        status?: string | undefined;
        time?: string | undefined;
        pitchNumber?: number | undefined;
    }): Promise<void>;
}
export declare class SocketIoBroadcasterAdapter implements RealtimeBroadcasterPort {
    private readonly io;
    constructor(io: {
        emit: (event: string, payload?: unknown) => void;
    } | null | undefined);
    emitDerbyUpdate(snapshot: TournamentSnapshot): void;
    emitScoreUpdate(match?: unknown): void;
    emitTeamRegistered(): void;
}
//# sourceMappingURL=prismaTournamentAdapters.d.ts.map