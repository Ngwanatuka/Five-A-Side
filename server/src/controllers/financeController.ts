import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';

const registerFinanceSchema = z.object({
    playerId: z.number().int().positive(),
    seasonId: z.number().int().positive(),
    paymentTier: z.enum(['FULL', 'HALF', 'PAY_ON_DAY']),
    amountPaid: z.number().nonnegative()
});

export const registerPlayerFinance = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = registerFinanceSchema.parse(req.body);
        let gamesCredited = 0;

        if (data.paymentTier === 'FULL') gamesCredited = 14;
        else if (data.paymentTier === 'HALF') gamesCredited = 7;

        const finance = await prisma.playerSeasonFinance.create({
            data: {
                playerId: data.playerId,
                seasonId: data.seasonId,
                paymentTier: data.paymentTier,
                amountPaid: data.amountPaid,
                gamesCredited
            }
        });

        res.status(201).json(finance);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAllFinances = async (req: Request, res: Response) => {
    try {
        const params = req.query as { seasonId?: string };
        const seasonId = params.seasonId ? parseInt(params.seasonId, 10) : undefined;

        const finances = await prisma.playerSeasonFinance.findMany({
            where: seasonId ? { seasonId } : {},
            include: {
                player: {
                    include: {
                        team: true
                    }
                }
            }
        });
        res.status(200).json(finances);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const processPublicPaymentSchema = z.object({
    teamName: z.string(),
    playerName: z.string(),
    seasonId: z.number().int().positive(),
    paymentTier: z.enum(['FULL', 'HALF', 'PAY_ON_DAY']),
    amountPaid: z.number().nonnegative()
});

export const processPublicPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = processPublicPaymentSchema.parse(req.body);

        // Find team
        const team = await prisma.team.findFirst({
            where: { name: data.teamName }
        });

        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }

        const parts = data.playerName.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        // Find or create player
        let player = await prisma.player.findFirst({
            where: {
                teamId: team.id,
                firstName: { equals: firstName },
                lastName: { equals: lastName }
            }
        });

        if (!player) {
            const playerCount = await prisma.player.count({
                where: { teamId: team.id }
            });

            if (playerCount >= 9) {
                res.status(400).json({ error: 'Maximum of 9 players allowed per team roster.' });
                return;
            }

            player = await prisma.player.create({
                data: {
                    teamId: team.id,
                    firstName,
                    lastName
                }
            });
        }

        let gamesCredited = 0;
        if (data.paymentTier === 'FULL') gamesCredited = 14;
        else if (data.paymentTier === 'HALF') gamesCredited = 7;

        const finance = await prisma.playerSeasonFinance.upsert({
            where: {
                playerId_seasonId: {
                    playerId: player.id,
                    seasonId: data.seasonId
                }
            },
            update: {
                paymentTier: data.paymentTier,
                amountPaid: { increment: data.amountPaid },
                gamesCredited: { increment: gamesCredited }
            },
            create: {
                playerId: player.id,
                seasonId: data.seasonId,
                paymentTier: data.paymentTier,
                amountPaid: data.amountPaid,
                gamesCredited
            }
        });

        res.status(200).json(finance);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
