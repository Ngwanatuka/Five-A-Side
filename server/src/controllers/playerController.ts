import { Request, Response } from 'express';
import fs from 'fs';
import { z } from 'zod';
import prisma from '../prisma';
import { DATA_FILE, writeTournamentData } from './derbyController';
import { adminUpdateCaptain } from '../services/captainService';

const addPlayerSchema = z.object({
    teamId: z.number().int().positive(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
});

export const addPlayerToTeam = async (req: any, res: Response): Promise<void> => {
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
                const { isDeadlineExpired } = await import('../services/captainService');
                if (isDeadlineExpired()) {
                    res.status(403).json({ 
                        error: 'Roster editing deadline has passed (28 October 18:30). Official rosters are locked. Please contact League Admin.' 
                    });
                    return;
                }
            }
        }

        const parsedData = addPlayerSchema.parse(req.body);

        const team = await prisma.team.findUnique({
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

        const playerCount = await prisma.player.count({
            where: { teamId: parsedData.teamId },
        });

        if (playerCount >= 9) {
            res.status(400).json({ error: 'Maximum of 9 players allowed per team roster.' });
            return;
        }

        const newPlayer = await prisma.player.create({
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
                if (fs.existsSync(DATA_FILE)) {
                    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
                    const derbyData = JSON.parse(raw);
                    if (!derbyData.players) derbyData.players = [];

                    const fullName = `${newPlayer.firstName} ${newPlayer.lastName}`.trim();
                    const nextJersey = derbyData.players.filter((p: any) => p.teamKey === teamKey).length + 1;

                    derbyData.players.push({
                        id: `p-${newPlayer.id}`,
                        teamKey,
                        name: fullName,
                        jerseyNumber: nextJersey,
                        position: 'MID',
                        isCaptain: false
                    });

                    derbyData.updatedAt = new Date().toISOString();
                    writeTournamentData(derbyData);

                    if (io) {
                        io.emit('derbyUpdate', derbyData);
                    }
                }
            }
        } catch (derbyPlayerSyncErr) {
            console.error('Notice syncing player to derby file:', derbyPlayerSyncErr);
        }

        if (io) {
            io.emit('playerAdded', newPlayer);
            io.emit('teamRegistered');
        }

        res.status(201).json(newPlayer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPlayers = async (req: Request, res: Response): Promise<void> => {
    try {
        const teamId = req.query.teamId ? parseInt(req.query.teamId as string, 10) : undefined;
        const whereClause = teamId && !isNaN(teamId) ? { teamId } : {};
        const dbPlayers = await prisma.player.findMany({
            where: whereClause,
            include: { team: true },
            orderBy: { id: 'asc' }
        });

        let allPlayers = [...dbPlayers];
        if (fs.existsSync(DATA_FILE)) {
            try {
                const derbyData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
                if (Array.isArray(derbyData.players)) {
                    const dbTeams = await prisma.team.findMany();
                    const teamKeyToId: Record<string, any> = {};
                    dbTeams.forEach(t => {
                        if (t.managerContact && t.managerContact.endsWith('@tournament.local')) {
                            const key = t.managerContact.replace('@tournament.local', '');
                            teamKeyToId[key] = t;
                        }
                    });

                    for (const tp of derbyData.players) {
                        const team = teamKeyToId[tp.teamKey];
                        const matchedTeamId = team?.id;
                        if (teamId && matchedTeamId !== teamId) continue;

                        const exists = allPlayers.some(p => 
                            (p.teamId === matchedTeamId || p.team?.name === team?.name) &&
                            `${p.firstName} ${p.lastName}`.trim().toLowerCase() === tp.name.trim().toLowerCase()
                        );

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
                            } as any);
                        }
                    }
                }
            } catch (err) {
                console.error('Notice merging derby players in getPlayers:', err);
            }
        }

        res.status(200).json(allPlayers);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deletePlayer = async (req: any, res: Response): Promise<void> => {
    try {
        const authUser = req.user;
        const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
        const effectiveRole = authUser?.role || roleHeader || 'SPECTATOR';
        const captainTeamKey = authUser?.teamKey || (req.headers['x-captain-team-key'] as string);

        if (effectiveRole === 'REFEREE' || effectiveRole === 'SPECTATOR') {
            res.status(403).json({ 
                error: 'Editing restricted: Participants and Referees have read-only access. Only Team Captains and Admins can remove players.' 
            });
            return;
        }

        if (effectiveRole === 'CAPTAIN') {
            const { isDeadlineExpired } = await import('../services/captainService');
            if (isDeadlineExpired()) {
                res.status(403).json({ 
                    error: 'Roster editing deadline has passed (28 October 18:30). Official rosters are locked. Please contact League Admin.' 
                });
                return;
            }
        }

        const rawId = String(req.params.id || '');
        const paramName = (req.query.name as string || req.body?.name as string || '').trim();
        const paramTeamKey = (req.query.teamKey as string || req.body?.teamKey as string || '').trim();
        const paramTeamId = req.query.teamId ? parseInt(req.query.teamId as string, 10) : req.body?.teamId;

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
        let dbPlayer: any = null;
        let numericId: number | null = null;
        if (/^\d+$/.test(rawId)) {
            numericId = parseInt(rawId, 10);
        } else if (/^p-\d+$/.test(rawId)) {
            numericId = parseInt(rawId.replace(/^p-/, ''), 10);
        }

        if (numericId !== null && !isNaN(numericId)) {
            dbPlayer = await prisma.player.findUnique({
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
                const team = await prisma.team.findFirst({
                    where: {
                        OR: [
                            { managerContact: `${targetKey}@tournament.local` },
                            { managerContact: { startsWith: targetKey } }
                        ]
                    }
                });
                if (team) targetTeamId = team.id;
            }

            if (targetTeamId) {
                dbPlayer = await prisma.player.findFirst({
                    where: {
                        teamId: targetTeamId,
                        OR: [
                            { firstName, lastName },
                            { firstName: searchName }
                        ]
                    },
                    include: { team: true }
                });
            } else {
                dbPlayer = await prisma.player.findFirst({
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
            await prisma.matchRoster.deleteMany({ where: { playerId: dbPlayer.id } }).catch(() => {});
            await prisma.playerSeasonFinance.deleteMany({ where: { playerId: dbPlayer.id } }).catch(() => {});
            await prisma.player.delete({ where: { id: dbPlayer.id } }).catch(() => {});
        }

        // 2. Remove player from derby-tournament.json file
        let derbyData: any = null;
        if (fs.existsSync(DATA_FILE)) {
            try {
                derbyData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
                if (Array.isArray(derbyData.players)) {
                    derbyData.players = derbyData.players.filter((p: any) => {
                        if (!p) return false;
                        if (p.id === rawId) return false;
                        if (dbPlayer && (p.id === `p-${dbPlayer.id}` || p.id === String(dbPlayer.id))) return false;
                        if (paramTeamKey && paramName && p.teamKey === paramTeamKey && p.name.trim().toLowerCase() === paramName.toLowerCase()) return false;
                        if (dbPlayer && dbPlayer.team?.managerContact?.startsWith(p.teamKey) &&
                            `${dbPlayer.firstName} ${dbPlayer.lastName !== '-' ? dbPlayer.lastName : ''}`.trim().toLowerCase() === p.name.trim().toLowerCase()) {
                            return false;
                        }
                        return true;
                    });

                    // Clean up any associated goal events
                    if (Array.isArray(derbyData.goalEvents)) {
                        derbyData.goalEvents = derbyData.goalEvents.filter((ev: any) =>
                            ev.scorerPlayerId !== rawId &&
                            ev.assistPlayerId !== rawId &&
                            (!dbPlayer || (ev.scorerPlayerId !== `p-${dbPlayer.id}` && ev.assistPlayerId !== `p-${dbPlayer.id}`))
                        );
                    }

                    derbyData.updatedAt = new Date().toISOString();
                    writeTournamentData(derbyData);
                }
            } catch (err) {
                console.error('Notice updating derby file on player delete:', err);
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
    } catch (error) {
        console.error('Failed to delete player:', error);
        res.status(500).json({ error: 'Internal server error while removing player' });
    }
};

export const setPlayerAsCaptain = async (req: any, res: Response): Promise<void> => {
    try {
        const authUser = req.user;
        const roleHeader = (req.headers['x-user-role'] as string || '').toUpperCase();
        const effectiveRole = authUser?.role || roleHeader || 'SPECTATOR';
        const captainTeamKey = authUser?.teamKey || (req.headers['x-captain-team-key'] as string);

        if (effectiveRole === 'REFEREE' || effectiveRole === 'SPECTATOR') {
            res.status(403).json({
                error: 'Forbidden: Only Team Captains and Admins can designate the team captain.'
            });
            return;
        }

        const rawId = String(req.params.id || '');
        let tournamentTeamKey = String(req.body?.teamKey || '').trim();
        let playerName = String(req.body?.name || '').trim();

        let numericId: number | null = null;
        if (/^\d+$/.test(rawId)) {
            numericId = parseInt(rawId, 10);
        } else if (/^p-\d+$/.test(rawId)) {
            numericId = parseInt(rawId.replace(/^p-/, ''), 10);
        }

        const dataFile = DATA_FILE;

        // 1. Sync to derby tournament json file as primary real-time source
        try {
            if (fs.existsSync(dataFile)) {
                const derby = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
                if (Array.isArray(derby.players)) {
                    // If target info wasn't in body, search in JSON
                    if (!tournamentTeamKey || !playerName) {
                        const fileP = derby.players.find((p: any) => 
                            p.id === rawId || 
                            (playerName && p.name && p.name.trim().toLowerCase() === playerName.toLowerCase())
                        );
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
                        derby.players = derby.players.map((p: any) => {
                            if (p.teamKey === tournamentTeamKey) {
                                const isTarget = (
                                    p.id === rawId ||
                                    (playerName && p.name && p.name.trim().toLowerCase() === playerName.toLowerCase())
                                );
                                if (isTarget) {
                                    matched = true;
                                    if (!playerName) playerName = p.name;
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
                        fs.writeFileSync(dataFile, JSON.stringify(derby, null, 2), 'utf-8');
                    }
                }
            }
        } catch (jsonErr) {
            console.error('Notice updating captain in derby JSON:', jsonErr);
        }

        // 2. Also update captains.json so login dropdown immediately reflects the designated captain
        if (tournamentTeamKey && playerName) {
            try {
                adminUpdateCaptain(tournamentTeamKey, { captainName: playerName });
            } catch (capErr) {
                console.warn('Notice updating captain in captains.json:', capErr);
            }
        }

        // 3. Asynchronously sync to Prisma database (non-blocking)
        (async () => {
            try {
                let dbPlayer: any = null;
                if (numericId !== null && !isNaN(numericId)) {
                    dbPlayer = await prisma.player.findUnique({
                        where: { id: numericId },
                        include: { team: true }
                    });
                }
                if (!dbPlayer && playerName && tournamentTeamKey) {
                    const searchName = playerName.split(' ')[0] || playerName;
                    dbPlayer = await prisma.player.findFirst({
                        where: {
                            team: { managerContact: `${tournamentTeamKey}@tournament.local` },
                            firstName: searchName
                        },
                        include: { team: true }
                    });
                }
                if (dbPlayer) {
                    await prisma.player.updateMany({
                        where: { teamId: dbPlayer.teamId },
                        data: { isCaptain: false }
                    });
                    await prisma.player.update({
                        where: { id: dbPlayer.id },
                        data: { isCaptain: true }
                    });
                }
            } catch (dbErr) {
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
    } catch (error) {
        console.error('Failed to set player as captain:', error);
        res.status(500).json({ error: 'Internal server error while setting captain' });
    }
};

