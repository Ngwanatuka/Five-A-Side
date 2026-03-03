const API_BASE_URL = 'http://localhost:5000/api';

export const getStandings = async (seasonId: number, divisionId: number) => {
    const response = await fetch(`${API_BASE_URL}/league/standings?seasonId=${seasonId}&divisionId=${divisionId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch standings');
    }
    return response.json();
};

export const updateMatchScore = async (matchId: number, homeScore: number, awayScore: number) => {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/score`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ homeScore, awayScore }),
    });

    if (!response.ok) {
        throw new Error('Failed to update score');
    }
    return response.json();
};
