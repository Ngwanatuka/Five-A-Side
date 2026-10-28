export const getBackendUrl = (): string => {
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        // In local dev, Express runs on :5000 (localhost, loopback, or private WSL/LAN IP)
        if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(hostname)) {
            return `http://${hostname}:5000`;
        }
        // On Render (or any production host), client and server share the same origin
        return '';
    }
    return 'http://localhost:5000';
};

export const API_BASE_URL = `${getBackendUrl()}/api`;

export const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'SPECTATOR';
    const captainTeamKey = localStorage.getItem('captain_team_key') || '';
    const userEmail = localStorage.getItem('user_email') || '';
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Role': userRole
    };
    if (userEmail) {
        headers['X-User-Email'] = userEmail;
    }
    if (captainTeamKey) {
        headers['X-Captain-Team-Key'] = captainTeamKey;
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
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

export interface PublicCaptain {
    teamKey: string;
    teamName: string;
    captainName: string;
    email?: string;
    pin?: string;
    group?: string;
}

export const MOCK_CAPTAIN_NAMES = new Set([
    'bafana sithole',
    'mo hendricks',
    'thabo dlamini',
    'sipho zulu',
    'mandla nkosi',
    'kagiso molefe'
]);

export const isMockCaptain = (name?: string | null): boolean => {
    if (!name) return false;
    const clean = name.toLowerCase().trim();
    if (MOCK_CAPTAIN_NAMES.has(clean)) return true;
    return clean === 'bafana' || clean === 'mo' || clean === 'hendricks' || clean === 'sithole';
};

export const cleanseLegacyMockData = (): void => {
    if (typeof window === 'undefined') return;
    try {
        const rawPlayers = localStorage.getItem('dench_derby_players_v4');
        if (rawPlayers) {
            const parsed = JSON.parse(rawPlayers);
            if (Array.isArray(parsed)) {
                const cleaned = parsed.filter(p =>
                    !isMockCaptain(p?.name) &&
                    !p?.id?.startsWith('p-dench-') &&
                    !p?.id?.startsWith('p-cpt-') &&
                    !p?.id?.startsWith('p-bras-') &&
                    !p?.id?.startsWith('p-gaut-') &&
                    !p?.id?.startsWith('p-woza-') &&
                    !p?.id?.startsWith('p-arey-')
                );
                if (cleaned.length !== parsed.length) {
                    localStorage.setItem('dench_derby_players_v4', JSON.stringify(cleaned));
                }
            }
        }
        const rawTeams = localStorage.getItem('dench_derby_teams_v4');
        if (rawTeams) {
            const parsed = JSON.parse(rawTeams);
            let changed = false;
            Object.keys(parsed).forEach(k => {
                if (parsed[k]?.captain) {
                    delete parsed[k].captain;
                    changed = true;
                }
                if (parsed[k]?.captainName) {
                    if (isMockCaptain(parsed[k].captainName)) {
                        delete parsed[k].captainName;
                        changed = true;
                    }
                }
            });
            if (changed) {
                localStorage.setItem('dench_derby_teams_v4', JSON.stringify(parsed));
            }
        }
        const storedCapName = localStorage.getItem('captain_name');
        if (storedCapName && isMockCaptain(storedCapName)) {
            localStorage.removeItem('captain_name');
        }
        localStorage.removeItem('captains');
        localStorage.removeItem('captains_list');
        localStorage.removeItem('dench_derby_captains');
    } catch {}
};

// Immediately execute cleansing on client import
if (typeof window !== 'undefined') {
    cleanseLegacyMockData();
}

export const DEFAULT_CAPTAINS: PublicCaptain[] = [
    { teamKey: 'team-dench', teamName: 'Dench City FC', captainName: '', pin: '1111', group: 'A' },
    { teamKey: 'cpt-superstars', teamName: 'BARCODE FC', captainName: '', pin: '2222', group: 'A' },
    { teamKey: 'bras-ba-kasi', teamName: 'GSW FC', captainName: '', pin: '3333', group: 'A' },
    { teamKey: 'gauteng-warriors', teamName: 'Mambisa FC', captainName: '', pin: '4444', group: 'B' },
    { teamKey: 'woza-madzala', teamName: 'Ayoba fc', captainName: '', pin: '5555', group: 'B' },
    { teamKey: 'areyeng-fc', teamName: 'Areyeng fc', captainName: '', pin: '6666', group: 'B' }
];

export const getStoredOrFallbackCaptains = (): PublicCaptain[] => {
    try {
        cleanseLegacyMockData();
        const storedTeamsRaw = typeof window !== 'undefined' ? localStorage.getItem('dench_derby_teams_v4') : null;
        const storedTeams = storedTeamsRaw ? JSON.parse(storedTeamsRaw) : {};
        const playersRaw = typeof window !== 'undefined' ? localStorage.getItem('dench_derby_players_v4') : null;
        const rosterPlayers: { teamKey: string; name: string; isCaptain?: boolean }[] =
            playersRaw ? JSON.parse(playersRaw) : [];

        const getRosterCaptainName = (teamKey: string): string => {
            const player = rosterPlayers.find(p => p.teamKey === teamKey && p.isCaptain === true);
            if (player?.name && !isMockCaptain(player.name)) {
                return player.name.trim();
            }
            return '';
        };

        const list = DEFAULT_CAPTAINS.map(def => ({
            ...def,
            teamName: storedTeams[def.teamKey]?.name || def.teamName,
            captainName: getRosterCaptainName(def.teamKey),
            group: storedTeams[def.teamKey]?.group || def.group
        }));
        const seenKeys = new Set(DEFAULT_CAPTAINS.map(c => c.teamKey));

        Object.entries(storedTeams).forEach(([key, value]: [string, any]) => {
            if (!seenKeys.has(key)) {
                list.push({
                    teamKey: key,
                    teamName: value.name || key,
                    captainName: getRosterCaptainName(key),
                    pin: value.pin || '1234',
                    group: value.group || 'A'
                });
            }
        });

        return list;
    } catch {
        return DEFAULT_CAPTAINS;
    }
};

export const captainLogin = async (teamKey: string, pin: string) => {
    try {
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
    } catch (err: any) {
        if (err.message && err.message.includes('Incorrect Captain PIN')) {
            throw err;
        }
        throw new Error('Incorrect Captain PIN for this team.');
    }
};

export const getPublicCaptains = async (): Promise<PublicCaptain[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/captains`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data.map((c: any) => ({
                    ...c,
                    captainName: isMockCaptain(c.captainName) ? '' : (c.captainName || '')
                }));
            }
        }
    } catch (err) {
        console.warn('Could not fetch captains from API, falling back to local list:', err);
    }
    return getStoredOrFallbackCaptains();
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

type MatchGoalEvent = {
    id: string;
    matchId: string;
    teamKey: string;
    scorerPlayerId: string;
    scorerPlayerName?: string;
    assistPlayerId?: string | null;
    assistPlayerName?: string | null;
    minute: number;
    side?: 'home' | 'away';
};

export const updateMatchScore = async (
    matchId: string | number,
    homeScore: number,
    awayScore: number,
    status?: string,
    goalEvents?: MatchGoalEvent[],
    tieBreakWinnerKey?: string | null
) => {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/score`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            homeScore,
            awayScore,
            ...(status && { status }),
            ...(goalEvents && { goalEvents }),
            ...(tieBreakWinnerKey !== undefined && { tieBreakWinnerKey })
        }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to update score' }));
        throw new Error(err.error || 'Failed to update score');
    }
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

export const deletePlayer = async (playerId: string | number, extra?: { teamKey?: string; name?: string }) => {
    const qs = new URLSearchParams();
    if (extra?.teamKey) qs.append('teamKey', extra.teamKey);
    if (extra?.name) qs.append('name', extra.name);
    const url = `${API_BASE_URL}/players/${playerId}${qs.toString() ? `?${qs.toString()}` : ''}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to delete player' }));
        throw new Error(err.error || 'Failed to delete player');
    }
    return response.json();
};

export const setPlayerCaptain = async (playerId: string | number, payload?: { teamKey?: string; name?: string }) => {
    const response = await fetch(`${API_BASE_URL}/players/${playerId}/captain`, {
        method: 'POST',
        headers: getAuthHeaders(),
        ...(payload && { body: JSON.stringify(payload) })
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to set team captain' }));
        throw new Error(err.error || 'Failed to set team captain');
    }
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

export const resetSingleMatch = async (matchId: string) => {
    const response = await fetch(`${API_BASE_URL}/derby/reset-match/${matchId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to reset match' }));
        throw new Error(err.error || 'Failed to reset match');
    }
    return response.json();
};

export const claimRefereeMatch = async (payload: { matchId: string; pitch: number; refereeName?: string; action: 'claim' | 'release' }) => {
    const response = await fetch(`${API_BASE_URL}/derby/claim-match`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to update referee match claim' }));
        throw new Error(err.error || 'Failed to update referee match claim');
    }
    return response.json();
};
