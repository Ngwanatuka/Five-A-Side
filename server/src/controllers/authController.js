"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeadlineByAdmin = exports.updateCaptainByAdmin = exports.getAdminCaptainsList = exports.getDeadline = exports.getCaptainsList = exports.captainLogin = exports.login = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const captainService_1 = require("../services/captainService");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-fallback';
/**
 * Standard Email/Password login (Admin, Referee, Cashier)
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        // Enforce that only authorized admin emails can log in as ADMIN
        if (user.role === 'ADMIN' && !(0, auth_1.isAuthorizedAdminEmail)(user.email)) {
            res.status(403).json({ error: 'Forbidden: You are not authorized as administrator' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
/**
 * Captain PIN login
 * Captians only admin can assign PINs, and captains can log in with their Team + PIN
 */
const captainLogin = async (req, res) => {
    try {
        const { teamKey, pin } = req.body;
        if (!teamKey || !pin) {
            res.status(400).json({ error: 'Team and 4-digit PIN are required' });
            return;
        }
        const captain = (0, captainService_1.verifyCaptain)(teamKey, pin);
        if (!captain) {
            res.status(401).json({ error: 'Incorrect Captain PIN for this team. Please check with the League Admin.' });
            return;
        }
        // Resolve actual roster captain name if present
        let effectiveCaptainName = '';
        try {
            const rosterCap = await prisma.player.findFirst({
                where: {
                    isCaptain: true,
                    team: { managerContact: `${teamKey}@tournament.local` }
                }
            });
            if (rosterCap) {
                effectiveCaptainName = `${rosterCap.firstName} ${rosterCap.lastName === '-' ? '' : rosterCap.lastName}`.trim();
            }
            else {
                const firstPlayer = await prisma.player.findFirst({
                    where: {
                        team: { managerContact: `${teamKey}@tournament.local` }
                    },
                    orderBy: { id: 'asc' }
                });
                if (firstPlayer) {
                    effectiveCaptainName = `${firstPlayer.firstName} ${firstPlayer.lastName === '-' ? '' : firstPlayer.lastName}`.trim();
                }
            }
        }
        catch { }
        const captainDisplayName = effectiveCaptainName || captain.captainName || 'Team Captain';
        const token = jsonwebtoken_1.default.sign({
            role: 'CAPTAIN',
            teamKey: captain.teamKey,
            teamName: captain.teamName,
            captainName: captainDisplayName,
            email: captain.email
        }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: `Welcome Captain ${captainDisplayName}!`,
            token,
            user: {
                role: 'CAPTAIN',
                teamKey: captain.teamKey,
                teamName: captain.teamName,
                captainName: captainDisplayName,
                email: captain.email,
                group: captain.group
            }
        });
    }
    catch (error) {
        console.error('Captain login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.captainLogin = captainLogin;
/**
 * Public listing of team captains (without PINs)
 * Captain name is sourced from the designated captain (or first player) in each team's squad roster.
 */
const getCaptainsList = async (_req, res) => {
    try {
        const list = (0, captainService_1.getPublicCaptains)();
        list.forEach((entry) => {
            entry.captainName = '';
        });
        const captainNamesByTeam = new Map();
        // 1. Query database players for all tournament teams
        try {
            const dbPlayers = await prisma.player.findMany({
                where: {
                    team: { managerContact: { endsWith: '@tournament.local' } }
                },
                include: { team: true },
                orderBy: [{ isCaptain: 'desc' }, { id: 'asc' }]
            });
            dbPlayers.forEach((player) => {
                const teamKey = player.team.managerContact.replace(/@tournament\.local$/, '');
                const captainName = `${player.firstName} ${player.lastName === '-' ? '' : player.lastName}`.trim();
                if (captainName) {
                    if (player.isCaptain) {
                        captainNamesByTeam.set(teamKey, captainName);
                    }
                    else if (!captainNamesByTeam.has(teamKey)) {
                        captainNamesByTeam.set(teamKey, captainName);
                    }
                }
            });
        }
        catch (dbErr) {
            console.warn('Notice querying DB players for captains list:', dbErr);
        }
        // 2. Fallback to derby-tournament.json if any team is missing
        try {
            const path = require('path');
            const fs = require('fs');
            const dataFile = path.join(__dirname, '../../data/derby-tournament.json');
            if (fs.existsSync(dataFile)) {
                const derby = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
                const filePlayers = Array.isArray(derby.players) ? derby.players : [];
                // Priority: explicit isCaptain
                filePlayers.forEach((p) => {
                    if (p?.teamKey && p?.name && p?.isCaptain === true) {
                        captainNamesByTeam.set(p.teamKey, p.name.trim());
                    }
                });
                // Fallback: first roster player if team still has no captain
                filePlayers.forEach((p) => {
                    if (p?.teamKey && p?.name && !captainNamesByTeam.has(p.teamKey)) {
                        captainNamesByTeam.set(p.teamKey, p.name.trim());
                    }
                });
            }
        }
        catch (fileErr) {
            console.warn('Notice reading derby-tournament.json in getCaptainsList:', fileErr);
        }
        // Filter out legacy dummy captain names
        const MOCK_CAPTAINS = new Set([
            'bafana sithole',
            'mo hendricks',
            'thabo dlamini',
            'sipho zulu',
            'mandla nkosi',
            'kagiso molefe'
        ]);
        list.forEach((entry) => {
            let name = captainNamesByTeam.get(entry.teamKey) || '';
            if (MOCK_CAPTAINS.has(name.toLowerCase().trim())) {
                name = '';
            }
            entry.captainName = name;
        });
        res.json(list);
    }
    catch (error) {
        console.error('Failed to retrieve captains:', error);
        res.status(500).json({ error: 'Failed to retrieve captains' });
    }
};
exports.getCaptainsList = getCaptainsList;
/**
 * Deadline status (28 Oct 18:30)
 */
const getDeadline = async (_req, res) => {
    try {
        const status = (0, captainService_1.getDeadlineStatus)();
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve deadline status' });
    }
};
exports.getDeadline = getDeadline;
/**
 * Admin: Get all captains including PINs
 */
const getAdminCaptainsList = async (_req, res) => {
    try {
        const data = (0, captainService_1.getAdminCaptains)();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve admin captains' });
    }
};
exports.getAdminCaptainsList = getAdminCaptainsList;
/**
 * Admin: Update captain name, email, or PIN for a team
 */
const updateCaptainByAdmin = async (req, res) => {
    try {
        const { teamKey, captainName, email, pin, teamName, group } = req.body;
        if (!teamKey) {
            res.status(400).json({ error: 'teamKey is required' });
            return;
        }
        const updated = (0, captainService_1.adminUpdateCaptain)(teamKey, {
            captainName,
            email,
            pin,
            teamName,
            group
        });
        res.json({
            message: `Captain updated for ${updated.teamName}`,
            captain: updated
        });
    }
    catch (error) {
        console.error('Admin update captain error:', error);
        res.status(500).json({ error: 'Failed to update captain' });
    }
};
exports.updateCaptainByAdmin = updateCaptainByAdmin;
/**
 * Admin: Update deadline if requested
 */
const updateDeadlineByAdmin = async (req, res) => {
    try {
        const { deadline } = req.body;
        if (!deadline) {
            res.status(400).json({ error: 'deadline ISO date string required' });
            return;
        }
        const updated = (0, captainService_1.adminUpdateDeadline)(deadline);
        res.json({ message: 'Deadline updated successfully', deadline: updated });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update deadline' });
    }
};
exports.updateDeadlineByAdmin = updateDeadlineByAdmin;
//# sourceMappingURL=authController.js.map