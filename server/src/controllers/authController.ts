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
import { readTournamentData } from '../services/tournamentStore';

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
        const derby: any = await readTournamentData();
        if (derby) {
            const fileCap = (derby.players || []).find((p: any) => p.teamKey === teamKey && p.isCaptain === true);
            if (fileCap?.name) {
                effectiveCaptainName = fileCap.name.trim();
            }
        }

        const captainDisplayName = effectiveCaptainName || 'Team Captain';

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
 * If no player is assigned as captain or the squad is empty, captainName is empty.
 */
export const getCaptainsList = async (_req: Request, res: Response): Promise<void> => {
    try {
        let tournamentTeams: Record<string, any> = {};
        let tournamentPlayers: any[] = [];

        const derby: any = await readTournamentData();
        if (derby) {
            if (derby.teams) tournamentTeams = derby.teams;
            if (Array.isArray(derby.players)) tournamentPlayers = derby.players;
        }

        const configCaptains = getPublicCaptains();
        const configMap = new Map(configCaptains.map((c: any) => [c.teamKey, c]));

        // Read squad roster to find designated captains and player counts
        const captainNamesByTeam = new Map<string, string>();
        const squadCountByTeam = new Map<string, number>();

        tournamentPlayers.forEach((p: any) => {
            if (p?.teamKey && p?.name) {
                const cleanName = p.name.trim();
                squadCountByTeam.set(p.teamKey, (squadCountByTeam.get(p.teamKey) || 0) + 1);
                if (p.isCaptain === true && !captainNamesByTeam.has(p.teamKey)) {
                    captainNamesByTeam.set(p.teamKey, cleanName);
                }
            }
        });

        // Determine team keys in tournament order
        const teamKeys = Object.keys(tournamentTeams).length > 0
            ? Object.keys(tournamentTeams)
            : ['team-dench', 'cpt-superstars', 'bras-ba-kasi', 'gauteng-warriors', 'woza-madzala', 'areyeng-fc'];

        const list = teamKeys.map(teamKey => {
            const conf = configMap.get(teamKey);
            const team = tournamentTeams[teamKey];
            const squadCount = squadCountByTeam.get(teamKey) || 0;
            const captainName = captainNamesByTeam.get(teamKey) || '';

            return {
                teamKey,
                teamName: team?.name || conf?.teamName || teamKey,
                captainName,
                hasCaptain: Boolean(captainName),
                squadCount,
                email: conf?.email || `${teamKey}@5aside.com`,
                group: team?.group || conf?.group || 'A'
            };
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
        const derby: any = await readTournamentData();
        if (derby) {
                const filePlayers: any[] = Array.isArray(derby.players) ? derby.players : [];
                const captainByTeam = new Map<string, string>();
                filePlayers.forEach((p: any) => {
                    if (p?.teamKey && p?.name && p.isCaptain === true && !captainByTeam.has(p.teamKey)) {
                        captainByTeam.set(p.teamKey, p.name.trim());
                    }
                });
                data.captains.forEach((entry: any) => {
                    entry.captainName = captainByTeam.get(entry.teamKey) || '';
                    if (derby.teams?.[entry.teamKey]?.name) {
                        entry.teamName = derby.teams[entry.teamKey].name;
                    }
                });
        }
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
