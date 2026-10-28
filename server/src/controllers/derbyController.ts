import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma';
import { SOLE_ADMIN_EMAIL } from '../middleware/auth';
import { adminUpdateCaptain } from '../services/captainService';

export const DATA_DIR = path.join(__dirname, '../../data');
export const DATA_FILE = path.join(DATA_DIR, 'derby-tournament.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const DEFAULT_DERBY_TEAMS: Record<string, any> = {
    'team-dench': {
        id: 'team-dench',
        name: 'Dench City FC',
        group: 'A',
        color: '#12b84c',
        secondaryColor: '#0ea141',
        city: 'Dench Grounds',
        slogan: 'The Pride of Dench City',
        founded: '2023'
    },
    'cpt-superstars': {
        id: 'cpt-superstars',
        name: 'BARCODE FC',
        group: 'A',
        color: '#3b82f6',
        secondaryColor: '#1d4ed8',
        city: 'Cape Town',
        slogan: 'Scanning The Field, Striking With Precision',
        founded: '2022'
    },
    'bras-ba-kasi': {
        id: 'bras-ba-kasi',
        name: 'GSW FC',
        group: 'A',
        color: '#f59e0b',
        secondaryColor: '#d97706',
        city: 'Gauteng',
        slogan: 'Golden State Warriors on Pitch',
        founded: '2021'
    },
    'gauteng-warriors': {
        id: 'gauteng-warriors',
        name: 'Mambisa FC',
        group: 'B',
        color: '#8b5cf6',
        secondaryColor: '#6d28d9',
        city: 'Mambisa',
        slogan: 'Royal Purple, Pure Football Flair',
        founded: '2022'
    },
    'woza-madzala': {
        id: 'woza-madzala',
        name: 'Ayoba fc',
        group: 'B',
        color: '#ef4444',
        secondaryColor: '#b91c1c',
        city: 'Ekurhuleni',
        slogan: 'Ayoba! Pure Kasi Magic & Speed',
        founded: '2020'
    },
    'areyeng-fc': {
        id: 'areyeng-fc',
        name: 'Areyeng fc',
        group: 'B',
        color: '#06b6d4',
        secondaryColor: '#0891b2',
        city: 'Tshwane',
        slogan: 'Forward Together, Never Back',
        founded: '2024'
    }
};

export const DEFAULT_DERBY_MATCHES = [
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

export async function syncToPrismaDatabase(teams: any, matches: any, players: any) {
    if (!teams || typeof teams !== 'object') return;

    try {
        // Ensure Season 1 and Division 1 exist
        await prisma.season.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, name: '2025/26 Season', status: 'ACTIVE' }
        });
        await prisma.division.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, name: 'Division 1', tierLevel: 1 }
        });

        // 1. Sync Teams to prisma.team and prisma.teamSeasonRegistration
        const teamIdMap: Record<string, number> = {};
        const tournamentContacts: string[] = [];

        for (const key of Object.keys(teams)) {
            const t = teams[key];
            if (!t || !t.name) continue;
            const contact = `${key}@tournament.local`;
            tournamentContacts.push(contact);

            let dbTeam = await prisma.team.findFirst({
                where: { managerContact: contact }
            });

            if (dbTeam) {
                dbTeam = await prisma.team.update({
                    where: { id: dbTeam.id },
                    data: { name: t.name }
                });
            } else {
                dbTeam = await prisma.team.create({
                    data: {
                        name: t.name,
                        managerContact: contact
                    }
                });
            }

            teamIdMap[key] = dbTeam.id;

            // Register team to Season 1
            await prisma.teamSeasonRegistration.upsert({
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
            const staleTeams = await prisma.team.findMany({
                where: {
                    managerContact: { notIn: tournamentContacts }
                }
            });

            for (const st of staleTeams) {
                await prisma.matchRoster.deleteMany({
                    where: { player: { teamId: st.id } }
                }).catch(() => {});
                await prisma.match.deleteMany({
                    where: { OR: [{ homeTeamId: st.id }, { awayTeamId: st.id }] }
                }).catch(() => {});
                await prisma.teamSeasonRegistration.deleteMany({
                    where: { teamId: st.id }
                }).catch(() => {});
                await prisma.playerSeasonFinance.deleteMany({
                    where: { player: { teamId: st.id } }
                }).catch(() => {});
                await prisma.player.deleteMany({
                    where: { teamId: st.id }
                }).catch(() => {});
                await prisma.team.delete({
                    where: { id: st.id }
                }).catch(() => {});
            }
        }

        // 2. Sync Players - ONLY the players the user has saved in squads!
        const validPlayerIds: number[] = [];
        const tournamentTeamIds = Object.values(teamIdMap);
        const existingDbPlayers = await prisma.player.findMany({
            where: { teamId: { in: tournamentTeamIds } }
        });

        if (Array.isArray(players) && players.length > 0) {
            for (const p of players) {
                const teamId = teamIdMap[p.teamKey];
                if (!teamId || !p.name) continue;

                const parts = p.name.trim().split(' ');
                const firstName = parts[0] || p.name;
                const lastName = parts.slice(1).join(' ') || '-';

                const existingPlayer = existingDbPlayers.find(
                    ep => ep.teamId === teamId &&
                          ep.firstName.toLowerCase() === firstName.toLowerCase() &&
                          ep.lastName.toLowerCase() === lastName.toLowerCase()
                );

                if (existingPlayer) {
                    if (existingPlayer.isCaptain !== (p.isCaptain === true)) {
                        await prisma.player.update({
                            where: { id: existingPlayer.id },
                            data: { isCaptain: p.isCaptain === true }
                        });
                    }
                    validPlayerIds.push(existingPlayer.id);
                } else {
                    const created = await prisma.player.create({
                        data: {
                            teamId,
                            firstName,
                            lastName,
                            isCaptain: p.isCaptain === true
                        }
                    });
                    validPlayerIds.push(created.id);
                }
            }
        }

        // 2b. Clean up deleted / mock players from database so only official tournament squad players remain
        for (const dbp of existingDbPlayers) {
            if (!validPlayerIds.includes(dbp.id)) {
                await prisma.matchRoster.deleteMany({ where: { playerId: dbp.id } }).catch(() => {});
                await prisma.playerSeasonFinance.deleteMany({ where: { playerId: dbp.id } }).catch(() => {});
                await prisma.player.delete({ where: { id: dbp.id } }).catch(() => {});
            }
        }

        // 3. Sync Matches
        if (Array.isArray(matches) && matches.length > 0) {
            const matchDate = new Date('2026-10-28T18:30:00+02:00');
            const validMatchIds: number[] = [];
            const existingMatches = await prisma.match.findMany({
                where: { seasonId: 1 }
            });

            for (const m of matches) {
                if (!m.homeTeamKey || !m.awayTeamKey) continue;
                const homeId = teamIdMap[m.homeTeamKey];
                const awayId = teamIdMap[m.awayTeamKey];
                if (!homeId || !awayId) continue;

                const prismaStatus = m.status === 'completed' ? 'COMPLETED' : (m.status === 'live' ? 'LIVE' : 'UPCOMING');

                const existingMatch = existingMatches.find(
                    em => em.homeTeamId === homeId && em.awayTeamId === awayId
                );

                if (existingMatch) {
                    const updated = await prisma.match.update({
                        where: { id: existingMatch.id },
                        data: {
                            time: m.time || '18:30',
                            pitchNumber: m.pitch || 1,
                            homeScore: m.homeScore,
                            awayScore: m.awayScore,
                            status: prismaStatus
                        }
                    });
                    validMatchIds.push(updated.id);
                } else {
                    const created = await prisma.match.create({
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
                await prisma.matchRoster.deleteMany({
                    where: { matchId: { notIn: validMatchIds } }
                }).catch(() => {});
                await prisma.match.deleteMany({
                    where: {
                        seasonId: 1,
                        id: { notIn: validMatchIds }
                    }
                }).catch(() => {});
            }
        }
    } catch (syncErr) {
        console.error('Error syncing Derby tournament to database:', syncErr);
        throw syncErr;
    }
}

export async function initDerbyTournament() {
    try {
        let currentData: any = null;
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            currentData = JSON.parse(raw);
        }

        if (!currentData || !currentData.teams) {
            currentData = {
                teams: DEFAULT_DERBY_TEAMS,
                matches: DEFAULT_DERBY_MATCHES,
                players: [], // ZERO MOCK PLAYERS
                goalEvents: [],
                updatedAt: new Date().toISOString()
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), 'utf-8');
        }

        await syncToPrismaDatabase(currentData.teams, currentData.matches, currentData.players || []);
        console.log('Dench Derby Tournament database sync complete - all mock teams purged.');
    } catch (e) {
        console.error('Failed to initialize Derby tournament:', e);
    }
}

export const getDerbyData = async (req: Request, res: Response) => {
    try {
        let currentData: any = {
            teams: DEFAULT_DERBY_TEAMS,
            matches: DEFAULT_DERBY_MATCHES,
            players: [],
            goalEvents: []
        };
        if (fs.existsSync(DATA_FILE)) {
            try {
                const raw = fs.readFileSync(DATA_FILE, 'utf-8');
                currentData = JSON.parse(raw);
            } catch {}
        }
        if (!currentData.teams || Object.keys(currentData.teams).length === 0) {
            currentData.teams = DEFAULT_DERBY_TEAMS;
        }
        if (!currentData.matches || currentData.matches.length === 0) {
            currentData.matches = DEFAULT_DERBY_MATCHES;
        }
        if (!Array.isArray(currentData.players)) {
            currentData.players = [];
        }
        if (!Array.isArray(currentData.goalEvents)) {
            currentData.goalEvents = [];
        }

        // Merge DB players into currentData.players to keep squads completely unified
        try {
            const dbPlayers = await prisma.player.findMany({
                where: { team: { managerContact: { endsWith: '@tournament.local' } } },
                include: { team: true },
                orderBy: { id: 'asc' }
            });

            if (dbPlayers.length > 0) {
                const existingMap = new Map();
                currentData.players.forEach((p: any) => {
                    if (p.teamKey && p.name) {
                        existingMap.set(`${p.teamKey}_${p.name.trim().toLowerCase()}`, p);
                    }
                });

                const teamCounts: Record<string, number> = {};
                currentData.players.forEach((p: any) => {
                    teamCounts[p.teamKey] = Math.max(teamCounts[p.teamKey] || 0, p.jerseyNumber || 0);
                });

                let updatedFile = false;
                dbPlayers.forEach((dbp) => {
                    const teamKey = dbp.team.managerContact.replace(/@tournament\.local$/, '');
                    const fullName = `${dbp.firstName} ${dbp.lastName === '-' ? '' : dbp.lastName}`.trim();
                    const key = `${teamKey}_${fullName.toLowerCase()}`;
                    const found = existingMap.get(key);

                    if (!found) {
                        teamCounts[teamKey] = (teamCounts[teamKey] || 0) + 1;
                        const newP = {
                            id: `p-${dbp.id}`,
                            teamKey,
                            name: fullName,
                            jerseyNumber: teamCounts[teamKey],
                            position: 'MID',
                            isCaptain: dbp.isCaptain === true
                        };
                        currentData.players.push(newP);
                        existingMap.set(key, newP);
                        updatedFile = true;
                    } else if (found.isCaptain !== (dbp.isCaptain === true)) {
                        found.isCaptain = dbp.isCaptain === true;
                        updatedFile = true;
                    }
                });

                if (updatedFile) {
                    try {
                        currentData.updatedAt = new Date().toISOString();
                        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), 'utf-8');
                    } catch {}
                }
            }
        } catch (dbErr) {
            console.warn('Notice merging DB players into getDerbyData:', dbErr);
        }

        res.json(currentData);
    } catch (err: any) {
        console.error('Failed to read derby tournament data:', err);
        res.status(500).json({ error: 'Failed to read tournament data' });
    }
};

export const saveDerbyData = async (req: any, res: Response) => {
    try {
        const authUser = req.user;
        const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
        const effectiveRole = authUser?.role || roleHeader || 'SPECTATOR';
        const captainTeamKey = authUser?.teamKey || (req.headers['x-captain-team-key'] as string);

        // Read current tournament state
        let currentData: any = {
            teams: DEFAULT_DERBY_TEAMS,
            matches: DEFAULT_DERBY_MATCHES,
            players: [],
            goalEvents: []
        };
        if (fs.existsSync(DATA_FILE)) {
            try {
                currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            } catch {}
        }
        if (!Array.isArray(currentData.players)) currentData.players = [];

        const { teams, matches, players, goalEvents } = req.body;

        let finalTeams = currentData.teams || DEFAULT_DERBY_TEAMS;
        let finalMatches = currentData.matches || DEFAULT_DERBY_MATCHES;
        let finalPlayers = [...currentData.players];
        let finalGoalEvents = currentData.goalEvents || [];

        const isAdmin = effectiveRole === 'ADMIN';
        const isReferee = effectiveRole === 'REFEREE';
        const isCaptain = effectiveRole === 'CAPTAIN';

        if (isAdmin) {
            if (teams) finalTeams = teams;
            if (matches) finalMatches = matches;
            if (goalEvents) finalGoalEvents = goalEvents;
            if (req.body?.clearAllSquads === true) {
                finalPlayers = [];
            } else if (Array.isArray(players)) {
                finalPlayers = players;
            }
        } else if (isReferee) {
            if (Array.isArray(matches)) {
                const incomingMatches = new Map(
                    matches
                        .filter((match: any) => match?.id !== undefined && match?.id !== null)
                        .map((match: any) => [String(match.id), match])
                );
                finalMatches = finalMatches.map((existingMatch: any) => {
                    const incomingMatch = incomingMatches.get(String(existingMatch.id));
                    if (!incomingMatch) return existingMatch;
                    return {
                        ...existingMatch,
                        ...(incomingMatch.homeTeamKey !== undefined && { homeTeamKey: incomingMatch.homeTeamKey }),
                        ...(incomingMatch.awayTeamKey !== undefined && { awayTeamKey: incomingMatch.awayTeamKey }),
                        ...(incomingMatch.homePlaceholder !== undefined && { homePlaceholder: incomingMatch.homePlaceholder }),
                        ...(incomingMatch.awayPlaceholder !== undefined && { awayPlaceholder: incomingMatch.awayPlaceholder })
                    };
                });
            }
            if (Array.isArray(goalEvents)) {
                const eventById = new Map<string, any>();
                [...finalGoalEvents, ...goalEvents].forEach((event: any) => {
                    if (event?.id) eventById.set(String(event.id), event);
                });
                finalGoalEvents = Array.from(eventById.values());
            }
        } else if (isCaptain && captainTeamKey) {
            if (teams && teams[captainTeamKey]) {
                finalTeams[captainTeamKey] = { ...finalTeams[captainTeamKey], ...teams[captainTeamKey] };
            }
            if (Array.isArray(players)) {
                const otherTeamsPlayers = currentData.players.filter((p: any) => p.teamKey !== captainTeamKey);
                const myTeamPlayers = players.filter((p: any) => p && p.teamKey === captainTeamKey);
                finalPlayers = [...otherTeamsPlayers, ...myTeamPlayers];
            }
        } else {
            // Mobile or direct player registration fallback:
            if (req.body?.clearAllSquads === true) {
                finalPlayers = [];
            } else if (Array.isArray(players)) {
                finalPlayers = players;
            }
        }

        // If a specific deleted player was provided in payload, ensure they are purged
        const deletedPlayerId = req.body?.deletedPlayerId || req.body?.deletedPlayer?.id;
        const deletedPlayerName = (req.body?.deletedPlayer?.name || '').trim().toLowerCase();
        const deletedPlayerTeamKey = req.body?.deletedPlayer?.teamKey;
        if (deletedPlayerId || (deletedPlayerName && deletedPlayerTeamKey)) {
            finalPlayers = finalPlayers.filter((p: any) => {
                if (deletedPlayerId && p.id === deletedPlayerId) return false;
                if (deletedPlayerTeamKey && deletedPlayerName && p.teamKey === deletedPlayerTeamKey && (p.name || '').trim().toLowerCase() === deletedPlayerName) return false;
                return true;
            });
        }

        if (Array.isArray(finalPlayers)) {
            const captainByTeam = new Map<string, string>();
            const captainNameByTeam = new Map<string, string>();
            finalPlayers.forEach((player: any) => {
                if (player?.isCaptain === true && player.teamKey && player.id) {
                    captainByTeam.set(player.teamKey, String(player.id));
                    captainNameByTeam.set(player.teamKey, player.name || '');
                }
            });
            finalPlayers = finalPlayers.map((player: any) => ({
                ...player,
                isCaptain: captainByTeam.get(player.teamKey) === String(player.id)
            }));

            // Sync updated captain names into captains.json
            try {
                Object.keys(finalTeams).forEach(tk => {
                    const capName = captainNameByTeam.get(tk) || '';
                    adminUpdateCaptain(tk, { captainName: capName });
                });
            } catch (syncCapErr) {
                console.warn('Notice syncing captains in saveDerbyData:', syncCapErr);
            }
        }

        const finalActiveReferees = req.body?.activeReferees !== undefined
            ? req.body.activeReferees
            : (currentData.activeReferees || {});

        const payload = {
            teams: finalTeams,
            matches: finalMatches,
            players: finalPlayers,
            goalEvents: finalGoalEvents,
            activeReferees: finalActiveReferees,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');

        syncToPrismaDatabase(payload.teams, payload.matches, payload.players).catch(err => {
            console.error('Async DB sync notice on saveDerbyData:', err);
        });

        // Broadcast to all connected devices via Socket.IO
        const io = req.app?.get ? req.app.get('io') : null;
        if (io) {
            io.emit('derbyUpdate', payload);
            io.emit('captainsUpdated');
            io.emit('scoreUpdate');
            io.emit('teamRegistered');
            io.emit('refereeClaimUpdate', finalActiveReferees);
        }

        res.json({ success: true, ...payload });
    } catch (err: any) {
        console.error('Failed to save derby tournament data:', err);
        res.status(500).json({ error: 'Failed to save tournament data' });
    }
};

export const claimRefereeMatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { matchId, pitch, refereeName, action } = req.body;
        const pitchNum = Number(pitch || 1);

        let currentData: any = {
            teams: DEFAULT_DERBY_TEAMS,
            matches: DEFAULT_DERBY_MATCHES,
            players: [],
            goalEvents: [],
            activeReferees: {}
        };
        if (fs.existsSync(DATA_FILE)) {
            try {
                currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            } catch {}
        }
        if (!currentData.activeReferees) currentData.activeReferees = {};

        // If claiming, ensure match isn't already active by the other pitch/referee
        if (action === 'claim' && matchId) {
            const otherPitchKey = Object.keys(currentData.activeReferees).find(
                p => currentData.activeReferees[p]?.matchId === matchId && Number(p) !== pitchNum
            );
            if (otherPitchKey) {
                res.status(409).json({
                    error: `Match is already actively claimed by Referee on Pitch ${otherPitchKey}`,
                    claimedBy: currentData.activeReferees[otherPitchKey]
                });
                return;
            }

            const claimInfo = {
                matchId,
                pitch: pitchNum,
                refereeName: refereeName || `Referee ${pitchNum}`,
                claimedAt: new Date().toISOString(),
                status: 'live'
            };

            currentData.activeReferees[String(pitchNum)] = claimInfo;

            // Also update match status in matches array
            if (Array.isArray(currentData.matches)) {
                const target = currentData.matches.find((m: any) => m.id === matchId);
                if (target) {
                    target.status = 'live';
                    target.officiatedBy = claimInfo;
                }
            }
        } else if (action === 'release') {
            const existingClaim = currentData.activeReferees[String(pitchNum)];
            if (existingClaim) {
                delete currentData.activeReferees[String(pitchNum)];
                if (existingClaim.matchId && Array.isArray(currentData.matches)) {
                    const target = currentData.matches.find((m: any) => m.id === existingClaim.matchId);
                    if (target && target.status === 'live') {
                        target.status = 'completed';
                    }
                }
            }
        }

        currentData.updatedAt = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), 'utf-8');

        const io = req.app?.get ? req.app.get('io') : null;
        if (io) {
            io.emit('refereeClaimUpdate', currentData.activeReferees);
            io.emit('derbyUpdate', currentData);
            io.emit('scoreUpdate');
        }

        res.json({ success: true, activeReferees: currentData.activeReferees });
    } catch (err: any) {
        console.error('Failed to claim referee match:', err);
        res.status(500).json({ error: 'Failed to update referee claim' });
    }
};

export const resetSingleMatch = async (req: Request, res: Response) => {
    try {
        const authUser = (req as any).user;
        const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
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

        let currentData: any = {
            teams: DEFAULT_DERBY_TEAMS,
            matches: DEFAULT_DERBY_MATCHES,
            players: [],
            goalEvents: [],
            activeReferees: {}
        };
        if (fs.existsSync(DATA_FILE)) {
            try {
                currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            } catch {}
        }
        if (!currentData.activeReferees) currentData.activeReferees = {};

        const matchIndex = (currentData.matches || []).findIndex((m: any) => m.id === matchId);
        if (matchIndex === -1) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }

        const targetMatch = currentData.matches[matchIndex];
        targetMatch.homeScore = null;
        targetMatch.awayScore = null;
        targetMatch.status = 'scheduled';
        targetMatch.officiatedBy = null;

        // Release any active claim for this match
        Object.keys(currentData.activeReferees).forEach(k => {
            if (currentData.activeReferees[k]?.matchId === matchId) {
                delete currentData.activeReferees[k];
            }
        });

        // Purge any goal events for this specific match
        currentData.goalEvents = (currentData.goalEvents || []).filter((ev: any) => ev.matchId !== matchId);
        currentData.updatedAt = new Date().toISOString();

        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), 'utf-8');

        // Reset corresponding match in Prisma database if it exists
        try {
            if (targetMatch.homeTeamKey && targetMatch.awayTeamKey) {
                const homeContact = `${targetMatch.homeTeamKey}@tournament.local`;
                const awayContact = `${targetMatch.awayTeamKey}@tournament.local`;
                const homeTeam = await prisma.team.findFirst({ where: { managerContact: homeContact } });
                const awayTeam = await prisma.team.findFirst({ where: { managerContact: awayContact } });
                if (homeTeam && awayTeam) {
                    await prisma.match.updateMany({
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
        } catch (dbErr) {
            console.error('Notice resetting DB match:', dbErr);
        }

        const io = req.app?.get ? req.app.get('io') : null;
        if (io) {
            io.emit('derbyUpdate', currentData);
            io.emit('refereeClaimUpdate', currentData.activeReferees);
            io.emit('scoreUpdate', {
                id: targetMatch.id,
                homeScore: null,
                awayScore: null,
                status: 'UPCOMING'
            });
        }

        res.json({ success: true, match: targetMatch, goalEvents: currentData.goalEvents, payload: currentData });
    } catch (err: any) {
        console.error('Failed to reset single match:', err);
        res.status(500).json({ error: 'Failed to reset match' });
    }
};

export const resetDerbyData = async (req: Request, res: Response) => {
    try {
        const authUser = (req as any).user;
        const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
        const isAdmin = authUser?.role === 'ADMIN' || roleHeader === 'ADMIN';

        if (!isAdmin) {
            res.status(403).json({ error: 'Forbidden: Only an administrator can reset tournament matches and scores.' });
            return;
        }

        let currentTeams = DEFAULT_DERBY_TEAMS;
        let currentPlayers: any[] = [];
        if (fs.existsSync(DATA_FILE)) {
            try {
                const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
                if (existing.teams && Object.keys(existing.teams).length > 0) {
                    currentTeams = existing.teams;
                }
                if (Array.isArray(existing.players)) {
                    currentPlayers = existing.players;
                }
            } catch {}
        }

        const purgePlayers = req.body?.purgePlayers === true || req.query?.purgePlayers === 'true';

        const payload = {
            teams: currentTeams,
            matches: DEFAULT_DERBY_MATCHES,
            players: purgePlayers ? [] : currentPlayers,
            goalEvents: [],
            activeReferees: {},
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');

        syncToPrismaDatabase(currentTeams, DEFAULT_DERBY_MATCHES, payload.players).catch(err => {
            console.error('Async DB sync notice on reset:', err);
        });

        // Also reset matches in prisma database if reachable
        try {
            await prisma.match.updateMany({
                where: { seasonId: 1 },
                data: {
                    homeScore: null,
                    awayScore: null,
                    status: 'UPCOMING'
                }
            });
        } catch {}

        const io = req.app?.get ? req.app.get('io') : null;
        if (io) {
            io.emit('derbyReset', payload);
            io.emit('derbyUpdate', payload);
            io.emit('refereeClaimUpdate', {});
            io.emit('scoreUpdate');
            io.emit('teamRegistered');
            io.emit('playerAdded');
        }

        res.json({ success: true, reset: true, payload });
    } catch (err: any) {
        console.error('Failed to reset derby data:', err);
        res.status(500).json({ error: 'Failed to reset tournament data' });
    }
};
