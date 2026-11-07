"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTournamentLeagueStandings = exports.applyTournamentScoreUpdate = exports.resolveKnockoutParticipants = exports.normalizeTournamentSnapshot = void 0;
const tournamentProgress_1 = require("../../../../shared/tournamentProgress");
/**
 * Pure domain function: normalizes group assignments and unplayed group fixtures
 * without losing any existing players, captains, or scored matches.
 */
const normalizeTournamentSnapshot = (snapshot) => {
    if (!snapshot.teams || !Array.isArray(snapshot.matches)) {
        return false;
    }
    return (0, tournamentProgress_1.migrateRequestedTournamentGroups)(snapshot.teams, snapshot.matches);
};
exports.normalizeTournamentSnapshot = normalizeTournamentSnapshot;
/**
 * Pure domain function: resolves knockout match participants from completed group standings
 * and semifinal outcomes when knockout team keys are not yet persisted.
 */
const resolveKnockoutParticipants = (teams, matches, targetMatch) => {
    if (!['semi', 'final', 'third_place'].includes(targetMatch.stage || '')) {
        return;
    }
    if (targetMatch.homeTeamKey && targetMatch.awayTeamKey) {
        return;
    }
    const teamsWithColor = Object.fromEntries(Object.entries(teams).map(([k, t]) => [k, { name: t.name, color: t.color || '#12b84c', group: t.group }]));
    const normalizedMatches = matches.map(m => ({
        ...m,
        stage: m.stage || 'group'
    }));
    const standingsA = (0, tournamentProgress_1.calculateGroupStandings)(teamsWithColor, normalizedMatches, 'A');
    const standingsB = (0, tournamentProgress_1.calculateGroupStandings)(teamsWithColor, normalizedMatches, 'B');
    const groupAComplete = (0, tournamentProgress_1.isGroupStageComplete)(normalizedMatches, 'A');
    const groupBComplete = (0, tournamentProgress_1.isGroupStageComplete)(normalizedMatches, 'B');
    const a1stKey = standingsA[0]?.teamKey || null;
    const a2ndKey = standingsA[1]?.teamKey || null;
    const b1stKey = standingsB[0]?.teamKey || null;
    const b2ndKey = standingsB[1]?.teamKey || null;
    const sf1 = matches.find(m => m.id === 'sf-1');
    const sf2 = matches.find(m => m.id === 'sf-2');
    const sf1HomeKey = sf1?.homeTeamKey || (groupAComplete ? a1stKey : null);
    const sf1AwayKey = sf1?.awayTeamKey || (groupBComplete ? b2ndKey : null);
    const sf2HomeKey = sf2?.homeTeamKey || (groupAComplete ? a2ndKey : null);
    const sf2AwayKey = sf2?.awayTeamKey || (groupBComplete ? b1stKey : null);
    const sf1Outcome = (0, tournamentProgress_1.getKnockoutOutcome)(sf1, sf1HomeKey, sf1AwayKey);
    const sf2Outcome = (0, tournamentProgress_1.getKnockoutOutcome)(sf2, sf2HomeKey, sf2AwayKey);
    if (targetMatch.id === 'sf-1') {
        targetMatch.homeTeamKey = targetMatch.homeTeamKey || sf1HomeKey;
        targetMatch.awayTeamKey = targetMatch.awayTeamKey || sf1AwayKey;
    }
    else if (targetMatch.id === 'sf-2') {
        targetMatch.homeTeamKey = targetMatch.homeTeamKey || sf2HomeKey;
        targetMatch.awayTeamKey = targetMatch.awayTeamKey || sf2AwayKey;
    }
    else if (targetMatch.id === 'fn-3rd') {
        targetMatch.homeTeamKey = targetMatch.homeTeamKey || sf1Outcome.loserKey;
        targetMatch.awayTeamKey = targetMatch.awayTeamKey || sf2Outcome.loserKey;
    }
    else if (targetMatch.id === 'fn-gold') {
        targetMatch.homeTeamKey = targetMatch.homeTeamKey || sf1Outcome.winnerKey;
        targetMatch.awayTeamKey = targetMatch.awayTeamKey || sf2Outcome.winnerKey;
    }
};
exports.resolveKnockoutParticipants = resolveKnockoutParticipants;
/**
 * Pure domain function: applies a referee/admin score update to a tournament snapshot,
 * enforcing completion immutability against delayed live updates and knockout shootout rules.
 */
const applyTournamentScoreUpdate = (snapshot, command) => {
    if (!Array.isArray(snapshot.matches)) {
        return { status: 'not_found' };
    }
    if (snapshot.teams && typeof snapshot.teams === 'object') {
        (0, exports.normalizeTournamentSnapshot)(snapshot);
    }
    const matchIndex = snapshot.matches.findIndex(m => m.id === command.matchId);
    if (matchIndex === -1) {
        return { status: 'not_found' };
    }
    const tm = snapshot.matches[matchIndex];
    // Prevent delayed live score updates from reverting an already completed match
    if (tm.status?.toLowerCase() === 'completed' && command.status?.toLowerCase() !== 'completed') {
        return { status: 'ok', match: tm, snapshot };
    }
    if (snapshot.teams) {
        (0, exports.resolveKnockoutParticipants)(snapshot.teams, snapshot.matches, tm);
    }
    if (command.tieBreakWinnerKey !== undefined) {
        const isKnockout = ['semi', 'final', 'third_place'].includes(tm.stage || '');
        const hasTiedScore = command.homeScore !== null &&
            command.awayScore !== null &&
            command.homeScore === command.awayScore;
        const isParticipant = command.tieBreakWinnerKey === tm.homeTeamKey ||
            command.tieBreakWinnerKey === tm.awayTeamKey;
        if (command.tieBreakWinnerKey !== null &&
            (!isKnockout || !hasTiedScore || command.status?.toLowerCase() !== 'completed' || !isParticipant)) {
            return { status: 'invalid_tie_break' };
        }
        tm.tieBreakWinnerKey = command.tieBreakWinnerKey;
    }
    else if (command.status?.toLowerCase() !== 'completed' || command.homeScore !== command.awayScore) {
        tm.tieBreakWinnerKey = null;
    }
    tm.homeScore = command.homeScore;
    tm.awayScore = command.awayScore;
    if (command.status) {
        const lower = command.status.toLowerCase();
        tm.status = lower === 'completed' ? 'completed' : lower === 'live' ? 'live' : 'scheduled';
    }
    if (command.goalEvents) {
        const existingGoalEvents = Array.isArray(snapshot.goalEvents) ? snapshot.goalEvents : [];
        snapshot.goalEvents = [
            ...existingGoalEvents.filter(ev => ev.matchId !== command.matchId),
            ...command.goalEvents
        ];
    }
    snapshot.updatedAt = new Date().toISOString();
    return { status: 'ok', match: tm, snapshot };
};
exports.applyTournamentScoreUpdate = applyTournamentScoreUpdate;
/**
 * Pure domain function: calculates league/tournament standings rows from a TournamentSnapshot.
 */
const calculateTournamentLeagueStandings = (snapshot, teamKeyToDbId = new Map()) => {
    if (!snapshot.teams || !Array.isArray(snapshot.matches)) {
        return [];
    }
    (0, exports.normalizeTournamentSnapshot)(snapshot);
    const standingsMap = new Map();
    Object.entries(snapshot.teams).forEach(([teamKey, team], index) => {
        if (!team?.name)
            return;
        standingsMap.set(teamKey, {
            teamId: teamKeyToDbId.get(teamKey) ?? index + 1,
            teamName: team.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            form: []
        });
    });
    snapshot.matches.forEach(m => {
        const statusLower = String(m.status || '').toLowerCase();
        if (!['completed', 'live'].includes(statusLower))
            return;
        if (m.homeScore === null || m.homeScore === undefined || m.awayScore === null || m.awayScore === undefined)
            return;
        if (!m.homeTeamKey || !m.awayTeamKey)
            return;
        const home = standingsMap.get(m.homeTeamKey);
        const away = standingsMap.get(m.awayTeamKey);
        if (!home || !away)
            return;
        const homeScore = Number(m.homeScore);
        const awayScore = Number(m.awayScore);
        if (Number.isNaN(homeScore) || Number.isNaN(awayScore))
            return;
        home.played += 1;
        away.played += 1;
        home.goalsFor += homeScore;
        home.goalsAgainst += awayScore;
        away.goalsFor += awayScore;
        away.goalsAgainst += homeScore;
        if (homeScore > awayScore) {
            home.won += 1;
            home.points += 3;
            home.form.push('W');
            away.lost += 1;
            away.form.push('L');
        }
        else if (awayScore > homeScore) {
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
    return Array.from(standingsMap.values()).sort((a, b) => {
        if (b.points !== a.points)
            return b.points - a.points;
        if (b.goalDifference !== a.goalDifference)
            return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });
};
exports.calculateTournamentLeagueStandings = calculateTournamentLeagueStandings;
//# sourceMappingURL=tournamentDomain.js.map