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
                logoUrl: parsedData.logoUrl || null,
            }
        });

        res.status(201).json(newTeam);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

const registerTeamSchema = z.object({
    teamId: z.number(),
    seasonId: z.number(),
});

export const registerTeam = async (req: Request, res: Response) => {
    try {
        const parsedData = registerTeamSchema.parse(req.body);

        const newRegistration = await prisma.teamSeasonRegistration.create({
            data: {
                teamId: parsedData.teamId,
                seasonId: parsedData.seasonId,
                divisionId: 1, // Auto-assign division 1
                status: 'APPROVED' // Auto-approve to show in UI
            }
        });

        res.status(201).json(newRegistration);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

const approveRegistrationSchema = z.object({
    divisionId: z.number(),
});

export const approveRegistration = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid registration ID' });
            return;
        }

        const parsedData = approveRegistrationSchema.parse(req.body);

        // Enforce 8-Team Division Cap
        const divisionCount = await prisma.teamSeasonRegistration.count({
            where: {
                divisionId: parsedData.divisionId,
                status: 'APPROVED'
            }
        });

        if (divisionCount >= 8) {
            res.status(400).json({ error: `Division ${parsedData.divisionId} is full. Please assign to another division or put on the waitlist.` });
            return;
        }

        const approvedRegistration = await prisma.teamSeasonRegistration.update({
            where: { id },
            data: {
                divisionId: parsedData.divisionId,
                status: 'APPROVED'
            }
        });

        res.status(200).json(approvedRegistration);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTeams = async (req: Request, res: Response) => {
    try {
        const teams = await prisma.team.findMany({
            where: {
                registrations: {
                    some: { status: 'APPROVED' }
                }
            },
            include: {
                registrations: {
                    where: { status: 'APPROVED' }
                }
            }
        });
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
