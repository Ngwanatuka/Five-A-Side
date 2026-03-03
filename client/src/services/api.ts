const API_BASE_URL = 'http://localhost:5000/api';

// --- LEAGUE ---
export const getStandings = async (seasonId: number, divisionId: number) => {
    const response = await fetch(`${API_BASE_URL}/league/standings?seasonId=${seasonId}&divisionId=${divisionId}`);
    if (!response.ok) throw new Error('Failed to fetch standings');
    return response.json();
};

// --- MATCHES ---
export const getMatches = async (params?: { seasonId?: number, divisionId?: number, status?: string }) => {
    let url = `${API_BASE_URL}/matches`;
    if (params) {
        const qs = new URLSearchParams();
        if (params.seasonId) qs.append('seasonId', params.seasonId.toString());
        if (params.divisionId) qs.append('divisionId', params.divisionId.toString());
        if (params.status) qs.append('status', params.status);
        if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch matches');
    return response.json();
};

export const updateMatchScore = async (matchId: number, homeScore: number, awayScore: number) => {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore, awayScore }),
    });
    if (!response.ok) throw new Error('Failed to update score');
    return response.json();
};

// --- TEAMS ---
export const getTeams = async () => {
    const response = await fetch(`${API_BASE_URL}/teams`);
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
};

export const createTeam = async (data: { name: string, managerContact: string, logoUrl?: string }) => {
    const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
};

export const registerTeamToSeason = async (data: { teamId: number, seasonId: number }) => {
    const response = await fetch(`${API_BASE_URL}/teams/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to register team');
    return response.json();
};

// --- FINANCES ---
export const getAllFinances = async (seasonId?: number) => {
    const url = seasonId ? `${API_BASE_URL}/finances?seasonId=${seasonId}` : `${API_BASE_URL}/finances`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch finances');
    return response.json();
};

export const processPublicPayment = async (data: { teamName: string, playerName: string, seasonId: number, paymentTier: string, amountPaid: number }) => {
    const response = await fetch(`${API_BASE_URL}/finances/public-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to process payment');
    return response.json();
};
