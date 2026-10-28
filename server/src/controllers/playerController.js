"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPlayerAsCaptain = exports.deletePlayer = exports.getPlayers = exports.addPlayerToTeam = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const tournamentStore_1 = require("../services/tournamentStore");
const captainService_1 = require("../services/captainService");
const addPlayerSchema = zod_1.z.object({
    teamId: zod_1.z.number().int().positive(),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
});
const addPlayerToTeam = async (req, res) => {
    try {
        // Enforce role authorization
        if (req.user) {
            if (req.user.role === 'REFEREE' || req.user.role === 'SPECTATOR') {
                res.status(403).json({
                    error: 'Editing restricted: Participants and Referees have read-only access. Only Team Captains and Admins can add players.'
                });
                return;
            }
            if (req.user.role === 'CAPTAIN') {
                const { isDeadlineExpired } = await Promise.resolve().then(() => __importStar(require('../services/captainService')));
                if (isDeadlineExpired()) {
                    res.status(403).json({
                        error: 'Roster editing deadline has passed (28 October 18:30). Official rosters are locked. Please contact League Admin.'
                    });
                    return;
                }
            }
        }
        const parsedData = addPlayerSchema.parse(req.body);
        const team = await prisma_1.default.team.findUnique({
            where: { id: parsedData.teamId },
        });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        // Captain team ownership check
        if (req.user && req.user.role === 'CAPTAIN') {
            const captainTeamKey = req.user.teamKey;
            const matchesManager = team.managerContact && team.managerContact.startsWith(captainTeamKey);
            const matchesName = req.user.teamName && team.name.toLowerCase().trim() === req.user.teamName.toLowerCase().trim();
            if (!matchesManager && !matchesName) {
                res.status(403).json({
                    error: `Forbidden: As Captain of "${req.user.teamName || captainTeamKey}", you can only add players to your own squad.`
                });
                return;
            }
        }
        const playerCount = await prisma_1.default.player.count({
            where: { teamId: parsedData.teamId },
        });
        if (playerCount >= 9) {
            res.status(400).json({ error: 'Maximum of 9 players allowed per team roster.' });
            return;
        }
        const newPlayer = await prisma_1.default.player.create({
            data: {
                teamId: parsedData.teamId,
                firstName: parsedData.firstName,
                lastName: parsedData.lastName,
            },
            include: { team: true }
        });
        // Also sync into persistent tournament state if this team belongs to the tournament
        const io = req.app.get('io');
        try {
            if (team.managerContact && team.managerContact.endsWith('@tournament.local')) {
                const teamKey = team.managerContact.replace('@tournament.local', '');
                {
                    const derbyData = await (0, tournamentStore_1.readTournamentData)();
                    if (derbyData) {
                        if (!derbyData.players)
                            derbyData.players = [];
                        const fullName = `${newPlayer.firstName} ${newPlayer.lastName}`.trim();
                        const nextJersey = derbyData.players.filter((p) => p.teamKey === teamKey).length + 1;
                        derbyData.players.push({
                            id: `p-${newPlayer.id}`,
                            teamKey,
                            name: fullName,
                            jerseyNumber: nextJersey,
                            position: 'MID',
                            isCaptain: false
                        });
                        derbyData.updatedAt = new Date().toISOString();
                        await (0, tournamentStore_1.writeTournamentData)(derbyData);
                        if (io) {
                            io.emit('derbyUpdate', derbyData);
                        }
                    }
                }
            }
        }
        catch (derbyPlayerSyncErr) {
            console.error('Notice syncing player to derby file:', derbyPlayerSyncErr);
            throw derbyPlayerSyncErr;
        }
        if (io) {
            io.emit('playerAdded', newPlayer);
            io.emit('teamRegistered');
        }
        res.status(201).json(newPlayer);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addPlayerToTeam = addPlayerToTeam;
const getPlayers = async (req, res) => {
    try {
        const teamId = req.query.teamId ? parseInt(req.query.teamId, 10) : undefined;
        const whereClause = teamId && !isNaN(teamId) ? { teamId } : {};
        const dbPlayers = await prisma_1.default.player.findMany({
            where: whereClause,
            include: { team: true },
            orderBy: { id: 'asc' }
        });
        let allPlayers = [...dbPlayers];
        {
            try {
                const derbyData = await (0, tournamentStore_1.readTournamentData)();
                if (!derbyData) {
                    res.status(503).json({ error: 'Tournament state is unavailable' });
                    return;
                }
                if (Array.isArray(derbyData.players)) {
                    const dbTeams = await prisma_1.default.team.findMany();
                    const teamKeyToId = {};
                    dbTeams.forEach(t => {
                        if (t.managerContact && t.managerContact.endsWith('@tournament.local')) {
                            const key = t.managerContact.replace('@tournament.local', '');
                            teamKeyToId[key] = t;
                        }
                    });
                    for (const tp of derbyData.players) {
                        const team = teamKeyToId[tp.teamKey];
                        const matchedTeamId = team?.id;
                        if (teamId && matchedTeamId !== teamId)
                            continue;
                        const exists = allPlayers.some(p => (p.teamId === matchedTeamId || p.team?.name === team?.name) &&
                            `${p.firstName} ${p.lastName}`.trim().toLowerCase() === tp.name.trim().toLowerCase());
                        if (!exists && tp.name) {
                            const parts = tp.name.trim().split(' ');
                            allPlayers.push({
                                id: tp.id,
                                teamId: matchedTeamId || 0,
                                firstName: parts[0] || tp.name,
                                lastName: parts.slice(1).join(' ') || '-',
                                team: team || { id: 0, name: tp.teamKey, managerContact: '' },
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });
                        }
                    }
                }
            }
            catch (err) {
                console.error('Notice merging derby players in getPlayers:', err);
                throw err;
            }
        }
        res.status(200).json(allPlayers);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getPlayers = getPlayers;
const deletePlayer = async (req, res) => {
    try {
        const authUser = req.user;
        const roleHeader = (req.headers['x-user-role'] || '').toUpperCase();
        const effectiveRole = authUser?.role || roleHeader || 'SPECTATOR';
        const captainTeamKey = authUser?.teamKey || req.headers['x-captain-team-key'];
        if (effectiveRole === 'REFEREE' || effectiveRole === 'SPECTATOR') {
            res.status(403).json({
                error: 'Editing restricted: Participants and Referees have read-only access. Only Team Captains and Admins can remove players.'
            });
            return;
        }
        if (effectiveRole === 'CAPTAIN') {
            const { isDeadlineExpired } = await Promise.resolve().then(() => __importStar(require('../services/captainService')));
            if (isDeadlineExpired()) {
                res.status(403).json({
                    error: 'Roster editing deadline has passed (28 October 18:30). Official rosters are locked. Please contact League Admin.'
                });
                return;
            }
        }
        const rawId = String(req.params.id || '');
        const paramName = (req.query.name || req.body?.name || '').trim();
        const paramTeamKey = (req.query.teamKey || req.body?.teamKey || '').trim();
        const paramTeamId = req.query.teamId ? parseInt(req.query.teamId, 10) : req.body?.teamId;
        // Captain team ownership check
        if (effectiveRole === 'CAPTAIN' && captainTeamKey) {
            if (paramTeamKey && paramTeamKey.toLowerCase() !== captainTeamKey.toLowerCase()) {
                res.status(403).json({
                    error: `Forbidden: As Captain of "${captainTeamKey}", you can only remove players from your own squad.`
                });
                return;
            }
        }
        // 1. Resolve and delete DB Player if present
        let dbPlayer = null;
        let numericId = null;
        if (/^\d+$/.test(rawId)) {
            numericId = parseInt(rawId, 10);
        }
        else if (/^p-\d+$/.test(rawId)) {
            numericId = parseInt(rawId.replace(/^p-/, ''), 10);
        }
        if (numericId !== null && !isNaN(numericId)) {
            dbPlayer = await prisma_1.default.player.findUnique({
                where: { id: numericId },
                include: { team: true }
            });
        }
        if (!dbPlayer && (paramName || rawId)) {
            const searchName = paramName || rawId;
            const parts = searchName.split(' ');
            const firstName = parts[0] || searchName;
            const lastName = parts.slice(1).join(' ') || '-';
            let targetTeamId = paramTeamId;
            if (!targetTeamId && (paramTeamKey || captainTeamKey)) {
                const targetKey = paramTeamKey || captainTeamKey;
                const team = await prisma_1.default.team.findFirst({
                    where: {
                        OR: [
                            { managerContact: `${targetKey}@tournament.local` },
                            { managerContact: { startsWith: targetKey } }
                        ]
                    }
                });
                if (team)
                    targetTeamId = team.id;
            }
            if (targetTeamId) {
                dbPlayer = await prisma_1.default.player.findFirst({
                    where: {
                        teamId: targetTeamId,
                        OR: [
                            { firstName, lastName },
                            { firstName: searchName }
                        ]
                    },
                    include: { team: true }
                });
            }
            else {
                dbPlayer = await prisma_1.default.player.findFirst({
                    where: {
                        OR: [
                            { firstName, lastName },
                            { firstName: searchName }
                        ]
                    },
                    include: { team: true }
                });
            }
        }
        if (dbPlayer) {
            // Additional captain ownership verification on the DB player
            if (effectiveRole === 'CAPTAIN' && captainTeamKey && dbPlayer.team) {
                const matchesManager = dbPlayer.team.managerContact && dbPlayer.team.managerContact.startsWith(captainTeamKey);
                const matchesName = req.user?.teamName && dbPlayer.team.name.toLowerCase().trim() === req.user.teamName.toLowerCase().trim();
                if (!matchesManager && !matchesName) {
                    res.status(403).json({
                        error: `Forbidden: As Captain of "${req.user?.teamName || captainTeamKey}", you can only remove players from your own squad.`
                    });
                    return;
                }
            }
            // Remove foreign key dependencies before deleting player
            await prisma_1.default.matchRoster.deleteMany({ where: { playerId: dbPlayer.id } }).catch(() => { });
            await prisma_1.default.playerSeasonFinance.deleteMany({ where: { playerId: dbPlayer.id } }).catch(() => { });
            await prisma_1.default.player.delete({ where: { id: dbPlayer.id } }).catch(() => { });
        }
        // 2. Remove player from persistent tournament state
        let derbyData = null;
        {
            try {
                derbyData = await (0, tournamentStore_1.readTournamentData)();
                if (derbyData) {
                    if (Array.isArray(derbyData.players)) {
                        derbyData.players = derbyData.players.filter((p) => {
                            if (!p)
                                return false;
                            if (p.id === rawId)
                                return false;
                            if (dbPlayer && (p.id === `p-${dbPlayer.id}` || p.id === String(dbPlayer.id)))
                                return false;
                            if (paramTeamKey && paramName && p.teamKey === paramTeamKey && p.name.trim().toLowerCase() === paramName.toLowerCase())
                                return false;
                            if (dbPlayer && dbPlayer.team?.managerContact?.startsWith(p.teamKey) &&
                                `${dbPlayer.firstName} ${dbPlayer.lastName !== '-' ? dbPlayer.lastName : ''}`.trim().toLowerCase() === p.name.trim().toLowerCase()) {
                                return false;
                            }
                            return true;
                        });
                        // Clean up any associated goal events
                        if (Array.isArray(derbyData.goalEvents)) {
                            derbyData.goalEvents = derbyData.goalEvents.filter((ev) => ev.scorerPlayerId !== rawId &&
                                ev.assistPlayerId !== rawId &&
                                (!dbPlayer || (ev.scorerPlayerId !== `p-${dbPlayer.id}` && ev.assistPlayerId !== `p-${dbPlayer.id}`)));
                        }
                        derbyData.updatedAt = new Date().toISOString();
                        await (0, tournamentStore_1.writeTournamentData)(derbyData);
                    }
                }
            }
            catch (err) {
                console.error('Notice updating derby file on player delete:', err);
                throw err;
            }
        }
        // Broadcast removal via Socket.IO
        const io = req.app.get('io');
        if (io) {
            if (derbyData) {
                io.emit('derbyUpdate', derbyData);
            }
            io.emit('playerDeleted', { id: rawId, dbId: dbPlayer?.id, teamKey: paramTeamKey, name: paramName });
            io.emit('teamRegistered');
        }
        res.status(200).json({
            success: true,
            message: 'Player successfully removed from squad.',
            deletedId: rawId,
            dbId: dbPlayer?.id
        });
    }
    catch (error) {
        console.error('Failed to delete player:', error);
        res.status(500).json({ error: 'Internal server error while removing player' });
    }
};
exports.deletePlayer = deletePlayer;
const setPlayerAsCaptain = async (req, res) => {
    try {
        const authUser = req.user;
        const roleHeader = (req.headers['x-user-role'] || '').toUpperCase();
        const effectiveRole = authUser?.role || roleHeader || 'SPECTATOR';
        const captainTeamKey = authUser?.teamKey || req.headers['x-captain-team-key'];
        if (effectiveRole === 'REFEREE' || effectiveRole === 'SPECTATOR') {
            res.status(403).json({
                error: 'Forbidden: Only Team Captains and Admins can designate the team captain.'
            });
            return;
        }
        const rawId = String(req.params.id || '');
        let tournamentTeamKey = String(req.body?.teamKey || '').trim();
        let playerName = String(req.body?.name || '').trim();
        let numericId = null;
        if (/^\d+$/.test(rawId)) {
            numericId = parseInt(rawId, 10);
        }
        else if (/^p-\d+$/.test(rawId)) {
            numericId = parseInt(rawId.replace(/^p-/, ''), 10);
        }
        // 1. Sync to the primary persistent tournament state
        try {
            const derby = await (0, tournamentStore_1.readTournamentData)();
            if (derby) {
                if (Array.isArray(derby.players)) {
                    // If target info wasn't in body, search in JSON
                    if (!tournamentTeamKey || !playerName) {
                        const fileP = derby.players.find((p) => p.id === rawId ||
                            (playerName && p.name && p.name.trim().toLowerCase() === playerName.toLowerCase()));
                        if (fileP) {
                            tournamentTeamKey = tournamentTeamKey || fileP.teamKey;
                            playerName = playerName || fileP.name;
                        }
                    }
                    // Captain permission check
                    if (effectiveRole === 'CAPTAIN' && captainTeamKey && tournamentTeamKey) {
                        if (captainTeamKey.toLowerCase() !== tournamentTeamKey.toLowerCase()) {
                            res.status(403).json({
                                error: `Forbidden: As Captain of "${captainTeamKey}", you can only assign captain for your own team.`
                            });
                            return;
                        }
                    }
                    if (tournamentTeamKey) {
                        let matched = false;
                        derby.players = derby.players.map((p) => {
                            if (p.teamKey === tournamentTeamKey) {
                                const isTarget = (p.id === rawId ||
                                    (playerName && p.name && p.name.trim().toLowerCase() === playerName.toLowerCase()));
                                if (isTarget) {
                                    matched = true;
                                    if (!playerName)
                                        playerName = p.name;
                                }
                                return { ...p, isCaptain: isTarget };
                            }
                            return p;
                        });
                        // If not matched but we have the player details, add to squad
                        if (!matched && playerName) {
                            derby.players.push({
                                id: rawId.startsWith('p-') ? rawId : `p-${Date.now()}`,
                                teamKey: tournamentTeamKey,
                                name: playerName,
                                jerseyNumber: 10,
                                position: 'FWD',
                                isCaptain: true
                            });
                        }
                        derby.updatedAt = new Date().toISOString();
                        await (0, tournamentStore_1.writeTournamentData)(derby);
                    }
                }
            }
        }
        catch (jsonErr) {
            console.error('Notice updating captain in derby JSON:', jsonErr);
            throw jsonErr;
        }
        // 2. Also update captains.json so login dropdown immediately reflects the designated captain
        if (tournamentTeamKey && playerName) {
            try {
                (0, captainService_1.adminUpdateCaptain)(tournamentTeamKey, { captainName: playerName });
            }
            catch (capErr) {
                console.warn('Notice updating captain in captains.json:', capErr);
            }
        }
        // 3. Asynchronously sync to Prisma database (non-blocking)
        (async () => {
            try {
                let dbPlayer = null;
                if (numericId !== null && !isNaN(numericId)) {
                    dbPlayer = await prisma_1.default.player.findUnique({
                        where: { id: numericId },
                        include: { team: true }
                    });
                }
                if (!dbPlayer && playerName && tournamentTeamKey) {
                    const searchName = playerName.split(' ')[0] || playerName;
                    dbPlayer = await prisma_1.default.player.findFirst({
                        where: {
                            team: { managerContact: `${tournamentTeamKey}@tournament.local` },
                            firstName: searchName
                        },
                        include: { team: true }
                    });
                }
                if (dbPlayer) {
                    await prisma_1.default.player.updateMany({
                        where: { teamId: dbPlayer.teamId },
                        data: { isCaptain: false }
                    });
                    await prisma_1.default.player.update({
                        where: { id: dbPlayer.id },
                        data: { isCaptain: true }
                    });
                }
            }
            catch (dbErr) {
                console.warn('Async DB captain sync notice:', dbErr);
            }
        })();
        const io = req.app?.get ? req.app.get('io') : null;
        if (io) {
            io.emit('playerUpdated', { id: rawId, teamKey: tournamentTeamKey, isCaptain: true, name: playerName });
            io.emit('captainsUpdated');
            io.emit('derbyUpdate');
            io.emit('teamRegistered');
        }
        res.json({
            success: true,
            message: `"${playerName || 'Player'}" is now the designated Captain!`,
            captainName: playerName,
            teamKey: tournamentTeamKey
        });
    }
    catch (error) {
        console.error('Failed to set player as captain:', error);
        res.status(500).json({ error: 'Internal server error while setting captain' });
    }
};
exports.setPlayerAsCaptain = setPlayerAsCaptain;
//# sourceMappingURL=playerController.js.map