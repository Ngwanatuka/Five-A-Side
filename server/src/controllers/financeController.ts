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
            res.status(400).json({ errors: error.errors });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
