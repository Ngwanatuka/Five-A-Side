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
exports.getPlayers = exports.addPlayerToTeam = void 0;
const fs_1 = __importDefault(require("fs"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const derbyController_1 = require("./derbyController");
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
        // Also sync into derby-tournament.json if this team belongs to the tournament
        const io = req.app.get('io');
        try {
            if (team.managerContact && team.managerContact.endsWith('@tournament.local')) {
                const teamKey = team.managerContact.replace('@tournament.local', '');
                if (fs_1.default.existsSync(derbyController_1.DATA_FILE)) {
                    const raw = fs_1.default.readFileSync(derbyController_1.DATA_FILE, 'utf-8');
                    const derbyData = JSON.parse(raw);
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
                    fs_1.default.writeFileSync(derbyController_1.DATA_FILE, JSON.stringify(derbyData, null, 2), 'utf-8');
                    if (io) {
                        io.emit('derbyUpdate', derbyData);
                    }
                }
            }
        }
        catch (derbyPlayerSyncErr) {
            console.error('Notice syncing player to derby file:', derbyPlayerSyncErr);
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
        const players = await prisma_1.default.player.findMany({
            where: whereClause,
            include: { team: true },
            orderBy: { id: 'asc' }
        });
        res.status(200).json(players);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getPlayers = getPlayers;
//# sourceMappingURL=playerController.js.map