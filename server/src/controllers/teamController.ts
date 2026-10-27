import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';

const createTeamSchema = z.object({
    name: z.string().min(1, 'Team name is required'),
    logoUrl: z.string().url().optional(),
    managerContact: z.string().email('Invalid email address for manager')
});

export const createTeam = async (req: Request, res: Response) => {
    try {
        const parsedData = createTeamSchema.parse(req.body);

        const newTeam = await prisma.team.create({
            data: {
                name: parsedData.name,
                managerContact: parsedData.managerContact,
                logoUrl: parsedData.logoUrl || null,
            }
        });

        res.status(201).json(newTeam);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

const registerTeamSchema = z.object({
    teamId: z.number(),
    seasonId: z.number(),
});

export const registerTeam = async (req: Request, res: Response) => {
    try {
        const parsedData = registerTeamSchema.parse(req.body);

        const newRegistration = await prisma.teamSeasonRegistration.create({
            data: {
                teamId: parsedData.teamId,
                seasonId: parsedData.seasonId,
                divisionId: 1, // Auto-assign division 1
                status: 'APPROVED' // Auto-approve to show in UI
            }
        });

        // Auto-schedule an upcoming fixture if there are other approved clubs
        try {
            const otherTeams = await prisma.teamSeasonRegistration.findMany({
                where: {
                    seasonId: parsedData.seasonId,
                    divisionId: 1,
                    status: 'APPROVED',
                    teamId: { not: parsedData.teamId }
                }
            });

            if (otherTeams.length > 0) {
                const opponent = otherTeams[otherTeams.length - 1];
                if (opponent) {
                    const nextDate = new Date();
                    nextDate.setDate(nextDate.getDate() + 7);
                    while (nextDate.getDay() !== 2 && nextDate.getDay() !== 4) {
                        nextDate.setDate(nextDate.getDate() + 1);
                    }

                    await prisma.match.create({
                        data: {
                            seasonId: parsedData.seasonId,
                            divisionId: 1,
                            homeTeamId: parsedData.teamId,
                            awayTeamId: opponent.teamId,
                            date: nextDate,
                            time: '18:00',
                            pitchNumber: 1,
                            status: 'UPCOMING'
                        }
                    });
                }
            }
        } catch (matchErr) {
            console.error('Fixture auto-scheduling notice:', matchErr);
        }

        // Notify all devices in real-time
        const io = req.app.get('io');
        if (io) {
            io.emit('scoreUpdate');
            io.emit('teamRegistered', newRegistration);
        }

        res.status(201).json(newRegistration);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

const approveRegistrationSchema = z.object({
    divisionId: z.number(),
});

export const approveRegistration = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid registration ID' });
            return;
        }

        const parsedData = approveRegistrationSchema.parse(req.body);

        // Enforce 8-Team Division Cap
        const divisionCount = await prisma.teamSeasonRegistration.count({
            where: {
                divisionId: parsedData.divisionId,
                status: 'APPROVED'
            }
        });

        if (divisionCount >= 8) {
            res.status(400).json({ error: `Division ${parsedData.divisionId} is full. Please assign to another division or put on the waitlist.` });
            return;
        }

        const approvedRegistration = await prisma.teamSeasonRegistration.update({
            where: { id },
            data: {
                divisionId: parsedData.divisionId,
                status: 'APPROVED'
            }
        });

        res.status(200).json(approvedRegistration);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTeams = async (req: Request, res: Response) => {
    try {
        const teams = await prisma.team.findMany({
            where: {
                registrations: {
                    some: { status: 'APPROVED' }
                }
            },
            include: {
                registrations: {
                    where: { status: 'APPROVED' }
                },
                players: true
            }
        });

        // Enrich tournament teams with squad players from derby-tournament.json
        try {
            const path = require('path');
            const fs = require('fs');
            const dataFile = path.join(__dirname, '../../data/derby-tournament.json');
            if (fs.existsSync(dataFile)) {
                const derbyData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
                if (Array.isArray(derbyData.players)) {
                    teams.forEach((t: any) => {
                        if (t.managerContact && t.managerContact.endsWith('@tournament.local')) {
                            const teamKey = t.managerContact.replace('@tournament.local', '');
                            const teamPlayers = derbyData.players.filter((p: any) => p.teamKey === teamKey);
                            if (teamPlayers.length > 0) {
                                teamPlayers.forEach((tp: any) => {
                                    const exists = (t.players || []).some((p: any) =>
                                        `${p.firstName} ${p.lastName === '-' ? '' : p.lastName}`.trim().toLowerCase() === tp.name.trim().toLowerCase()
                                    );
                                    if (!exists) {
                                        const parts = tp.name.trim().split(' ');
                                        t.players.push({
                                            id: tp.id,
                                            teamId: t.id,
                                            firstName: parts[0] || tp.name,
                                            lastName: parts.slice(1).join(' ') || '-',
                                            isCaptain: tp.isCaptain === true,
                                            createdAt: new Date().toISOString(),
                                            updatedAt: new Date().toISOString()
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            }
        } catch {}

        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
