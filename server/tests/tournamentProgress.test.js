"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tournamentProgress_1 = require("../../shared/tournamentProgress");
const groupFixtures = (overrides = {}) => Array.from({ length: 3 }, () => ({
    stage: 'group',
    group: 'A',
    status: 'completed',
    homeScore: 1,
    awayScore: 0,
    ...overrides
}));
describe('Dench tournament progression', () => {
    it('does not complete group stage until every scheduled group fixture has a completed score', () => {
        expect((0, tournamentProgress_1.isGroupStageComplete)(groupFixtures(), 'A')).toBe(true);
        expect((0, tournamentProgress_1.isGroupStageComplete)(groupFixtures().slice(0, 2), 'A')).toBe(false);
        expect((0, tournamentProgress_1.isGroupStageComplete)(groupFixtures({ status: 'live' }), 'A')).toBe(false);
        expect((0, tournamentProgress_1.isGroupStageComplete)(groupFixtures({ homeScore: null }), 'A')).toBe(false);
        expect((0, tournamentProgress_1.isGroupStageComplete)(groupFixtures(), 'B')).toBe(false);
    });
    it('does not assign a winner or loser to a tied knockout match without an explicit shootout winner', () => {
        expect((0, tournamentProgress_1.getKnockoutOutcome)({ homeScore: 2, awayScore: 2 }, 'team-a', 'team-b')).toEqual({ winnerKey: null, loserKey: null });
    });
    it('uses the recorded shootout winner to determine knockout progression', () => {
        expect((0, tournamentProgress_1.getKnockoutOutcome)({ homeScore: 2, awayScore: 2, tieBreakWinnerKey: 'team-b' }, 'team-a', 'team-b')).toEqual({ winnerKey: 'team-b', loserKey: 'team-a' });
    });
    it('continues to use the match score when a knockout match is not tied', () => {
        expect((0, tournamentProgress_1.getKnockoutOutcome)({ homeScore: 3, awayScore: 1, tieBreakWinnerKey: 'team-b' }, 'team-a', 'team-b')).toEqual({ winnerKey: 'team-a', loserKey: 'team-b' });
    });
    it('resolves a complete Dench tournament from group fixtures through the trophy match', () => {
        const teams = {
            dench: { name: 'Dench City FC', color: 'green', group: 'A' },
            ayoba: { name: 'Ayoba FC', color: 'red', group: 'A' },
            areyeng: { name: 'Areyeng FC', color: 'cyan', group: 'A' },
            gsw: { name: 'GSW FC', color: 'orange', group: 'B' },
            mambisa: { name: 'Mambisa FC', color: 'purple', group: 'B' },
            barcode: { name: 'Barcode FC', color: 'blue', group: 'B' }
        };
        const completedMatch = (id, group, homeTeamKey, awayTeamKey, homeScore, awayScore) => ({
            id,
            stage: 'group',
            group,
            homeTeamKey,
            awayTeamKey,
            homeScore,
            awayScore,
            status: 'completed'
        });
        const groupMatches = [
            completedMatch('ga-m1', 'A', 'dench', 'ayoba', 3, 0),
            completedMatch('ga-m2', 'A', 'ayoba', 'areyeng', 3, 0),
            completedMatch('ga-m3', 'A', 'areyeng', 'dench', 1, 0),
            completedMatch('gb-m1', 'B', 'gsw', 'mambisa', 3, 0),
            completedMatch('gb-m2', 'B', 'mambisa', 'barcode', 2, 0),
            completedMatch('gb-m3', 'B', 'barcode', 'gsw', 0, 1)
        ];
        expect((0, tournamentProgress_1.isGroupStageComplete)(groupMatches, 'A')).toBe(true);
        expect((0, tournamentProgress_1.isGroupStageComplete)(groupMatches, 'B')).toBe(true);
        const groupA = (0, tournamentProgress_1.calculateGroupStandings)(teams, groupMatches, 'A');
        const groupB = (0, tournamentProgress_1.calculateGroupStandings)(teams, groupMatches, 'B');
        expect(groupA.slice(0, 2).map(team => team.teamKey)).toEqual(['dench', 'ayoba']);
        expect(groupB.slice(0, 2).map(team => team.teamKey)).toEqual(['gsw', 'mambisa']);
        const [groupAFirst, groupASecond] = groupA;
        const [groupBFirst, groupBSecond] = groupB;
        if (!groupAFirst || !groupASecond || !groupBFirst || !groupBSecond) {
            throw new Error('Expected two ranked teams in each completed group.');
        }
        const semi1 = { homeScore: 2, awayScore: 2, tieBreakWinnerKey: 'dench' };
        const semi2 = { homeScore: 1, awayScore: 0 };
        const semi1Outcome = (0, tournamentProgress_1.getKnockoutOutcome)(semi1, groupAFirst.teamKey, groupBSecond.teamKey);
        const semi2Outcome = (0, tournamentProgress_1.getKnockoutOutcome)(semi2, groupASecond.teamKey, groupBFirst.teamKey);
        expect(semi1Outcome).toEqual({ winnerKey: 'dench', loserKey: 'mambisa' });
        expect(semi2Outcome).toEqual({ winnerKey: 'ayoba', loserKey: 'gsw' });
        const finalOutcome = (0, tournamentProgress_1.getKnockoutOutcome)({ homeScore: 3, awayScore: 3, tieBreakWinnerKey: 'ayoba' }, semi1Outcome.winnerKey, semi2Outcome.winnerKey);
        const thirdPlaceOutcome = (0, tournamentProgress_1.getKnockoutOutcome)({ homeScore: 1, awayScore: 0 }, semi1Outcome.loserKey, semi2Outcome.loserKey);
        expect(finalOutcome).toEqual({ winnerKey: 'ayoba', loserKey: 'dench' });
        expect(thirdPlaceOutcome).toEqual({ winnerKey: 'mambisa', loserKey: 'gsw' });
    });
});
//# sourceMappingURL=tournamentProgress.test.js.map