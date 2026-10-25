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
        // Enforce that only ngwanatuka@fivesway.xyz can log in as ADMIN
        if (user.role === 'ADMIN' && user.email.toLowerCase() !== auth_1.SOLE_ADMIN_EMAIL) {
            res.status(403).json({ error: 'Forbidden: Only ngwanatuka@fivesway.xyz is authorized as administrator' });
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
        const token = jsonwebtoken_1.default.sign({
            role: 'CAPTAIN',
            teamKey: captain.teamKey,
            teamName: captain.teamName,
            captainName: captain.captainName,
            email: captain.email
        }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: `Welcome Captain ${captain.captainName}!`,
            token,
            user: {
                role: 'CAPTAIN',
                teamKey: captain.teamKey,
                teamName: captain.teamName,
                captainName: captain.captainName,
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
 */
const getCaptainsList = async (_req, res) => {
    try {
        const list = (0, captainService_1.getPublicCaptains)();
        res.json(list);
    }
    catch (error) {
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