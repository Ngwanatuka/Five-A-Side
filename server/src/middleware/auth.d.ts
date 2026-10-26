import { Request, Response, NextFunction } from 'express';
export type AppRole = 'ADMIN' | 'REFEREE' | 'CASHIER' | 'CAPTAIN' | 'SPECTATOR';
export interface AuthUser {
    id?: number | undefined;
    email?: string | undefined;
    role: AppRole;
    teamKey?: string | undefined;
    teamName?: string | undefined;
    captainName?: string | undefined;
}
export interface AuthRequest extends Request {
    user?: AuthUser;
}
export declare const ADMIN_EMAILS: string[];
export declare const SOLE_ADMIN_EMAIL = "ngwanatuka@fivesway.xyz";
export declare const isAuthorizedAdminEmail: (email?: string) => boolean;
export declare const isAuthenticated: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const optionalAuth: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const authorizeRole: (allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const canEditSquad: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map