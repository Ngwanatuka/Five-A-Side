import { type TournamentSnapshot } from '../domain/tournamentDomain';

export interface TournamentRepositoryPort {
    read(): Promise<TournamentSnapshot | null>;
    write(snapshot: TournamentSnapshot): Promise<void>;
    update(mutator: (snapshot: TournamentSnapshot) => void): Promise<TournamentSnapshot>;
}

export interface RelationalSyncPort {
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

export interface RealtimeBroadcasterPort {
    emitDerbyUpdate(snapshot: TournamentSnapshot): void;
    emitScoreUpdate(match?: unknown): void;
    emitTeamRegistered(): void;
}

