export interface CaptainEntry {
    teamKey: string;
    teamName: string;
    captainName: string;
    email: string;
    pin: string;
    group?: string;
}
export interface CaptainConfig {
    deadline: string;
    captains: Record<string, CaptainEntry>;
}
export declare const getCaptainConfig: () => CaptainConfig;
export declare const saveCaptainConfig: (config: CaptainConfig) => void;
/**
 * Public listing of captains (never includes PINs)
 */
export declare const getPublicCaptains: () => {
    teamKey: string;
    teamName: string;
    captainName: string;
    email: string;
    group?: string;
}[];
/**
 * Full listing with PINs for Admin only
 */
export declare const getAdminCaptains: () => {
    deadline: string;
    captains: CaptainEntry[];
};
/**
 * Verify a Captain's PIN
 */
export declare const verifyCaptain: (teamKey: string, pin: string) => CaptainEntry | null;
/**
 * Admin updates a team captain and/or PIN
 */
export declare const adminUpdateCaptain: (teamKey: string, updates: Partial<CaptainEntry>) => CaptainEntry;
/**
 * Admin updates the deadline (if ever needed)
 */
export declare const adminUpdateDeadline: (newDeadline: string) => string;
/**
 * Check if the deadline (28 Oct 18:30) has passed
 */
export declare const isDeadlineExpired: () => boolean;
/**
 * Deadline status info
 */
export declare const getDeadlineStatus: () => {
    deadline: string;
    now: string;
    isExpired: boolean;
    remainingMs: number;
};
//# sourceMappingURL=captainService.d.ts.map