import { Request, Response } from 'express';
import fs from 'fs';
import { z } from 'zod';
import prisma from '../prisma';
import { DATA_FILE } from './derbyController';

const addPlayerSchema = z.object({
    teamId: z.number().int().positive(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
});

export const addPlayerToTeam = async (req: any, res: Response): Promise<void> => {
    try {
        // Enforce role authorization
        if (req.user) {
            if (req.user.role === 'REFEREE' || req.user.role === 'SPECTATOR') {
                res.status(403).json({ 
                    error: 'Editing restricted: Participants and Referees have read-only access. Only Team Captains and Admins can add players.' 
                });
                return;
            }

            if (req.user.role === 'CAPTAIN') {
                const { isDeadlineExpired } = await import('../services/captainService');
                if (isDeadlineExpired()) {
                    res.status(403).json({ 
                        error: 'Roster editing deadline has passed (28 October 18:30). Official rosters are locked. Please contact League Admin.' 
                    });
                    return;
                }
            }
        }

        const parsedData = addPlayerSchema.parse(req.body);

        const team = await prisma.team.findUnique({
            where: { id: parsedData.teamId },
        });

        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }

        // Captain team ownership check
        if (req.user && req.user.role === 'CAPTAIN') {
            const captainTeamKey = req.user.teamKey;
            const matchesManager = team.managerContact && team.managerContact.startsWith(captainTeamKey);
            const matchesName = req.user.teamName && team.name.toLowerCase().trim() === req.user.teamName.toLowerCase().trim();
            if (!matchesManager && !matchesName) {
                res.status(403).json({
                    error: `Forbidden: As Captain of "${req.user.teamName || captainTeamKey}", you can only add players to your own squad.`
                });
                return;
            }
        }

        const playerCount = await prisma.player.count({
            where: { teamId: parsedData.teamId },
        });

        if (playerCount >= 9) {
            res.status(400).json({ error: 'Maximum of 9 players allowed per team roster.' });
            return;
        }

        const newPlayer = await prisma.player.create({
            data: {
                teamId: parsedData.teamId,
                firstName: parsedData.firstName,
                lastName: parsedData.lastName,
            },
            include: { team: true }
        });

        // Also sync into derby-tournament.json if this team belongs to the tournament
        const io = req.app.get('io');
        try {
            if (team.managerContact && team.managerContact.endsWith('@tournament.local')) {
                const teamKey = team.managerContact.replace('@tournament.local', '');
                if (fs.existsSync(DATA_FILE)) {
                    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
                    const derbyData = JSON.parse(raw);
                    if (!derbyData.players) derbyData.players = [];

                    const fullName = `${newPlayer.firstName} ${newPlayer.lastName}`.trim();
                    const nextJersey = derbyData.players.filter((p: any) => p.teamKey === teamKey).length + 1;

                    derbyData.players.push({
                        id: `p-${newPlayer.id}`,
                        teamKey,
                        name: fullName,
                        jerseyNumber: nextJersey,
                        position: 'MID',
                        isCaptain: false
                    });

                    derbyData.updatedAt = new Date().toISOString();
                    fs.writeFileSync(DATA_FILE, JSON.stringify(derbyData, null, 2), 'utf-8');

                    if (io) {
                        io.emit('derbyUpdate', derbyData);
                    }
                }
            }
        } catch (derbyPlayerSyncErr) {
            console.error('Notice syncing player to derby file:', derbyPlayerSyncErr);
        }

        if (io) {
            io.emit('playerAdded', newPlayer);
            io.emit('teamRegistered');
        }

        res.status(201).json(newPlayer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPlayers = async (req: Request, res: Response): Promise<void> => {
    try {
        const teamId = req.query.teamId ? parseInt(req.query.teamId as string, 10) : undefined;
        const whereClause = teamId && !isNaN(teamId) ? { teamId } : {};
        const players = await prisma.player.findMany({
            where: whereClause,
            include: { team: true },
            orderBy: { id: 'asc' }
        });
        res.status(200).json(players);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
