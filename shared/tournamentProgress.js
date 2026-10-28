"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKnockoutOutcome = exports.calculateGroupStandings = exports.isGroupStageComplete = void 0;
const isGroupStageComplete = (matches, group) => {
    const groupMatches = matches.filter(match => match.stage === 'group' && match.group === group);
    return groupMatches.length === 3 && groupMatches.every(match => match.status?.toLowerCase() === 'completed' &&
        match.homeScore !== null &&
        match.awayScore !== null);
};
exports.isGroupStageComplete = isGroupStageComplete;
const calculateGroupStandings = (teams, matches, group) => {
    const standings = {};
    Object.entries(teams)
        .filter(([, team]) => team.group === group)
        .forEach(([teamKey, team]) => {
        standings[teamKey] = {
            teamKey,
            name: team.name,
            color: team.color,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        };
    });
    matches
        .filter(match => match.stage === 'group' && match.group === group)
        .forEach(match => {
        if (match.homeScore === null || match.awayScore === null || !match.homeTeamKey || !match.awayTeamKey)
            return;
        const home = standings[match.homeTeamKey];
        const away = standings[match.awayTeamKey];
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
            away.lost += 1;
        }
        else if (match.awayScore > match.homeScore) {
            away.won += 1;
            away.points += 3;
            home.lost += 1;
        }
        else {
            home.drawn += 1;
            away.drawn += 1;
            home.points += 1;
            away.points += 1;
        }
        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;
    });
    return Object.values(standings).sort((a, b) => b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor);
};
exports.calculateGroupStandings = calculateGroupStandings;
const getKnockoutOutcome = (match, homeKey, awayKey) => {
    if (!match || match.homeScore === null || match.awayScore === null || !homeKey || !awayKey) {
        return { winnerKey: null, loserKey: null };
    }
    if (match.homeScore > match.awayScore) {
        return { winnerKey: homeKey, loserKey: awayKey };
    }
    if (match.awayScore > match.homeScore) {
        return { winnerKey: awayKey, loserKey: homeKey };
    }
    if (match.tieBreakWinnerKey === homeKey) {
        return { winnerKey: homeKey, loserKey: awayKey };
    }
    if (match.tieBreakWinnerKey === awayKey) {
        return { winnerKey: awayKey, loserKey: homeKey };
    }
    return { winnerKey: null, loserKey: null };
};
exports.getKnockoutOutcome = getKnockoutOutcome;
//# sourceMappingURL=tournamentProgress.js.map