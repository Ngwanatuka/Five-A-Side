"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFixtures = exports.getStandings = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const getStandingsSchema = zod_1.z.object({
    seasonId: zod_1.z.coerce.number().int().positive(),
    divisionId: zod_1.z.coerce.number().int().positive(),
});
const getStandings = async (req, res) => {
    try {
        const { seasonId, divisionId } = getStandingsSchema.parse(req.query);
        // Fetch teams officially registered and approved for this season/division
        const registrations = await prisma_1.default.teamSeasonRegistration.findMany({
            where: {
                seasonId,
                divisionId,
                status: 'APPROVED'
            },
            include: {
                team: true
            }
        });
        const teamMap = new Map();
        // Initialize map
        registrations.forEach(reg => {
            const t = reg.team;
            teamMap.set(t.id, {
                teamId: t.id,
                teamName: t.name,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
                form: [],
            });
        });
        // Fetch all completed and live matches for season and division
        const matches = await prisma_1.default.match.findMany({
            where: {
                seasonId,
                divisionId,
                status: {
                    in: ['COMPLETED', 'LIVE']
                }
            },
            orderBy: [
                { date: 'asc' },
                { time: 'asc' }
            ]
        });
        matches.forEach(match => {
            if (match.homeScore === null || match.awayScore === null)
                return;
            const home = teamMap.get(match.homeTeamId);
            const away = teamMap.get(match.awayTeamId);
            if (!home || !away)
                return;
            home.played += 1;
            away.played += 1;
            home.goalsFor += match.homeScore;
            home.goalsAgainst += match.awayScore;
            away.goalsFor += match.awayScore;
            away.goalsAgainst += match.homeScore;
            if (match.homeScore > match.awayScore) {
                home.won += 1;
                home.points += 3;
                home.form.push('W');
                away.lost += 1;
                away.form.push('L');
            }
            else if (match.awayScore > match.homeScore) {
                away.won += 1;
                away.points += 3;
                away.form.push('W');
                home.lost += 1;
                home.form.push('L');
            }
            else {
                home.drawn += 1;
                away.drawn += 1;
                home.points += 1;
                away.points += 1;
                home.form.push('D');
                away.form.push('D');
            }
            home.goalDifference = home.goalsFor - home.goalsAgainst;
            away.goalDifference = away.goalsFor - away.goalsAgainst;
        });
        const standings = Array.from(teamMap.values())
            // Optional: Filter out teams that haven't played? Or show all. We'll show all.
            .sort((a, b) => {
            if (b.points !== a.points)
                return b.points - a.points;
            if (b.goalDifference !== a.goalDifference)
                return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
        res.status(200).json(standings);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getStandings = getStandings;
const generateFixturesSchema = zod_1.z.object({
    startDate: zod_1.z.string(),
    pitches: zod_1.z.array(zod_1.z.number()),
});
const generateFixtures = async (req, res) => {
    try {
        const seasonId = parseInt(req.params.seasonId, 10);
        const divisionId = parseInt(req.params.divisionId, 10);
        if (isNaN(seasonId) || isNaN(divisionId)) {
            res.status(400).json({ error: 'Invalid season or division ID' });
            return;
        }
        const parsedData = generateFixturesSchema.parse(req.body);
        // Fetch registered teams for this division
        const registeredTeams = await prisma_1.default.teamSeasonRegistration.findMany({
            where: {
                seasonId,
                divisionId,
                status: 'APPROVED' // Need to be approved into the division
            },
            select: { teamId: true }
        });
        if (registeredTeams.length !== 8) {
            res.status(400).json({ error: 'Division must have exactly 8 approved teams to generate fixtures.' });
            return;
        }
        const teamIds = registeredTeams.map(rt => rt.teamId);
        // Round Robin Algorithm (Double)
        const matchesToInsert = [];
        let currentDate = new Date(parsedData.startDate);
        const numTeams = teamIds.length;
        const totalRounds = (numTeams - 1) * 2; // 14 weeks
        const matchesPerRound = numTeams / 2; // 4 matches
        // Teams array for round robin rotation
        const rotatingTeams = [...teamIds];
        for (let round = 0; round < totalRounds; round++) {
            // Half way through, we flip home/away (double round robin)
            const isSecondLeg = round >= (numTeams - 1);
            for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
                const homeIdx = (round + matchIdx) % (numTeams - 1);
                let awayIdx = (numTeams - 1 - matchIdx + round) % (numTeams - 1);
                // Last team stays stationary
                if (matchIdx === 0) {
                    awayIdx = numTeams - 1;
                }
                let homeTeam = rotatingTeams[homeIdx];
                let awayTeam = rotatingTeams[awayIdx];
                if (isSecondLeg) {
                    const temp = homeTeam;
                    homeTeam = awayTeam;
                    awayTeam = temp;
                }
                // Stagger match times: 40-minute slots starting at 18:00
                const slotIndex = Math.floor(matchIdx / parsedData.pitches.length);
                const totalMinutes = 18 * 60 + (slotIndex * 40);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                matchesToInsert.push({
                    seasonId,
                    divisionId,
                    homeTeamId: homeTeam,
                    awayTeamId: awayTeam,
                    date: new Date(currentDate),
                    time: timeStr,
                    pitchNumber: parsedData.pitches[matchIdx % parsedData.pitches.length],
                    status: 'UPCOMING'
                });
            }
            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
        }
        await prisma_1.default.match.createMany({
            data: matchesToInsert
        });
        res.status(201).json({ message: `${matchesToInsert.length} matches generated successfully.` });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.issues });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.generateFixtures = generateFixtures;
//# sourceMappingURL=leagueController.js.map