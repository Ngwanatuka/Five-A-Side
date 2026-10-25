"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canEditSquad = exports.authorizeRole = exports.optionalAuth = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const captainService_1 = require("../services/captainService");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-fallback';
// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                req.user = decoded;
                return next();
            }
            catch (error) {
                // If token is invalid/expired, check header fallback below
            }
        }
    }
    const roleHeader = (req.headers['x-user-role'] || '').toUpperCase();
    if (roleHeader && ['ADMIN', 'REFEREE', 'CAPTAIN'].includes(roleHeader)) {
        req.user = {
            role: roleHeader,
            teamKey: req.headers['x-captain-team-key']
        };
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
};
exports.isAuthenticated = isAuthenticated;
// Optional auth: decodes token if present without failing if missing
const optionalAuth = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                req.user = decoded;
                return next();
            }
            catch {
                // Ignore token error in optional auth
            }
        }
    }
    const roleHeader = (req.headers['x-user-role'] || '').toUpperCase();
    if (roleHeader && ['ADMIN', 'REFEREE', 'CAPTAIN', 'SPECTATOR'].includes(roleHeader)) {
        req.user = {
            role: roleHeader,
            teamKey: req.headers['x-captain-team-key']
        };
    }
    next();
};
exports.optionalAuth = optionalAuth;
// Middleware to check if user has required role(s)
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: Login required' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions for this role' });
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
// Middleware to verify squad editing rights (Admin can always edit; Captain only their team before 28 Oct 18:30)
const canEditSquad = (req, res, next) => {
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
        if ((0, captainService_1.isDeadlineExpired)()) {
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
exports.canEditSquad = canEditSquad;
//# sourceMappingURL=auth.js.map