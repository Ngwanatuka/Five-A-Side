"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDerbyData = exports.resetSingleMatch = exports.saveDerbyData = exports.getDerbyData = exports.DEFAULT_DERBY_MATCHES = exports.DEFAULT_DERBY_TEAMS = exports.DATA_FILE = exports.DATA_DIR = void 0;
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
        name: 'Dench City FC',
        group: 'A',
        color: '#12b84c',
        secondaryColor: '#0ea141',
        city: 'Dench Grounds',
        slogan: 'The Pride of Dench City',
        founded: '2023',
        captain: 'Bafana Sithole'
    },
    'cpt-superstars': {
        id: 'cpt-superstars',
        name: 'BARCODE FC',
        group: 'A',
        color: '#3b82f6',
        secondaryColor: '#1d4ed8',
        city: 'Cape Town',
        slogan: 'Scanning The Field, Striking With Precision',
        founded: '2022',
        captain: 'Mo Hendricks'
    },
    'bras-ba-kasi': {
        id: 'bras-ba-kasi',
        name: 'GSW FC',
        group: 'A',
        color: '#f59e0b',
        secondaryColor: '#d97706',
        city: 'Gauteng',
        slogan: 'Golden State Warriors on Pitch',
        founded: '2021',
        captain: 'Thabo Dlamini'
    },
    'gauteng-warriors': {
        id: 'gauteng-warriors',
        name: 'Mambisa FC',
        group: 'B',
        color: '#8b5cf6',
        secondaryColor: '#6d28d9',
        city: 'Mambisa',
        slogan: 'Royal Purple, Pure Football Flair',
        founded: '2022',
        captain: 'Sipho Zulu'
    },
    'woza-madzala': {
        id: 'woza-madzala',
        name: 'Ayoba fc',
        group: 'B',
        color: '#ef4444',
        secondaryColor: '#b91c1c',
        city: 'Ekurhuleni',
        slogan: 'Ayoba! Pure Kasi Magic & Speed',
        founded: '2020',
        captain: 'Mandla Nkosi'
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
        captain: 'Kagiso Molefe'
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
        homePlaceholder: 'Dench City FC',
        awayPlaceholder: 'BARCODE FC',
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
        homePlaceholder: 'BARCODE FC',
        awayPlaceholder: 'GSW FC',
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
        homePlaceholder: 'GSW FC',
        awayPlaceholder: 'Dench City FC',
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
        homePlaceholder: 'Mambisa FC',
        awayPlaceholder: 'Ayoba fc',
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
        homePlaceholder: 'Ayoba fc',
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
        awayPlaceholder: 'Mambisa FC',
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
        // 2b. Clean up deleted players from database so deleted squad players don't resurrect
        if (Array.isArray(players)) {
            for (const key of Object.keys(teams)) {
                const teamId = teamIdMap[key];
                if (!teamId)
                    continue;
                const currentTeamPs = players.filter((p) => p && p.teamKey === key);
                const dbPlayersForTeam = await prisma_1.default.player.findMany({ where: { teamId } });
                for (const dbp of dbPlayersForTeam) {
                    const dbFullName = `${dbp.firstName} ${dbp.lastName !== '-' ? dbp.lastName : ''}`.trim().toLowerCase();
                    const isStillPresent = currentTeamPs.some((cp) => {
                        const cpName = (cp.name || '').trim().toLowerCase();
                        const cpId = cp.id ? String(cp.id).replace(/^p-/, '') : '';
                        return cpName === dbFullName || (cpId && cpId === String(dbp.id));
                    });
                    if (!isStillPresent) {
                        await prisma_1.default.matchRoster.deleteMany({ where: { playerId: dbp.id } }).catch(() => { });
                        await prisma_1.default.playerSeasonFinance.deleteMany({ where: { playerId: dbp.id } }).catch(() => { });
                        await prisma_1.default.player.delete({ where: { id: dbp.id } }).catch(() => { });
                    }
                }
            }
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
const getDerbyData = async (req, res) => {
    try {
        let currentData = {
            teams: exports.DEFAULT_DERBY_TEAMS,
            matches: exports.DEFAULT_DERBY_MATCHES,
            players: [],
            goalEvents: []
        };
        if (fs_1.default.existsSync(exports.DATA_FILE)) {
            try {
                const raw = fs_1.default.readFileSync(exports.DATA_FILE, 'utf-8');
                currentData = JSON.parse(raw);
            }
            catch { }
        }
        if (!currentData.teams || Object.keys(currentData.teams).length === 0) {
            currentData.teams = exports.DEFAULT_DERBY_TEAMS;
        }
        if (!currentData.matches || currentData.matches.length === 0) {
            currentData.matches = exports.DEFAULT_DERBY_MATCHES;
        }
        if (!Array.isArray(currentData.players)) {
            currentData.players = [];
        }
        if (!Array.isArray(currentData.goalEvents)) {
            currentData.goalEvents = [];
        }
        // Query database players to ensure all registered players are included across all browsers & devices
        try {
            const dbTeams = await prisma_1.default.team.findMany({
                where: { managerContact: { endsWith: '@tournament.local' } },
                include: { players: true }
            });
            const existingKeys = new Set(currentData.players.map((p) => `${p.teamKey}_${(p.name || '').trim().toLowerCase()}`));
            let addedFromDb = false;
            for (const t of dbTeams) {
                const teamKey = t.managerContact.replace('@tournament.local', '');
                for (const p of t.players) {
                    const fullName = `${p.firstName} ${p.lastName}`.trim();
                    const key = `${teamKey}_${fullName.toLowerCase()}`;
                    if (!existingKeys.has(key)) {
                        const nextJersey = currentData.players.filter((dp) => dp.teamKey === teamKey).length + 1;
                        currentData.players.push({
                            id: `p-${p.id}`,
                            teamKey,
                            name: fullName,
                            jerseyNumber: nextJersey,
                            position: 'MID',
                            isCaptain: false
                        });
                        existingKeys.add(key);
                        addedFromDb = true;
                    }
                }
            }
            if (addedFromDb) {
                currentData.updatedAt = new Date().toISOString();
                fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(currentData, null, 2), 'utf-8');
            }
        }
        catch (dbErr) {
            console.error('Notice loading DB players in getDerbyData:', dbErr);
        }
        res.json(currentData);
    }
    catch (err) {
        console.error('Failed to read derby tournament data:', err);
        res.status(500).json({ error: 'Failed to read tournament data' });
    }
};
exports.getDerbyData = getDerbyData;
const saveDerbyData = async (req, res) => {
    try {
        const authUser = req.user;
        const roleHeader = (req.headers['x-user-role'] || '').toUpperCase();
        const effectiveRole = authUser?.role || roleHeader || 'SPECTATOR';
        const captainTeamKey = authUser?.teamKey || req.headers['x-captain-team-key'];
        // Read current tournament state
        let currentData = {
            teams: exports.DEFAULT_DERBY_TEAMS,
            matches: exports.DEFAULT_DERBY_MATCHES,
            players: [],
            goalEvents: []
        };
        if (fs_1.default.existsSync(exports.DATA_FILE)) {
            try {
                currentData = JSON.parse(fs_1.default.readFileSync(exports.DATA_FILE, 'utf-8'));
            }
            catch { }
        }
        if (!Array.isArray(currentData.players))
            currentData.players = [];
        const { teams, matches, players, goalEvents } = req.body;
        let finalTeams = currentData.teams || exports.DEFAULT_DERBY_TEAMS;
        let finalMatches = currentData.matches || exports.DEFAULT_DERBY_MATCHES;
        let finalPlayers = [...currentData.players];
        let finalGoalEvents = currentData.goalEvents || [];
        const isAdmin = effectiveRole === 'ADMIN';
        const isReferee = effectiveRole === 'REFEREE';
        const isCaptain = effectiveRole === 'CAPTAIN';
        if (isAdmin) {
            if (teams)
                finalTeams = teams;
            if (matches)
                finalMatches = matches;
            if (goalEvents)
                finalGoalEvents = goalEvents;
            if (req.body?.clearAllSquads === true) {
                finalPlayers = [];
            }
            else if (Array.isArray(players)) {
                finalPlayers = players;
            }
        }
        else if (isReferee) {
            if (matches)
                finalMatches = matches;
            if (goalEvents)
                finalGoalEvents = goalEvents;
        }
        else if (isCaptain && captainTeamKey) {
            if (teams && teams[captainTeamKey]) {
                finalTeams[captainTeamKey] = { ...finalTeams[captainTeamKey], ...teams[captainTeamKey] };
            }
            if (Array.isArray(players)) {
                const otherTeamsPlayers = currentData.players.filter((p) => p.teamKey !== captainTeamKey);
                const myTeamPlayers = players.filter((p) => p && p.teamKey === captainTeamKey);
                finalPlayers = [...otherTeamsPlayers, ...myTeamPlayers];
            }
        }
        else {
            // Mobile or direct player registration fallback:
            if (req.body?.clearAllSquads === true) {
                finalPlayers = [];
            }
            else if (Array.isArray(players)) {
                finalPlayers = players;
            }
        }
        // If a specific deleted player was provided in payload, ensure they are purged
        const deletedPlayerId = req.body?.deletedPlayerId || req.body?.deletedPlayer?.id;
        const deletedPlayerName = (req.body?.deletedPlayer?.name || '').trim().toLowerCase();
        const deletedPlayerTeamKey = req.body?.deletedPlayer?.teamKey;
        if (deletedPlayerId || (deletedPlayerName && deletedPlayerTeamKey)) {
            finalPlayers = finalPlayers.filter((p) => {
                if (deletedPlayerId && p.id === deletedPlayerId)
                    return false;
                if (deletedPlayerTeamKey && deletedPlayerName && p.teamKey === deletedPlayerTeamKey && (p.name || '').trim().toLowerCase() === deletedPlayerName)
                    return false;
                return true;
            });
        }
        const payload = {
            teams: finalTeams,
            matches: finalMatches,
            players: finalPlayers,
            goalEvents: finalGoalEvents,
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
            // Only emit playerAdded if players actually increased, not when players are deleted
            if (Array.isArray(players) && players.length > (currentData.players?.length || 0)) {
                io.emit('playerAdded');
            }
        }
        res.json({ success: true, ...payload });
    }
    catch (err) {
        console.error('Failed to save derby tournament data:', err);
        res.status(500).json({ error: 'Failed to save tournament data' });
    }
};
exports.saveDerbyData = saveDerbyData;
const resetSingleMatch = async (req, res) => {
    try {
        const authUser = req.user;
        const roleHeader = (req.headers['x-user-role'] || '').toUpperCase();
        const isAdmin = authUser?.role === 'ADMIN' || roleHeader === 'ADMIN';
        if (!isAdmin) {
            res.status(403).json({ error: 'Forbidden: Only an administrator can reset match results.' });
            return;
        }
        const matchId = req.params.matchId;
        if (!matchId) {
            res.status(400).json({ error: 'Missing match ID' });
            return;
        }
        let currentData = {
            teams: exports.DEFAULT_DERBY_TEAMS,
            matches: exports.DEFAULT_DERBY_MATCHES,
            players: [],
            goalEvents: []
        };
        if (fs_1.default.existsSync(exports.DATA_FILE)) {
            try {
                currentData = JSON.parse(fs_1.default.readFileSync(exports.DATA_FILE, 'utf-8'));
            }
            catch { }
        }
        const matchIndex = (currentData.matches || []).findIndex((m) => m.id === matchId);
        if (matchIndex === -1) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }
        const targetMatch = currentData.matches[matchIndex];
        targetMatch.homeScore = null;
        targetMatch.awayScore = null;
        targetMatch.status = 'scheduled';
        // Purge any goal events for this specific match
        currentData.goalEvents = (currentData.goalEvents || []).filter((ev) => ev.matchId !== matchId);
        currentData.updatedAt = new Date().toISOString();
        fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(currentData, null, 2), 'utf-8');
        // Reset corresponding match in Prisma database if it exists
        try {
            if (targetMatch.homeTeamKey && targetMatch.awayTeamKey) {
                const homeContact = `${targetMatch.homeTeamKey}@tournament.local`;
                const awayContact = `${targetMatch.awayTeamKey}@tournament.local`;
                const homeTeam = await prisma_1.default.team.findFirst({ where: { managerContact: homeContact } });
                const awayTeam = await prisma_1.default.team.findFirst({ where: { managerContact: awayContact } });
                if (homeTeam && awayTeam) {
                    await prisma_1.default.match.updateMany({
                        where: {
                            seasonId: 1,
                            homeTeamId: homeTeam.id,
                            awayTeamId: awayTeam.id
                        },
                        data: {
                            homeScore: null,
                            awayScore: null,
                            status: 'UPCOMING'
                        }
                    });
                }
            }
        }
        catch (dbErr) {
            console.error('Notice resetting DB match:', dbErr);
        }
        const io = req.app.get('io');
        if (io) {
            io.emit('derbyUpdate', currentData);
            io.emit('scoreUpdate', {
                id: targetMatch.id,
                homeScore: null,
                awayScore: null,
                status: 'UPCOMING'
            });
        }
        res.json({ success: true, match: targetMatch, goalEvents: currentData.goalEvents, payload: currentData });
    }
    catch (err) {
        console.error('Failed to reset single match:', err);
        res.status(500).json({ error: 'Failed to reset match' });
    }
};
exports.resetSingleMatch = resetSingleMatch;
const resetDerbyData = async (req, res) => {
    try {
        const authUser = req.user;
        const roleHeader = (req.headers['x-user-role'] || '').toUpperCase();
        const isAdmin = authUser?.role === 'ADMIN' || roleHeader === 'ADMIN';
        if (!isAdmin) {
            res.status(403).json({ error: 'Forbidden: Only an administrator can reset tournament matches and scores.' });
            return;
        }
        let currentTeams = exports.DEFAULT_DERBY_TEAMS;
        let currentPlayers = [];
        if (fs_1.default.existsSync(exports.DATA_FILE)) {
            try {
                const existing = JSON.parse(fs_1.default.readFileSync(exports.DATA_FILE, 'utf-8'));
                if (existing.teams && Object.keys(existing.teams).length > 0) {
                    currentTeams = existing.teams;
                }
                if (Array.isArray(existing.players)) {
                    currentPlayers = existing.players;
                }
            }
            catch { }
        }
        const purgePlayers = req.body?.purgePlayers === true || req.query?.purgePlayers === 'true';
        const payload = {
            teams: currentTeams,
            matches: exports.DEFAULT_DERBY_MATCHES,
            players: purgePlayers ? [] : currentPlayers,
            goalEvents: [],
            updatedAt: new Date().toISOString()
        };
        fs_1.default.writeFileSync(exports.DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
        syncToPrismaDatabase(currentTeams, exports.DEFAULT_DERBY_MATCHES, payload.players).catch(err => {
            console.error('Async DB sync notice on reset:', err);
        });
        // Also reset matches in prisma database if reachable
        try {
            await prisma_1.default.match.updateMany({
                where: { seasonId: 1 },
                data: {
                    homeScore: null,
                    awayScore: null,
                    status: 'UPCOMING'
                }
            });
        }
        catch { }
        const io = req.app.get('io');
        if (io) {
            io.emit('derbyReset', payload);
            io.emit('derbyUpdate', payload);
            io.emit('scoreUpdate');
            io.emit('teamRegistered');
            io.emit('playerAdded');
        }
        res.json({ success: true, reset: true, payload });
    }
    catch (err) {
        console.error('Failed to reset derby data:', err);
        res.status(500).json({ error: 'Failed to reset tournament data' });
    }
};
exports.resetDerbyData = resetDerbyData;
//# sourceMappingURL=derbyController.js.map