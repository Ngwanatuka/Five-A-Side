"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPublicPayment = exports.getAllFinances = exports.registerPlayerFinance = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const registerFinanceSchema = zod_1.z.object({
    playerId: zod_1.z.number().int().positive(),
    seasonId: zod_1.z.number().int().positive(),
    paymentTier: zod_1.z.enum(['FULL', 'HALF', 'PAY_ON_DAY']),
    amountPaid: zod_1.z.number().nonnegative()
});
const registerPlayerFinance = async (req, res) => {
    try {
        const data = registerFinanceSchema.parse(req.body);
        let gamesCredited = 0;
        if (data.paymentTier === 'FULL')
            gamesCredited = 14;
        else if (data.paymentTier === 'HALF')
            gamesCredited = 7;
        const finance = await prisma_1.default.playerSeasonFinance.create({
            data: {
                playerId: data.playerId,
                seasonId: data.seasonId,
                paymentTier: data.paymentTier,
                amountPaid: data.amountPaid,
                gamesCredited
            }
        });
        res.status(201).json(finance);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.registerPlayerFinance = registerPlayerFinance;
const getAllFinances = async (req, res) => {
    try {
        const params = req.query;
        const seasonId = params.seasonId ? parseInt(params.seasonId, 10) : undefined;
        const finances = await prisma_1.default.playerSeasonFinance.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getAllFinances = getAllFinances;
const processPublicPaymentSchema = zod_1.z.object({
    teamName: zod_1.z.string(),
    playerName: zod_1.z.string(),
    seasonId: zod_1.z.number().int().positive(),
    paymentTier: zod_1.z.enum(['FULL', 'HALF', 'PAY_ON_DAY']),
    amountPaid: zod_1.z.number().nonnegative()
});
const processPublicPayment = async (req, res) => {
    try {
        const data = processPublicPaymentSchema.parse(req.body);
        // Find team
        const team = await prisma_1.default.team.findFirst({
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
        let player = await prisma_1.default.player.findFirst({
            where: {
                teamId: team.id,
                firstName: { equals: firstName },
                lastName: { equals: lastName }
            }
        });
        if (!player) {
            const playerCount = await prisma_1.default.player.count({
                where: { teamId: team.id }
            });
            if (playerCount >= 9) {
                res.status(400).json({ error: 'Maximum of 9 players allowed per team roster.' });
                return;
            }
            player = await prisma_1.default.player.create({
                data: {
                    teamId: team.id,
                    firstName,
                    lastName
                }
            });
        }
        let gamesCredited = 0;
        if (data.paymentTier === 'FULL')
            gamesCredited = 14;
        else if (data.paymentTier === 'HALF')
            gamesCredited = 7;
        const finance = await prisma_1.default.playerSeasonFinance.upsert({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.processPublicPayment = processPublicPayment;
//# sourceMappingURL=financeController.js.map