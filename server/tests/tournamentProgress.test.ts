import {
    calculateGroupStandings,
    getKnockoutOutcome,
    isGroupStageComplete,
    type TournamentProgressMatch,
    type TournamentProgressTeam
} from '../../shared/tournamentProgress';

const groupFixtures = (overrides: Partial<{
    status: string;
    homeScore: number | null;
    awayScore: number | null;
}> = {}) => Array.from({ length: 3 }, () => ({
    stage: 'group',
    group: 'A',
    status: 'completed',
    homeScore: 1,
    awayScore: 0,
    ...overrides
}));

describe('Dench tournament progression', () => {
    it('does not complete group stage until every scheduled group fixture has a completed score', () => {
        expect(isGroupStageComplete(groupFixtures(), 'A')).toBe(true);
        expect(isGroupStageComplete(groupFixtures().slice(0, 2), 'A')).toBe(false);
        expect(isGroupStageComplete(groupFixtures({ status: 'live' }), 'A')).toBe(false);
        expect(isGroupStageComplete(groupFixtures({ homeScore: null }), 'A')).toBe(false);
        expect(isGroupStageComplete(groupFixtures(), 'B')).toBe(false);
    });

    it('does not assign a winner or loser to a tied knockout match without an explicit shootout winner', () => {
        expect(getKnockoutOutcome(
            { homeScore: 2, awayScore: 2 },
            'team-a',
            'team-b'
        )).toEqual({ winnerKey: null, loserKey: null });
    });

    it('uses the recorded shootout winner to determine knockout progression', () => {
        expect(getKnockoutOutcome(
            { homeScore: 2, awayScore: 2, tieBreakWinnerKey: 'team-b' },
            'team-a',
            'team-b'
        )).toEqual({ winnerKey: 'team-b', loserKey: 'team-a' });
    });

    it('continues to use the match score when a knockout match is not tied', () => {
        expect(getKnockoutOutcome(
            { homeScore: 3, awayScore: 1, tieBreakWinnerKey: 'team-b' },
            'team-a',
            'team-b'
        )).toEqual({ winnerKey: 'team-a', loserKey: 'team-b' });
    });

    it('resolves a complete Dench tournament from group fixtures through the trophy match', () => {
        const teams: Record<string, TournamentProgressTeam> = {
            dench: { name: 'Dench City FC', color: 'green', group: 'A' },
            barcode: { name: 'BARCODE FC', color: 'blue', group: 'A' },
            gsw: { name: 'GSW FC', color: 'orange', group: 'A' },
            mambisa: { name: 'Mambisa FC', color: 'purple', group: 'B' },
            ayoba: { name: 'Ayoba FC', color: 'red', group: 'B' },
            areyeng: { name: 'Areyeng FC', color: 'cyan', group: 'B' }
        };
        const completedMatch = (
            id: string,
            group: 'A' | 'B',
            homeTeamKey: string,
            awayTeamKey: string,
            homeScore: number,
            awayScore: number
        ): TournamentProgressMatch => ({
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
            completedMatch('ga-m1', 'A', 'dench', 'barcode', 2, 1),
            completedMatch('ga-m2', 'A', 'barcode', 'gsw', 3, 0),
            completedMatch('ga-m3', 'A', 'gsw', 'dench', 1, 0),
            completedMatch('gb-m1', 'B', 'mambisa', 'ayoba', 1, 0),
            completedMatch('gb-m2', 'B', 'ayoba', 'areyeng', 2, 0),
            completedMatch('gb-m3', 'B', 'areyeng', 'mambisa', 0, 1)
        ];

        expect(isGroupStageComplete(groupMatches, 'A')).toBe(true);
        expect(isGroupStageComplete(groupMatches, 'B')).toBe(true);

        const groupA = calculateGroupStandings(teams, groupMatches, 'A');
        const groupB = calculateGroupStandings(teams, groupMatches, 'B');
        expect(groupA.slice(0, 2).map(team => team.teamKey)).toEqual(['barcode', 'dench']);
        expect(groupB.slice(0, 2).map(team => team.teamKey)).toEqual(['mambisa', 'ayoba']);
        const [groupAFirst, groupASecond] = groupA;
        const [groupBFirst, groupBSecond] = groupB;
        if (!groupAFirst || !groupASecond || !groupBFirst || !groupBSecond) {
            throw new Error('Expected two ranked teams in each completed group.');
        }

        const semi1 = { homeScore: 2, awayScore: 2, tieBreakWinnerKey: 'barcode' };
        const semi2 = { homeScore: 1, awayScore: 0 };
        const semi1Outcome = getKnockoutOutcome(semi1, groupAFirst.teamKey, groupBSecond.teamKey);
        const semi2Outcome = getKnockoutOutcome(semi2, groupASecond.teamKey, groupBFirst.teamKey);
        expect(semi1Outcome).toEqual({ winnerKey: 'barcode', loserKey: 'ayoba' });
        expect(semi2Outcome).toEqual({ winnerKey: 'dench', loserKey: 'mambisa' });

        const finalOutcome = getKnockoutOutcome(
            { homeScore: 3, awayScore: 3, tieBreakWinnerKey: 'dench' },
            semi1Outcome.winnerKey,
            semi2Outcome.winnerKey
        );
        const thirdPlaceOutcome = getKnockoutOutcome(
            { homeScore: 1, awayScore: 0 },
            semi1Outcome.loserKey,
            semi2Outcome.loserKey
        );

        expect(finalOutcome).toEqual({ winnerKey: 'dench', loserKey: 'barcode' });
        expect(thirdPlaceOutcome).toEqual({ winnerKey: 'ayoba', loserKey: 'mambisa' });
    });
});
