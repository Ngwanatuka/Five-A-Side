import { Request, Response, NextFunction } from 'express';
export type AppRole = 'ADMIN' | 'REFEREE' | 'CASHIER' | 'CAPTAIN' | 'SPECTATOR';
export interface AuthUser {
    id?: number;
    email?: string;
    role: AppRole;
    teamKey?: string;
    teamName?: string;
    captainName?: string;
}
export interface AuthRequest extends Request {
    user?: AuthUser;
}
export declare const isAuthenticated: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const optionalAuth: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const authorizeRole: (allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const canEditSquad: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map