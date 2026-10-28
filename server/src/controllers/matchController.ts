import { Request, Response } from 'express';
import fs from 'fs';
import { z } from 'zod';
import prisma from '../prisma';
import { DATA_FILE, writeTournamentData } from './derbyController';

const updateScoreSchema = z.object({
    homeScore: z.number().int().nonnegative().nullable(),
    awayScore: z.number().int().nonnegative().nullable(),
    status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'SCHEDULED', 'scheduled', 'upcoming', 'live', 'completed']).optional(),
    tieBreakWinnerKey: z.string().nullable().optional(),
    goalEvents: z.array(z.object({
        id: z.string(),
        matchId: z.string(),
        teamKey: z.string(),
        scorerPlayerId: z.string(),
        scorerPlayerName: z.string().optional(),
        assistPlayerId: z.string().nullable().optional(),
        assistPlayerName: z.string().nullable().optional(),
        minute: z.number().int().nonnegative(),
        side: z.enum(['home', 'away']).optional()
    }).passthrough()).optional()
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

const syncTournamentScoreToDatabase = async (
    homeTeamKey: string | null | undefined,
    awayTeamKey: string | null | undefined,
    homeScore: number | null,
    awayScore: number | null,
    status?: string
) => {
    if (!homeTeamKey || !awayTeamKey) return;

    const [homeTeam, awayTeam] = await Promise.all([
        prisma.team.findFirst({ where: { managerContact: `${homeTeamKey}@tournament.local` } }),
        prisma.team.findFirst({ where: { managerContact: `${awayTeamKey}@tournament.local` } })
    ]);
    if (!homeTeam || !awayTeam) return;

    const databaseMatch = await prisma.match.findFirst({
        where: {
            seasonId: 1,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id
        }
    });
    if (!databaseMatch) return;

    const normalizedStatus = status?.toLowerCase();
    const prismaStatus = normalizedStatus === 'completed'
        ? 'COMPLETED'
        : normalizedStatus === 'live'
            ? 'LIVE'
            : normalizedStatus
                ? 'UPCOMING'
                : undefined;

    await prisma.match.update({
        where: { id: databaseMatch.id },
        data: {
            homeScore,
            awayScore,
            ...(prismaStatus && { status: prismaStatus })
        }
    });
};

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
        const rawId = req.params.id as string;
        const matchId = parseInt(rawId, 10);
        const { homeScore, awayScore, status, goalEvents, tieBreakWinnerKey } = updateScoreSchema.parse(req.body);
        if (goalEvents?.some(event => event.matchId !== rawId)) {
            res.status(400).json({ error: 'Goal events must belong to the submitted match' });
            return;
        }

        // 1. If matchId is NaN or tournament string ID, handle directly in derby tournament file
        if (isNaN(matchId)) {
            if (fs.existsSync(DATA_FILE)) {
                const raw = fs.readFileSync(DATA_FILE, 'utf-8');
                const derbyData = JSON.parse(raw);
                if (derbyData.matches && Array.isArray(derbyData.matches)) {
                    const matchIndex = derbyData.matches.findIndex((m: any) => m.id === rawId);
                    if (matchIndex !== -1) {
                        const tm = derbyData.matches[matchIndex];
                        if (tieBreakWinnerKey !== undefined) {
                            const isKnockout = ['semi', 'final', 'third_place'].includes(tm.stage);
                            const hasTiedScore = homeScore !== null && awayScore !== null && homeScore === awayScore;
                            const isParticipant = tieBreakWinnerKey === tm.homeTeamKey || tieBreakWinnerKey === tm.awayTeamKey;
                            if (tieBreakWinnerKey !== null && (!isKnockout || !hasTiedScore || status?.toLowerCase() !== 'completed' || !isParticipant)) {
                                res.status(400).json({ error: 'A tie-break winner must be one of the teams in a completed, tied knockout match.' });
                                return;
                            }
                            tm.tieBreakWinnerKey = tieBreakWinnerKey;
                        } else if (status?.toLowerCase() !== 'completed' || homeScore !== awayScore) {
                            tm.tieBreakWinnerKey = null;
                        }
                        tm.homeScore = homeScore;
                        tm.awayScore = awayScore;
                        if (status) {
                            tm.status = status.toLowerCase() === 'completed' ? 'completed' : (status.toLowerCase() === 'live' ? 'live' : 'scheduled');
                        }
                        if (goalEvents) {
                            const existingGoalEvents = Array.isArray(derbyData.goalEvents) ? derbyData.goalEvents : [];
                            derbyData.goalEvents = [
                                ...existingGoalEvents.filter((event: any) => event.matchId !== rawId),
                                ...goalEvents
                            ];
                        }
                        derbyData.updatedAt = new Date().toISOString();
                        writeTournamentData(derbyData);
                        try {
                            await syncTournamentScoreToDatabase(
                                tm.homeTeamKey,
                                tm.awayTeamKey,
                                homeScore,
                                awayScore,
                                status
                            );
                        } catch (dbErr) {
                            console.error('Notice syncing tournament match score to database:', dbErr);
                        }

                        const derbyTeams = derbyData.teams || {};
                        const homeName = tm.homeTeamKey && derbyTeams[tm.homeTeamKey]?.name
                            ? derbyTeams[tm.homeTeamKey].name
                            : (tm.homePlaceholder || 'TBD');
                        const awayName = tm.awayTeamKey && derbyTeams[tm.awayTeamKey]?.name
                            ? derbyTeams[tm.awayTeamKey].name
                            : (tm.awayPlaceholder || 'TBD');

                        const resultMatch = {
                            id: tm.id,
                            seasonId: 1,
                            divisionId: 1,
                            pitchNumber: tm.pitch || 1,
                            time: tm.time || '18:30',
                            homeScore: tm.homeScore,
                            awayScore: tm.awayScore,
                            tieBreakWinnerKey: tm.tieBreakWinnerKey || null,
                            status: (tm.status || 'scheduled').toUpperCase(),
                            stage: tm.stage,
                            group: tm.group,
                            homeTeam: { id: tm.homeTeamKey || tm.id, name: homeName },
                            awayTeam: { id: tm.awayTeamKey || tm.id, name: awayName }
                        };

                        const io = req.app.get('io');
                        if (io) {
                            io.emit('derbyUpdate', derbyData);
                            io.emit('scoreUpdate', resultMatch);
                        }

                        res.status(200).json(resultMatch);
                        return;
                    }
                }
            }
            res.status(404).json({ error: 'Tournament match not found' });
            return;
        }
        if (tieBreakWinnerKey !== undefined) {
            res.status(400).json({ error: 'Tie-break winners can only be recorded for Dench tournament matches.' });
            return;
        }

        // 2. Numeric DB match ID handling
        let updatedMatch: any = null;
        let prismaStatus: 'UPCOMING' | 'LIVE' | 'COMPLETED' | undefined = undefined;
        if (status) {
            const lower = status.toLowerCase();
            prismaStatus = lower === 'completed' ? 'COMPLETED' : (lower === 'live' ? 'LIVE' : 'UPCOMING');
        }

        try {
            updatedMatch = await prisma.match.update({
                where: { id: matchId },
                data: {
                    homeScore,
                    awayScore,
                    ...(prismaStatus && { status: prismaStatus }),
                },
                include: {
                    homeTeam: true,
                    awayTeam: true
                }
            });
        } catch (dbErr) {
            console.error('Notice updating DB match:', dbErr);
        }

        // Sync to derby tournament JSON file if matches exist
        try {
            if (fs.existsSync(DATA_FILE)) {
                const raw = fs.readFileSync(DATA_FILE, 'utf-8');
                const derbyData = JSON.parse(raw);
                if (derbyData.matches && Array.isArray(derbyData.matches)) {
                    let changed = false;
                    for (const m of derbyData.matches) {
                        const homeKeyMatch = m.homeTeamKey && updatedMatch?.homeTeam?.managerContact?.startsWith(m.homeTeamKey);
                        const awayKeyMatch = m.awayTeamKey && updatedMatch?.awayTeam?.managerContact?.startsWith(m.awayTeamKey);
                        if (homeKeyMatch && awayKeyMatch) {
                            m.homeScore = homeScore;
                            m.awayScore = awayScore;
                            if (status) {
                                m.status = status.toLowerCase() === 'completed' ? 'completed' : (status.toLowerCase() === 'live' ? 'live' : 'scheduled');
                            }
                            changed = true;
                        }
                    }
                    if (changed) {
                        derbyData.updatedAt = new Date().toISOString();
                        writeTournamentData(derbyData);
                        const io = req.app.get('io');
                        if (io) {
                            io.emit('derbyUpdate', derbyData);
                        }
                    }
                }
            }
        } catch (derbySyncErr) {
            console.error('Notice syncing referee score to derby file:', derbySyncErr);
        }

        // Broadcast the update to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('scoreUpdate', updatedMatch || { id: matchId, homeScore, awayScore, status });
            io.emit('teamRegistered');
        }

        res.status(200).json(updatedMatch || { id: matchId, homeScore, awayScore, status });
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

        let dbMatches: any[] = [];
        try {
            dbMatches = await prisma.match.findMany({
                where: whereClause,
                include: {
                    homeTeam: { select: { id: true, name: true, logoUrl: true, managerContact: true } },
                    awayTeam: { select: { id: true, name: true, logoUrl: true, managerContact: true } },
                    division: { select: { id: true, name: true } }
                },
                orderBy: [
                    { date: 'asc' },
                    { time: 'asc' }
                ]
            });
        } catch (dbErr) {
            console.error('Notice querying DB matches:', dbErr);
        }

        // Overlay latest tournament data and edited team names from derby-tournament.json
        if (fs.existsSync(DATA_FILE)) {
            try {
                const raw = fs.readFileSync(DATA_FILE, 'utf-8');
                const derbyData = JSON.parse(raw);
                const derbyTeams = derbyData.teams || {};

                // Map team keys to edited club names
                const teamKeyToName: Record<string, string> = {};
                for (const key of Object.keys(derbyTeams)) {
                    if (derbyTeams[key]?.name) {
                        teamKeyToName[key] = derbyTeams[key].name;
                    }
                }

                // If DB matches exist, synchronize their team names with the latest edited names
                for (const m of dbMatches) {
                    for (const [key, name] of Object.entries(teamKeyToName)) {
                        if (m.homeTeam?.managerContact?.startsWith(key) || m.homeTeam?.name?.toLowerCase().includes(key.replace(/-/g, ' '))) {
                            m.homeTeam.name = name;
                        }
                        if (m.awayTeam?.managerContact?.startsWith(key) || m.awayTeam?.name?.toLowerCase().includes(key.replace(/-/g, ' '))) {
                            m.awayTeam.name = name;
                        }
                    }
                }

                // Prepare normalized tournament fixtures
                if (Array.isArray(derbyData.matches)) {
                    const tournamentMatches = derbyData.matches.filter((tm: any) => {
                        if (!query.status) return true;
                        const allowed = query.status.split(',').map((s: string) => s.toUpperCase());
                        const matchStatus = (tm.status || 'scheduled').toUpperCase();
                        const normalizedStatus = matchStatus === 'COMPLETED' ? 'COMPLETED' : (matchStatus === 'LIVE' ? 'LIVE' : 'UPCOMING');
                        return allowed.includes(normalizedStatus);
                    }).map((tm: any) => {
                        const homeName = tm.homeTeamKey && derbyTeams[tm.homeTeamKey]?.name
                            ? derbyTeams[tm.homeTeamKey].name
                            : (tm.homePlaceholder || 'TBD');
                        const awayName = tm.awayTeamKey && derbyTeams[tm.awayTeamKey]?.name
                            ? derbyTeams[tm.awayTeamKey].name
                            : (tm.awayPlaceholder || 'TBD');

                        const normalizedStatus = tm.status === 'completed' ? 'COMPLETED' : (tm.status === 'live' ? 'LIVE' : 'UPCOMING');

                        return {
                            id: tm.id,
                            seasonId: 1,
                            divisionId: 1,
                            homeTeamId: tm.homeTeamKey ? 1 : null,
                            awayTeamId: tm.awayTeamKey ? 2 : null,
                            date: '2026-10-28T18:30:00.000Z',
                            time: tm.time || '18:30',
                            pitchNumber: tm.pitch || 1,
                            homeScore: tm.homeScore,
                            awayScore: tm.awayScore,
                            tieBreakWinnerKey: tm.tieBreakWinnerKey || null,
                            status: normalizedStatus,
                            stage: tm.stage,
                            group: tm.group,
                            note: tm.note,
                            homeTeam: {
                                id: tm.homeTeamKey || tm.id,
                                name: homeName,
                                logoUrl: null
                            },
                            awayTeam: {
                                id: tm.awayTeamKey || tm.id,
                                name: awayName,
                                logoUrl: null
                            },
                            division: { id: 1, name: 'Division 1' }
                        };
                    });

                    // If tournament matches exist, return them so referee console & fixtures have all stages and edited team names
                    if (tournamentMatches.length > 0) {
                        return res.status(200).json(tournamentMatches);
                    }
                }
            } catch (err) {
                console.error('Error overlaying tournament data on matches:', err);
            }
        }

        res.status(200).json(dbMatches);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
