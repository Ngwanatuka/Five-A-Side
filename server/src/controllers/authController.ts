import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
    verifyCaptain, 
    getPublicCaptains, 
    getAdminCaptains, 
    adminUpdateCaptain, 
    adminUpdateDeadline,
    getDeadlineStatus 
} from '../services/captainService';

import { SOLE_ADMIN_EMAIL, isAuthorizedAdminEmail } from '../middleware/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-fallback';

/**
 * Standard Email/Password login (Admin, Referee, Cashier)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
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

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Enforce that only authorized admin emails can log in as ADMIN
        if (user.role === 'ADMIN' && !isAuthorizedAdminEmail(user.email)) {
            res.status(403).json({ error: 'Forbidden: You are not authorized as administrator' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Captain PIN login
 * Captians only admin can assign PINs, and captains can log in with their Team + PIN
 */
export const captainLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { teamKey, pin } = req.body;

        if (!teamKey || !pin) {
            res.status(400).json({ error: 'Team and 4-digit PIN are required' });
            return;
        }

        const captain = verifyCaptain(teamKey, pin);

        if (!captain) {
            res.status(401).json({ error: 'Incorrect Captain PIN for this team. Please check with the League Admin.' });
            return;
        }

        // Resolve actual roster captain name dynamically
        let effectiveCaptainName = '';
        try {
            const path = require('path');
            const fs = require('fs');
            const dataFile = path.join(__dirname, '../../data/derby-tournament.json');
            if (fs.existsSync(dataFile)) {
                const derby = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
                const fileCap = (derby.players || []).find((p: any) => p.teamKey === teamKey && p.isCaptain === true);
                if (fileCap?.name) {
                    effectiveCaptainName = fileCap.name.trim();
                }
            }
        } catch (jsonErr) {
            console.warn('Notice reading derby-tournament.json during captain login:', jsonErr);
        }

        const captainDisplayName = effectiveCaptainName || captain.captainName || 'Team Captain';

        const token = jwt.sign(
            {
                role: 'CAPTAIN',
                teamKey: captain.teamKey,
                teamName: captain.teamName,
                captainName: captainDisplayName,
                email: captain.email
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

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
    } catch (error) {
        console.error('Captain login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Public listing of team captains (without PINs)
 * Sourced dynamically and generically from whoever is currently designated as Captain (isCaptain: true) in each team's squad roster.
 */
export const getCaptainsList = async (_req: Request, res: Response): Promise<void> => {
    try {
        const list = getPublicCaptains();
        const captainNamesByTeam = new Map<string, string>();

        // Read derby-tournament.json to find the isCaptain player for each team
        try {
            const path = require('path');
            const fs = require('fs');
            const dataFile = path.join(__dirname, '../../data/derby-tournament.json');
            if (fs.existsSync(dataFile)) {
                const derby = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
                const filePlayers: any[] = Array.isArray(derby.players) ? derby.players : [];

                filePlayers.forEach((p) => {
                    if (p?.teamKey && p?.name) {
                        if (p.isCaptain === true && !captainNamesByTeam.has(p.teamKey)) {
                            captainNamesByTeam.set(p.teamKey, p.name.trim());
                        }
                    }
                });
            }
        } catch (fileErr) {
            console.warn('Notice reading derby-tournament.json in getCaptainsList:', fileErr);
        }

        list.forEach((entry) => {
            entry.captainName = captainNamesByTeam.get(entry.teamKey) || '';
        });

        res.json(list);
    } catch (error) {
        console.error('Failed to retrieve captains:', error);
        res.status(500).json({ error: 'Failed to retrieve captains' });
    }
};

/**
 * Deadline status (28 Oct 18:30)
 */
export const getDeadline = async (_req: Request, res: Response): Promise<void> => {
    try {
        const status = getDeadlineStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve deadline status' });
    }
};

/**
 * Admin: Get all captains including PINs
 */
export const getAdminCaptainsList = async (_req: Request, res: Response): Promise<void> => {
    try {
        const data = getAdminCaptains();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve admin captains' });
    }
};

/**
 * Admin: Update captain name, email, or PIN for a team
 */
export const updateCaptainByAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { teamKey, captainName, email, pin, teamName, group } = req.body;

        if (!teamKey) {
            res.status(400).json({ error: 'teamKey is required' });
            return;
        }

        const updated = adminUpdateCaptain(teamKey, {
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
    } catch (error) {
        console.error('Admin update captain error:', error);
        res.status(500).json({ error: 'Failed to update captain' });
    }
};

/**
 * Admin: Update deadline if requested
 */
export const updateDeadlineByAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { deadline } = req.body;
        if (!deadline) {
            res.status(400).json({ error: 'deadline ISO date string required' });
            return;
        }
        const updated = adminUpdateDeadline(deadline);
        res.json({ message: 'Deadline updated successfully', deadline: updated });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update deadline' });
    }
};
