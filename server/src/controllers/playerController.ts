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
        });

        res.status(201).json(newPlayer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.errors });
            return; // Added return to prevent further execution (though express types might complain without it)
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
