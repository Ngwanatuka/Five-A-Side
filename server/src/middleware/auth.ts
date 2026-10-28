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

export const ADMIN_EMAILS = ['ngwanatuka@fivesway.xyz', 'dench@fivesway.xyz', 'vuyo@fivesway.xyz'];
export const SOLE_ADMIN_EMAIL = 'ngwanatuka@fivesway.xyz';

export const isAuthorizedAdminEmail = (email?: string): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthUser;
                // Enforce that only authorized admin emails can hold the ADMIN role
                if (decoded.role === 'ADMIN' && !isAuthorizedAdminEmail(decoded.email)) {
                    return res.status(403).json({ error: 'Forbidden: You are not authorized as administrator' });
                }
                req.user = decoded;
                return next();
            } catch (error) {
                // If token is invalid/expired, check header fallback below
            }
        }
    }

    const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
    const emailHeader = (req.headers['x-user-email'] as string || '').toLowerCase();
    if (roleHeader && ['ADMIN', 'REFEREE', 'CAPTAIN'].includes(roleHeader)) {
        if (roleHeader === 'ADMIN' && !isAuthorizedAdminEmail(emailHeader)) {
            return res.status(403).json({ error: 'Forbidden: You are not authorized as administrator' });
        }
        req.user = {
            role: roleHeader as AppRole,
            email: emailHeader || undefined,
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
                if (decoded.role === 'ADMIN' && !isAuthorizedAdminEmail(decoded.email)) {
                    decoded.role = 'SPECTATOR';
                }
                req.user = decoded;
                return next();
            } catch {
                // Ignore token error in optional auth
            }
        }
    }
    const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
    const emailHeader = (req.headers['x-user-email'] as string || '').toLowerCase();
    if (roleHeader && ['ADMIN', 'REFEREE', 'CAPTAIN', 'SPECTATOR'].includes(roleHeader)) {
        const finalRole = (roleHeader === 'ADMIN' && !isAuthorizedAdminEmail(emailHeader)) ? 'SPECTATOR' : roleHeader;
        req.user = {
            role: finalRole as AppRole,
            email: emailHeader || undefined,
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

        if (req.user.role === 'ADMIN' && !isAuthorizedAdminEmail(req.user.email)) {
            return res.status(403).json({ error: 'Forbidden: You are not authorized as administrator' });
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
        if (isAuthorizedAdminEmail(req.user.email)) {
            return next();
        }
        return res.status(403).json({ error: 'Forbidden: You are not authorized as administrator' });
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
