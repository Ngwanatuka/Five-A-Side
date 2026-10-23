"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatches = exports.addPlayerToRoster = exports.updateMatchScore = exports.createMatch = void 0;
const fs_1 = __importDefault(require("fs"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const derbyController_1 = require("./derbyController");
const updateScoreSchema = zod_1.z.object({
    homeScore: zod_1.z.number().int().nonnegative(),
    awayScore: zod_1.z.number().int().nonnegative(),
    status: zod_1.z.enum(['UPCOMING', 'LIVE', 'COMPLETED']).optional()
});
const createMatchSchema = zod_1.z.object({
    seasonId: zod_1.z.number().int().positive(),
    divisionId: zod_1.z.number().int().positive(),
    homeTeamId: zod_1.z.number().int().positive(),
    awayTeamId: zod_1.z.number().int().positive(),
    date: zod_1.z.string().datetime(), // ISO 8601
    time: zod_1.z.string(), // "18:00"
    pitchNumber: zod_1.z.number().int().min(1).max(3) // Pitch Limit Constraint
});
const createMatch = async (req, res) => {
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
        const concurrentMatches = await prisma_1.default.match.count({
            where: {
                date: matchDate,
                time: body.time
            }
        });
        if (concurrentMatches >= 3) {
            res.status(400).json({ error: 'All 3 pitches are booked for this time slot' });
            return;
        }
        const newMatch = await prisma_1.default.match.create({
            data: body
        });
        res.status(201).json(newMatch);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.createMatch = createMatch;
const updateMatchScore = async (req, res) => {
    try {
        const matchId = parseInt(req.params.id, 10);
        if (isNaN(matchId)) {
            res.status(400).json({ error: 'Invalid match ID' });
            return;
        }
        const { homeScore, awayScore, status } = updateScoreSchema.parse(req.body);
        const updatedMatch = await prisma_1.default.match.update({
            where: { id: matchId },
            data: {
                homeScore,
                awayScore,
                ...(status && { status }),
            },
            include: {
                homeTeam: true,
                awayTeam: true
            }
        });
        // Sync to derby tournament JSON file if matches exist
        try {
            if (fs_1.default.existsSync(derbyController_1.DATA_FILE)) {
                const raw = fs_1.default.readFileSync(derbyController_1.DATA_FILE, 'utf-8');
                const derbyData = JSON.parse(raw);
                if (derbyData.matches && Array.isArray(derbyData.matches)) {
                    let changed = false;
                    for (const m of derbyData.matches) {
                        const homeKeyMatch = m.homeTeamKey && updatedMatch.homeTeam?.managerContact?.startsWith(m.homeTeamKey);
                        const awayKeyMatch = m.awayTeamKey && updatedMatch.awayTeam?.managerContact?.startsWith(m.awayTeamKey);
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
                        fs_1.default.writeFileSync(derbyController_1.DATA_FILE, JSON.stringify(derbyData, null, 2), 'utf-8');
                        const io = req.app.get('io');
                        if (io) {
                            io.emit('derbyUpdate', derbyData);
                        }
                    }
                }
            }
        }
        catch (derbySyncErr) {
            console.error('Notice syncing referee score to derby file:', derbySyncErr);
        }
        // Broadcast the update to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('scoreUpdate', updatedMatch);
            io.emit('teamRegistered');
        }
        res.status(200).json(updatedMatch);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.updateMatchScore = updateMatchScore;
const addPlayerSchema = zod_1.z.object({
    playerId: zod_1.z.number().int().positive()
});
const addPlayerToRoster = async (req, res) => {
    try {
        const matchId = parseInt(req.params.id, 10);
        if (isNaN(matchId)) {
            res.status(400).json({ error: 'Invalid match ID' });
            return;
        }
        const { playerId } = addPlayerSchema.parse(req.body);
        // 1. Fetch the match
        const match = await prisma_1.default.match.findUnique({
            where: { id: matchId }
        });
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }
        // 2. Fetch the player
        const player = await prisma_1.default.player.findUnique({
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
        const rosterCount = await prisma_1.default.matchRoster.count({
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
        const finance = await prisma_1.default.playerSeasonFinance.findUnique({
            where: {
                playerId_seasonId: { playerId, seasonId: match.seasonId }
            }
        });
        const isPrePaid = finance && finance.gamesCredited > 0;
        const payOnDayStatus = isPrePaid ? 'PAID' : 'OWES';
        if (isPrePaid) {
            // Deduct one game credit since they are playing today
            await prisma_1.default.playerSeasonFinance.update({
                where: { playerId_seasonId: { playerId, seasonId: match.seasonId } },
                data: { gamesCredited: finance.gamesCredited - 1 }
            });
        }
        // 7. Create the roster record
        const rosterRecord = await prisma_1.default.matchRoster.create({
            data: {
                matchId,
                playerId,
                payOnDayStatus,
            }
        });
        res.status(201).json(rosterRecord);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.addPlayerToRoster = addPlayerToRoster;
const getMatchesSchema = zod_1.z.object({
    seasonId: zod_1.z.string().optional(),
    divisionId: zod_1.z.string().optional(),
    status: zod_1.z.string().optional()
});
const getMatches = async (req, res) => {
    try {
        const query = getMatchesSchema.parse(req.query);
        const whereClause = {};
        if (query.seasonId)
            whereClause.seasonId = parseInt(query.seasonId, 10);
        if (query.divisionId)
            whereClause.divisionId = parseInt(query.divisionId, 10);
        if (query.status) {
            whereClause.status = { in: query.status.split(',') };
        }
        const matches = await prisma_1.default.match.findMany({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getMatches = getMatches;
//# sourceMappingURL=matchController.js.map