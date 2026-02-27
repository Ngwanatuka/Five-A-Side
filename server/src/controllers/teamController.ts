import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';

const createTeamSchema = z.object({
    name: z.string().min(1, 'Team name is required'),
    logoUrl: z.string().url().optional(),
    managerContact: z.string().email('Invalid email address for manager')
});

export const createTeam = async (req: Request, res: Response) => {
    try {
        const parsedData = createTeamSchema.parse(req.body);

        const newTeam = await prisma.team.create({
            data: {
                name: parsedData.name,
                managerContact: parsedData.managerContact,
                logoUrl: parsedData.logoUrl,
            }
        });

        res.status(201).json(newTeam);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.errors });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
