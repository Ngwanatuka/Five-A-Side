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
exports.resetDerbyData = exports.saveDerbyData = exports.getDerbyData = exports.DEFAULT_DERBY_MATCHES = exports.DEFAULT_DERBY_TEAMS = exports.DATA_FILE = exports.DATA_DIR = void 0;
exports.syncToPrismaDatabase = syncToPrismaDatabase;
exports.initDerbyTournament = initDerbyTournament;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../prisma"));
exports.DATA_DIR = path_1.default.join(__dirname, '../../data');
exports.DATA_FILE = path_1.default.join(exports.DATA_DIR, 'derby-tournament.json');
// Ensure data directory exists
if (!fs_1.default.existsSync(exports.DATA_DIR)) {
    fs_1.default.mkdirSync(exports.DATA_DIR, { recursive: true });
}
exports.DEFAULT_DERBY_TEAMS = {
    'team-dench': {
        id: 'team-dench',
        name: 'Team Dench',
        group: 'A',
        color: '#12b84c',
        secondaryColor: '#0ea141',
        city: 'Dench Grounds',
        slogan: 'Relentless Pace, Pure Passion',
        founded: '2023',
        captain: ''
    },
    'cpt-superstars': {
        id: 'cpt-superstars',
        name: 'CPT superstars fc',
        group: 'A',
        color: '#3b82f6',
        secondaryColor: '#1d4ed8',
        city: 'Cape Town',
        slogan: 'Mother City Maestros',
        founded: '2022',
        captain: ''
    },
    'bras-ba-kasi': {
        id: 'bras-ba-kasi',
        name: 'Bras ba kasi',
        group: 'A',
        color: '#f59e0b',
        secondaryColor: '#d97706',
        city: 'Kasi Local',
        slogan: 'Flavour, Flair & Brotherhood',
        founded: '2021',
        captain: ''
    },
    'gauteng-warriors': {
        id: 'gauteng-warriors',
        name: 'Gauteng state warriors',
        group: 'B',
        color: '#8b5cf6',
        secondaryColor: '#6d28d9',
        city: 'Gauteng',
        slogan: 'The Golden Province Titans',
        founded: '2022',
        captain: ''
    },
    'woza-madzala': {
        id: 'woza-madzala',
        name: 'Woza madzala fc',
        group: 'B',
        color: '#ef4444',
        secondaryColor: '#b91c1c',
        city: 'Ekurhuleni',
        slogan: 'Wisdom, Power & Tactical Fire',
        founded: '2020',
        captain: ''
    },
    'areyeng-fc': {
        id: 'areyeng-fc',
        name: 'Areyeng fc',
        group: 'B',
        color: '#06b6d4',
        secondaryColor: '#0891b2',
        city: 'Tshwane',
        slogan: 'Forward Together, Never Back',
        founded: '2024',
        captain: ''
    }
};
exports.DEFAULT_DERBY_MATCHES = [
    {
        id: 'ga-m1',
        stage: 'group',
        group: 'A',
        matchOrder: 1,
        homeTeamKey: 'team-dench',
        awayTeamKey: 'cpt-superstars',
        homePlaceholder: 'Team Dench',
        awayPlaceholder: 'CPT superstars fc',
        time: '18:30',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Opening Clash'
    },
    {
        id: 'ga-m2',
        stage: 'group',
        group: 'A',
        matchOrder: 3,
        homeTeamKey: 'cpt-superstars',
        awayTeamKey: 'bras-ba-kasi',
        homePlaceholder: 'CPT superstars fc',
        awayPlaceholder: 'Bras ba kasi',
        time: '19:05',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Round 2'
    },
    {
        id: 'ga-m3',
        stage: 'group',
        group: 'A',
        matchOrder: 5,
        homeTeamKey: 'bras-ba-kasi',
        awayTeamKey: 'team-dench',
        homePlaceholder: 'Bras ba kasi',
        awayPlaceholder: 'Team Dench',
        time: '19:40',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Decider'
    },
    {
        id: 'gb-m1',
        stage: 'group',
        group: 'B',
        matchOrder: 2,
        homeTeamKey: 'gauteng-warriors',
        awayTeamKey: 'woza-madzala',
        homePlaceholder: 'Gauteng state warriors',
        awayPlaceholder: 'Woza madzala fc',
        time: '18:30',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B High-Stakes Opener'
    },
    {
        id: 'gb-m2',
        stage: 'group',
        group: 'B',
        matchOrder: 4,
        homeTeamKey: 'woza-madzala',
        awayTeamKey: 'areyeng-fc',
        homePlaceholder: 'Woza madzala fc',
        awayPlaceholder: 'Areyeng fc',
        time: '19:05',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B Round 2'
    },
    {
        id: 'gb-m3',
        stage: 'group',
        group: 'B',
        matchOrder: 6,
        homeTeamKey: 'areyeng-fc',
        awayTeamKey: 'gauteng-warriors',
        homePlaceholder: 'Areyeng fc',
        awayPlaceholder: 'Gauteng state warriors',
        time: '19:40',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B Decider'
    },
    {
        id: 'sf-1',
        stage: 'semi',
        matchOrder: 7,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Winner Group A',
        awayPlaceholder: 'Runner-up Group B',
        time: '20:15',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Semi-Final 1'
    },
    {
        id: 'sf-2',
        stage: 'semi',
        matchOrder: 8,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Winner Group B',
        awayPlaceholder: 'Runner-up Group A',
        time: '20:15',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Semi-Final 2'
    },
    {
        id: 'fn-3rd',
        stage: 'third_place',
        matchOrder: 9,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Loser SF1',
        awayPlaceholder: 'Loser SF2',
        time: '20:55',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: '3rd Place Bronze Playoff'
    },
    {
        id: 'fn-gold',
        stage: 'final',
        matchOrder: 10,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Winner SF1',
        awayPlaceholder: 'Winner SF2',
        time: '21:00',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Grand Final - Dench Derby Trophy'
    }
];
async function syncToPrismaDatabase(teams, matches, players) {
    if (!teams || typeof teams !== 'object')
        return;
    try {
        // Ensure Season 1 and Division 1 exist
        await prisma_1.default.season.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, name: '2025/26 Season', status: 'ACTIVE' }
        });
        await prisma_1.default.division.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, name: 'Division 1', tierLevel: 1 }
        });
        // 1. Sync Teams to prisma.team and prisma.teamSeasonRegistration
        const teamIdMap = {};
        const tournamentContacts = [];
        for (const key of Object.keys(teams)) {
            const t = teams[key];
            if (!t || !t.name)
                continue;
            const contact = `${key}@tournament.local`;
            tournamentContacts.push(contact);
            let dbTeam = await prisma_1.default.team.findFirst({
                where: { managerContact: contact }
            });
            if (dbTeam) {
                dbTeam = await prisma_1.default.team.update({
                    where: { id: dbTeam.id },
                    data: { name: t.name }
                });
            }
            else {
                dbTeam = await prisma_1.default.team.create({
                    data: {
                        name: t.name,
                        managerContact: contact
                    }
                });
            }
            teamIdMap[key] = dbTeam.id;
            // Register team to Season 1
            await prisma_1.default.teamSeasonRegistration.upsert({
                where: {
                    teamId_seasonId: {
                        teamId: dbTeam.id,
                        seasonId: 1
                    }
                },
                update: {
                    status: 'APPROVED',
                    divisionId: 1
                },
                create: {
                    teamId: dbTeam.id,
                    seasonId: 1,
                    divisionId: 1,
                    status: 'APPROVED'
                }
            });
        }
        // Clean up any old mock teams not belonging to this tournament (e.g. Cape Town Flames, Johannesburg Warriors)
        if (tournamentContacts.length > 0) {
            const staleTeams = await prisma_1.default.team.findMany({
                where: {
                    managerContact: { notIn: tournamentContacts }
                }
            });
            for (const st of staleTeams) {
                await prisma_1.default.matchRoster.deleteMany({
                    where: { player: { teamId: st.id } }
                }).catch(() => { });
                await prisma_1.default.match.deleteMany({
                    where: { OR: [{ homeTeamId: st.id }, { awayTeamId: st.id }] }
                }).catch(() => { });
                await prisma_1.default.teamSeasonRegistration.deleteMany({
                    where: { teamId: st.id }
                }).catch(() => { });
                await prisma_1.default.playerSeasonFinance.deleteMany({
                    where: { player: { teamId: st.id } }
                }).catch(() => { });
                await prisma_1.default.player.deleteMany({
                    where: { teamId: st.id }
                }).catch(() => { });
                await prisma_1.default.team.delete({
                    where: { id: st.id }
                }).catch(() => { });
            }
        }
        // 2. Sync Players - ONLY the players the user has saved in squads!
        const validPlayerIds = [];
        if (Array.isArray(players) && players.length > 0) {
            for (const p of players) {
                const teamId = teamIdMap[p.teamKey];
                if (!teamId || !p.name)
                    continue;
                const parts = p.name.trim().split(' ');
                const firstName = parts[0] || p.name;
                const lastName = parts.slice(1).join(' ') || '-';
                let existingPlayer = await prisma_1.default.player.findFirst({
                    where: {
                        teamId,
                        firstName,
                        lastName
                    }
                });
                if (existingPlayer) {
                    validPlayerIds.push(existingPlayer.id);
                }
                else {
                    const created = await prisma_1.default.player.create({
                        data: {
                            teamId,
                            firstName,
                            lastName
                        }
                    });
                    validPlayerIds.push(created.id);
                }
            }
        }
        // Clean up: delete any players in DB belonging to tournament teams that are NOT in validPlayerIds
        const allTournamentTeamIds = Object.values(teamIdMap);
        if (allTournamentTeamIds.length > 0) {
            await prisma_1.default.matchRoster.deleteMany({
                where: {
                    player: {
                        teamId: { in: allTournamentTeamIds },
                        id: { notIn: validPlayerIds }
                    }
                }
            }).catch(() => { });
            await prisma_1.default.playerSeasonFinance.deleteMany({
                where: {
                    player: {
                        teamId: { in: allTournamentTeamIds },
                        id: { notIn: validPlayerIds }
                    }
                }
            }).catch(() => { });
            await prisma_1.default.player.deleteMany({
                where: {
                    teamId: { in: allTournamentTeamIds },
                    id: { notIn: validPlayerIds }
                }
            }).catch(() => { });
        }
        // 3. Sync Matches
        if (Array.isArray(matches) && matches.length > 0) {
            const matchDate = new Date('2026-10-28T18:30:00+02:00');
            const validMatchIds = [];
            for (const m of matches) {
                if (!m.homeTeamKey || !m.awayTeamKey)
                    continue;
                const homeId = teamIdMap[m.homeTeamKey];
                const awayId = teamIdMap[m.awayTeamKey];
                if (!homeId || !awayId)
                    continue;
                const prismaStatus = m.status === 'completed' ? 'COMPLETED' : (m.status === 'live' ? 'LIVE' : 'UPCOMING');
                let existingMatch = await prisma_1.default.match.findFirst({
                    where: {
                        seasonId: 1,
                        homeTeamId: homeId,
                        awayTeamId: awayId
                    }
                });
                if (existingMatch) {
                    existingMatch = await prisma_1.default.match.update({
                        where: { id: existingMatch.id },
                        data: {
                            time: m.time || '18:30',
                            pitchNumber: m.pitch || 1,
                            homeScore: m.homeScore,
                            awayScore: m.awayScore,
                            status: prismaStatus
                        }
                    });
                    validMatchIds.push(existingMatch.id);
                }
                else {
                    const created = await prisma_1.default.match.create({
                        data: {
                            seasonId: 1,
                            divisionId: 1,
                            homeTeamId: homeId,
                            awayTeamId: awayId,
                            date: matchDate,
                            time: m.time || '18:30',
                            pitchNumber: m.pitch || 1,
                            homeScore: m.homeScore,
                            awayScore: m.awayScore,
                            status: prismaStatus
                        }
                    });
                    validMatchIds.push(created.id);
                }
            }
            // Clean up matches for Season 1 that are not part of tournament
            if (validMatchIds.length > 0) {
                await prisma_1.default.matchRoster.deleteMany({
                    where: { matchId: { notIn: validMatchIds } }
                }).catch(() => { });
                await prisma_1.default.match.deleteMany({
                    where: {
                        seasonId: 1,
                        id: { notIn: validMatchIds }
                    }
                }).catch(() => { });
            }
        }
    }
    catch (syncErr) {
        console.error('Error syncing Derby tournament to database:', syncErr);
    }
}
async function initDerbyTournament() {
    try {
        let currentData = null;
        if (fs_1.default.existsSync(exports.DATA_FILE)) {
            const raw = fs_1.default.readFileSync(exports.DATA_FILE, 'utf-8');
            currentData = JSON.parse(raw);
        }
        if (!currentData || !currentData.teams) {
            currentData = {
                teams: exports.DEFAULT_DERBY_TEAMS,
                matches: exports.DEFAULT_DERBY_MATCHES,
                players: [], // ZERO MOCK PLAYERS
                goalEvents: [],
                updatedAt: new Date().toISOString()
            };
            fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(currentData, null, 2), 'utf-8');
        }
        await syncToPrismaDatabase(currentData.teams, currentData.matches, currentData.players || []);
        console.log('Dench Derby Tournament database sync complete - all mock teams purged.');
    }
    catch (e) {
        console.error('Failed to initialize Derby tournament:', e);
    }
}
const getDerbyData = (req, res) => {
    try {
        if (fs_1.default.existsSync(exports.DATA_FILE)) {
            const raw = fs_1.default.readFileSync(exports.DATA_FILE, 'utf-8');
            const data = JSON.parse(raw);
            res.json(data);
            return;
        }
        const fallback = {
            teams: exports.DEFAULT_DERBY_TEAMS,
            matches: exports.DEFAULT_DERBY_MATCHES,
            players: [],
            goalEvents: []
        };
        res.json(fallback);
    }
    catch (err) {
        console.error('Failed to read derby tournament data:', err);
        res.status(500).json({ error: 'Failed to read tournament data' });
    }
};
exports.getDerbyData = getDerbyData;
const saveDerbyData = async (req, res) => {
    try {
        // Enforce role authorization: only CAPTAIN and ADMIN can save changes
        if (!req.user || req.user.role === 'REFEREE' || req.user.role === 'SPECTATOR') {
            res.status(403).json({
                error: 'Editing restricted: Participants and Referees have read-only access. Only Team Captains and Admins can save changes.'
            });
            return;
        }
        if (req.user.role === 'CAPTAIN') {
            const { isDeadlineExpired } = await Promise.resolve().then(() => __importStar(require('../services/captainService')));
            if (isDeadlineExpired()) {
                res.status(403).json({
                    error: 'Roster editing deadline has passed (28 October 18:30). Official tournament rosters are locked. Please contact League Admin.'
                });
                return;
            }
        }
        const { teams, matches, players, goalEvents } = req.body;
        const payload = {
            teams: teams || exports.DEFAULT_DERBY_TEAMS,
            matches: matches || exports.DEFAULT_DERBY_MATCHES,
            players: players || [], // Save only real players
            goalEvents: goalEvents || [],
            updatedAt: new Date().toISOString()
        };
        fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
        // Sync to database asynchronously so client response is instantaneous
        syncToPrismaDatabase(payload.teams, payload.matches, payload.players).catch(err => {
            console.error('Async DB sync notice:', err);
        });
        // Broadcast to all connected devices via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('derbyUpdate', payload);
            io.emit('scoreUpdate');
            io.emit('teamRegistered');
            io.emit('playerAdded');
        }
        res.json({ success: true, ...payload });
    }
    catch (err) {
        console.error('Failed to save derby tournament data:', err);
        res.status(500).json({ error: 'Failed to save tournament data' });
    }
};
exports.saveDerbyData = saveDerbyData;
const resetDerbyData = async (req, res) => {
    try {
        const payload = {
            teams: exports.DEFAULT_DERBY_TEAMS,
            matches: exports.DEFAULT_DERBY_MATCHES,
            players: [], // Purge all players
            goalEvents: [],
            updatedAt: new Date().toISOString()
        };
        fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
        await syncToPrismaDatabase(exports.DEFAULT_DERBY_TEAMS, exports.DEFAULT_DERBY_MATCHES, []);
        const io = req.app.get('io');
        if (io) {
            io.emit('derbyReset', payload);
            io.emit('derbyUpdate', payload);
            io.emit('scoreUpdate');
            io.emit('teamRegistered');
            io.emit('playerAdded');
        }
        res.json({ success: true, reset: true });
    }
    catch (err) {
        console.error('Failed to reset derby data:', err);
        res.status(500).json({ error: 'Failed to reset tournament data' });
    }
};
exports.resetDerbyData = resetDerbyData;
//# sourceMappingURL=derbyController.js.map