import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';

const updateScoreSchema = z.object({
    homeScore: z.number().int().nonnegative(),
    awayScore: z.number().int().nonnegative(),
    status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED']).optional()
});

const createMatchSchema = z.object({
    seasonId: z.number().int().positive(),
    divisionId: z.number().int().positive(),
    homeTeamId: z.number().int().positive(),
    awayTeamId: z.number().int().positive(),
    date: z.string().datetime(), // ISO 8601
    time: z.string(), // "18:00"
    pitchNumber: z.number().int().min(1).max(3) // Pitch Limit Constraint
});

export const createMatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = createMatchSchema.parse(req.body);
        const matchDate = new Date(body.date);
        const dayOfWeek = matchDate.getDay();

        // Enforce Tuesday (2) or Thursday (4) constraint
        if (dayOfWeek !== 2 && dayOfWeek !== 4) {
            res.status(400).json({ error: 'Matches can only be scheduled on Tuesdays and Thursdays' });
            return;
        }

        // Enforce 3 Pitches Constraint
        const concurrentMatches = await prisma.match.count({
            where: {
                date: matchDate,
                time: body.time
            }
        });

        if (concurrentMatches >= 3) {
            res.status(400).json({ error: 'All 3 pitches are booked for this time slot' });
            return;
        }

        const newMatch = await prisma.match.create({
            data: body
        });

        res.status(201).json(newMatch);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const updateMatchScore = async (req: Request, res: Response): Promise<void> => {
    try {
        const matchId = parseInt(req.params.id as string, 10);
        if (isNaN(matchId)) {
            res.status(400).json({ error: 'Invalid match ID' });
            return;
        }

        const { homeScore, awayScore, status } = updateScoreSchema.parse(req.body);

        const updatedMatch = await prisma.match.update({
            where: { id: matchId },
            data: {
                homeScore,
                awayScore,
                ...(status && { status }),
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
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addPlayerSchema = z.object({
    playerId: z.number().int().positive()
});

export const addPlayerToRoster = async (req: Request, res: Response): Promise<void> => {
    try {
        const matchId = parseInt(req.params.id as string, 10);
        if (isNaN(matchId)) {
            res.status(400).json({ error: 'Invalid match ID' });
            return;
        }

        const { playerId } = addPlayerSchema.parse(req.body);

        // 1. Fetch the match
        const match = await prisma.match.findUnique({
            where: { id: matchId }
        });

        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        // 2. Fetch the player
        const player = await prisma.player.findUnique({
            where: { id: playerId }
        });

        if (!player) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }

        // 3. Ensure player belongs to one of the match teams
        if (player.teamId !== match.homeTeamId && player.teamId !== match.awayTeamId) {
            res.status(400).json({ error: 'Player does not belong to either team in this match' });
            return;
        }

        // 4. Count the number of players from the same team currently on the roster
        const rosterCount = await prisma.matchRoster.count({
            where: {
                matchId: matchId,
                player: {
                    teamId: player.teamId
                }
            }
        });

        // 5. Enforce the < 9 players count cap
        if (rosterCount >= 9) {
            res.status(400).json({ error: `Team ${player.teamId} has already reached the maximum of 9 players for this match roster.` });
            return;
        }

        // 6. Integrate Payment Tier Logic
        const finance = await prisma.playerSeasonFinance.findUnique({
            where: {
                playerId_seasonId: { playerId, seasonId: match.seasonId }
            }
        });

        const isPrePaid = finance && finance.gamesCredited > 0;
        const payOnDayStatus = isPrePaid ? 'PAID' : 'OWES';

        if (isPrePaid) {
            // Deduct one game credit since they are playing today
            await prisma.playerSeasonFinance.update({
                where: { playerId_seasonId: { playerId, seasonId: match.seasonId } },
                data: { gamesCredited: finance!.gamesCredited - 1 }
            });
        }

        // 7. Create the roster record
        const rosterRecord = await prisma.matchRoster.create({
            data: {
                matchId,
                playerId,
                payOnDayStatus,
            }
        });

        res.status(201).json(rosterRecord);

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getMatchesSchema = z.object({
    seasonId: z.string().optional(),
    divisionId: z.string().optional(),
    status: z.string().optional()
});

export const getMatches = async (req: Request, res: Response) => {
    try {
        const query = getMatchesSchema.parse(req.query);
        const whereClause: any = {};

        if (query.seasonId) whereClause.seasonId = parseInt(query.seasonId, 10);
        if (query.divisionId) whereClause.divisionId = parseInt(query.divisionId, 10);
        if (query.status) {
            whereClause.status = { in: query.status.split(',') };
        }

        const matches = await prisma.match.findMany({
            where: whereClause,
            include: {
                homeTeam: { select: { id: true, name: true, logoUrl: true } },
                awayTeam: { select: { id: true, name: true, logoUrl: true } },
                division: { select: { id: true, name: true } }
            },
            orderBy: [
                { date: 'asc' },
                { time: 'asc' }
            ]
        });

        res.status(200).json(matches);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
