import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';

const updateScoreSchema = z.object({
    homeScore: z.number().int().nonnegative(),
    awayScore: z.number().int().nonnegative(),
});

export const updateMatchScore = async (req: Request, res: Response): Promise<void> => {
    try {
        const matchId = parseInt(req.params.id, 10);
        if (isNaN(matchId)) {
            res.status(400).json({ error: 'Invalid match ID' });
            return;
        }

        const { homeScore, awayScore } = updateScoreSchema.parse(req.body);

        const updatedMatch = await prisma.match.update({
            where: { id: matchId },
            data: {
                homeScore,
                awayScore,
                status: 'COMPLETED',
            },
        });

        // Broadcast the update to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('scoreUpdate', updatedMatch);
        }

        res.status(200).json(updatedMatch);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.errors });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
