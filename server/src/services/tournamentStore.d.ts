export declare const DATA_DIR: string;
export declare const DATA_FILE: string;
export declare const readTournamentData: <T = Record<string, unknown>>() => Promise<T | null>;
export declare const writeTournamentData: (data: unknown) => Promise<void>;
export declare const updateTournamentData: <T>(update: (data: T) => void) => Promise<T>;
//# sourceMappingURL=tournamentStore.d.ts.map