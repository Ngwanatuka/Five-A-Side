export const getBackendUrl = (): string => {
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }
    if (typeof window !== 'undefined' && window.location) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        return `${protocol}//${hostname}:5000`;
    }
    return 'http://localhost:5000';
};

export const API_BASE_URL = `${getBackendUrl()}/api`;

export const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
};

// --- AUTH & ROLES ---
export const login = async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Login failed');
    }
    return data;
};

export const captainLogin = async (teamKey: string, pin: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/captain-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamKey, pin }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Captain login failed');
    }
    return data;
};

export const getPublicCaptains = async () => {
    const response = await fetch(`${API_BASE_URL}/auth/captains`);
    if (!response.ok) throw new Error('Failed to fetch captains directory');
    return response.json();
};

export const getDeadlineStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/auth/deadline`);
    if (!response.ok) throw new Error('Failed to fetch deadline status');
    return response.json();
};

export const getAdminCaptains = async () => {
    const response = await fetch(`${API_BASE_URL}/auth/admin/captains`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch admin captains');
    return response.json();
};

export const updateCaptainAdmin = async (data: {
    teamKey: string;
    captainName?: string;
    email?: string;
    pin?: string;
    teamName?: string;
    group?: string;
}) => {
    const response = await fetch(`${API_BASE_URL}/auth/admin/captains`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update captain');
    return result;
};

export const updateDeadlineAdmin = async (deadline: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/admin/deadline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deadline }),
    });
    if (!response.ok) throw new Error('Failed to update deadline');
    return response.json();
};

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

export const updateMatchScore = async (matchId: number, homeScore: number, awayScore: number, status?: string) => {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/score`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ homeScore, awayScore, ...(status && { status }) }),
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
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
};

export const registerTeamToSeason = async (data: { teamId: number, seasonId: number }) => {
    const response = await fetch(`${API_BASE_URL}/teams/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to register team');
    return response.json();
};

// --- PLAYERS ---
export const addPlayerToTeam = async (data: { teamId: number; firstName: string; lastName: string }) => {
    const response = await fetch(`${API_BASE_URL}/players`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to add player' }));
        throw new Error(err.error || 'Failed to add player');
    }
    return response.json();
};

export const getPlayers = async (teamId?: number) => {
    const url = teamId ? `${API_BASE_URL}/players?teamId=${teamId}` : `${API_BASE_URL}/players`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch players');
    return response.json();
};

// --- FINANCES ---
export const getAllFinances = async (seasonId?: number) => {
    const url = seasonId ? `${API_BASE_URL}/finances?seasonId=${seasonId}` : `${API_BASE_URL}/finances`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch finances');
    return response.json();
};

export const processPublicPayment = async (data: { teamName: string, playerName: string, seasonId: number, paymentTier: string, amountPaid: number }) => {
    const response = await fetch(`${API_BASE_URL}/finances/public-payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to process payment');
    return response.json();
};

// --- DENCH DERBY TOURNAMENT (CROSS-DEVICE REAL-TIME SYNC) ---
export const getDerbyData = async () => {
    const response = await fetch(`${API_BASE_URL}/derby`);
    if (!response.ok) throw new Error('Failed to fetch Derby tournament data');
    return response.json();
};

export const saveDerbyData = async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/derby`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to save Derby tournament data' }));
        throw new Error(err.error || 'Failed to save Derby tournament data');
    }
    return response.json();
};

export const resetDerbyData = async () => {
    const response = await fetch(`${API_BASE_URL}/derby/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to reset Derby tournament data');
    return response.json();
};
