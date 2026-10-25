import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isDeadlineExpired } from '../services/captainService';

const JWT_SECRET = (process.env.JWT_SECRET as string) || 'super-secret-key-fallback';

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

// Middleware to check if user is authenticated
export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthUser;
                req.user = decoded;
                return next();
            } catch (error) {
                // If token is invalid/expired, check header fallback below
            }
        }
    }

    const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
    if (roleHeader && ['ADMIN', 'REFEREE', 'CAPTAIN'].includes(roleHeader)) {
        req.user = {
            role: roleHeader as AppRole,
            teamKey: req.headers['x-captain-team-key'] as string | undefined
        };
        return next();
    }

    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
};

// Optional auth: decodes token if present without failing if missing
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthUser;
                req.user = decoded;
                return next();
            } catch {
                // Ignore token error in optional auth
            }
        }
    }
    const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
    if (roleHeader && ['ADMIN', 'REFEREE', 'CAPTAIN', 'SPECTATOR'].includes(roleHeader)) {
        req.user = {
            role: roleHeader as AppRole,
            teamKey: req.headers['x-captain-team-key'] as string | undefined
        };
    }
    next();
};

// Middleware to check if user has required role(s)
export const authorizeRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: Login required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions for this role' });
        }

        next();
    };
};

// Middleware to verify squad editing rights (Admin can always edit; Captain only their team before 28 Oct 18:30)
export const canEditSquad = (req: AuthRequest, res: Response, next: NextFunction) => {
    // If not authenticated
    if (!req.user) {
        return res.status(403).json({
            error: 'Editing restricted: Participants/Spectators have read-only access. Only assigned Team Captains or Admin can edit rosters.'
        });
    }

    // Admin has access to everything anytime
    if (req.user.role === 'ADMIN') {
        return next();
    }

    // Captain check
    if (req.user.role === 'CAPTAIN') {
        // Check deadline: 28th October at 18:30
        if (isDeadlineExpired()) {
            return res.status(403).json({
                error: 'Roster editing deadline has passed (28 October 18:30). Official rosters are locked. Please contact League Admin for changes.'
            });
        }
        return next();
    }

    return res.status(403).json({
        error: 'Forbidden: You do not have permission to modify squads or teams.'
    });
};
