export type TournamentProgressMatch = {
    id?: string;
    stage: string;
    group?: string;
    status?: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeamKey?: string | null;
    awayTeamKey?: string | null;
    tieBreakWinnerKey?: string | null;
};

export type TournamentProgressTeam = {
    name: string;
    color: string;
    group: string;
};

type GroupOrderTeam = {
    name: string;
    group: string;
};

type GroupOrderMatch = {
    id?: string;
    stage?: string;
    group?: string;
    status?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    homeTeamKey?: string | null;
    awayTeamKey?: string | null;
    homePlaceholder?: string;
    awayPlaceholder?: string;
};

const REQUESTED_TEAM_ORDER = [
    'team-dench',
    'woza-madzala',
    'areyeng-fc',
    'bras-ba-kasi',
    'gauteng-warriors',
    'cpt-superstars'
] as const;

const REQUESTED_TEAM_GROUPS: Record<string, 'A' | 'B'> = {
    'team-dench': 'A',
    'woza-madzala': 'A',
    'areyeng-fc': 'A',
    'bras-ba-kasi': 'B',
    'gauteng-warriors': 'B',
    'cpt-superstars': 'B'
};

const LEGACY_TEAM_NAMES: Record<string, { name: string; aliases: string[] }> = {
    'woza-madzala': { name: 'Ayoba FC', aliases: ['Ayoba fc'] },
    'areyeng-fc': { name: 'Areyeng FC', aliases: ['Areyeng fc'] },
    'cpt-superstars': { name: 'Barcode FC', aliases: ['BARCODE FC', 'CPT superstars fc'] }
};

const REQUESTED_GROUP_FIXTURES: Record<string, {
    group: 'A' | 'B';
    homeTeamKey: string;
    awayTeamKey: string;
}> = {
    'ga-m1': { group: 'A', homeTeamKey: 'team-dench', awayTeamKey: 'woza-madzala' },
    'ga-m2': { group: 'A', homeTeamKey: 'woza-madzala', awayTeamKey: 'areyeng-fc' },
    'ga-m3': { group: 'A', homeTeamKey: 'areyeng-fc', awayTeamKey: 'team-dench' },
    'gb-m1': { group: 'B', homeTeamKey: 'bras-ba-kasi', awayTeamKey: 'gauteng-warriors' },
    'gb-m2': { group: 'B', homeTeamKey: 'gauteng-warriors', awayTeamKey: 'cpt-superstars' },
    'gb-m3': { group: 'B', homeTeamKey: 'cpt-superstars', awayTeamKey: 'bras-ba-kasi' }
};

export const migrateRequestedTournamentGroups = <
    Team extends GroupOrderTeam,
    Match extends GroupOrderMatch
>(
    teams: Record<string, Team>,
    matches: Match[]
): boolean => {
    let changed = false;

    for (const [teamKey, group] of Object.entries(REQUESTED_TEAM_GROUPS)) {
        const team = teams[teamKey];
        if (!team) continue;

        if (team.group !== group) {
            team.group = group;
            changed = true;
        }

        const legacyName = LEGACY_TEAM_NAMES[teamKey];
        if (legacyName && legacyName.aliases.includes(team.name.trim())) {
            team.name = legacyName.name;
            changed = true;
        }
    }

    const orderedKeys = [
        ...REQUESTED_TEAM_ORDER.filter(teamKey => teamKey in teams),
        ...Object.keys(teams).filter(teamKey => !(teamKey in REQUESTED_TEAM_GROUPS))
    ];
    if (orderedKeys.some((teamKey, index) => teamKey !== Object.keys(teams)[index])) {
        const orderedTeams = Object.fromEntries(orderedKeys.map(teamKey => [teamKey, teams[teamKey]]));
        Object.keys(teams).forEach(teamKey => delete teams[teamKey]);
        Object.assign(teams, orderedTeams);
        changed = true;
    }

    const groupMatches = matches.filter(match => match.stage === 'group');
    const fixturesAreUnplayed = groupMatches.length === 6 &&
        groupMatches.every(match =>
            (match.homeScore === null || match.homeScore === undefined) &&
            (match.awayScore === null || match.awayScore === undefined) &&
            match.status !== 'live' &&
            match.status !== 'completed'
        );

    if (fixturesAreUnplayed) {
        for (const match of groupMatches) {
            const fixture = match.id ? REQUESTED_GROUP_FIXTURES[match.id] : undefined;
            if (!fixture) continue;

            const homePlaceholder = teams[fixture.homeTeamKey]?.name;
            const awayPlaceholder = teams[fixture.awayTeamKey]?.name;
            if (
                match.group !== fixture.group ||
                match.homeTeamKey !== fixture.homeTeamKey ||
                match.awayTeamKey !== fixture.awayTeamKey ||
                match.homePlaceholder !== homePlaceholder ||
                match.awayPlaceholder !== awayPlaceholder
            ) {
                Object.assign(match, {
                    group: fixture.group,
                    homeTeamKey: fixture.homeTeamKey,
                    awayTeamKey: fixture.awayTeamKey,
                    homePlaceholder,
                    awayPlaceholder
                });
                changed = true;
            }
        }
    }

    return changed;
};

export type GroupStanding = {
    teamKey: string;
    name: string;
    color: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
};

export const isGroupStageComplete = (
    matches: TournamentProgressMatch[],
    group: 'A' | 'B'
): boolean => {
    const groupMatches = matches.filter(match => match.stage === 'group' && match.group === group);
    return groupMatches.length === 3 && groupMatches.every(match =>
        match.status?.toLowerCase() === 'completed' &&
        match.homeScore !== null &&
        match.awayScore !== null
    );
};

export const calculateGroupStandings = (
    teams: Record<string, TournamentProgressTeam>,
    matches: TournamentProgressMatch[],
    group: 'A' | 'B'
): GroupStanding[] => {
    const standings: Record<string, GroupStanding> = {};

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
            if (match.homeScore === null || match.awayScore === null || !match.homeTeamKey || !match.awayTeamKey) return;
            const home = standings[match.homeTeamKey];
            const away = standings[match.awayTeamKey];
            if (!home || !away) return;

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
            } else if (match.awayScore > match.homeScore) {
                away.won += 1;
                away.points += 3;
                home.lost += 1;
            } else {
                home.drawn += 1;
                away.drawn += 1;
                home.points += 1;
                away.points += 1;
            }

            home.goalDifference = home.goalsFor - home.goalsAgainst;
            away.goalDifference = away.goalsFor - away.goalsAgainst;
        });

    return Object.values(standings).sort((a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor
    );
};

export const getKnockoutOutcome = (
    match: Pick<TournamentProgressMatch, 'homeScore' | 'awayScore' | 'tieBreakWinnerKey'> | undefined,
    homeKey: string | null | undefined,
    awayKey: string | null | undefined
): { winnerKey: string | null; loserKey: string | null } => {
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
