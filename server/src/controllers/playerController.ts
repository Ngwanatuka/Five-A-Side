import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';

const addPlayerSchema = z.object({
    teamId: z.number().int().positive(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
});

export const addPlayerToTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedData = addPlayerSchema.parse(req.body);

        const team = await prisma.team.findUnique({
            where: { id: parsedData.teamId },
        });

        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
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

        const io = req.app.get('io');
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
