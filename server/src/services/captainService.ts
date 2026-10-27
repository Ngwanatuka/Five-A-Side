import fs from 'fs';
import path from 'path';

export interface CaptainEntry {
    teamKey: string;
    teamName: string;
    captainName: string;
    email: string;
    pin: string;
    group?: string;
}

export interface CaptainConfig {
    deadline: string; // ISO 8601 string, e.g. "2026-10-28T18:30:00+02:00"
    captains: Record<string, CaptainEntry>;
}

const DATA_DIR = path.join(__dirname, '../../data');
const CAPTAINS_FILE = path.join(DATA_DIR, 'captains.json');

const DEFAULT_CONFIG: CaptainConfig = {
    deadline: '2026-10-28T18:30:00+02:00',
    captains: {
        'team-dench': {
            teamKey: 'team-dench',
            teamName: 'Dench City FC',
            captainName: '',
            email: 'dench.captain@5aside.com',
            pin: '1111',
            group: 'A'
        },
        'cpt-superstars': {
            teamKey: 'cpt-superstars',
            teamName: 'BARCODE FC',
            captainName: '',
            email: 'cpt.captain@5aside.com',
            pin: '2222',
            group: 'A'
        },
        'bras-ba-kasi': {
            teamKey: 'bras-ba-kasi',
            teamName: 'GSW FC',
            captainName: '',
            email: 'kasi.captain@5aside.com',
            pin: '3333',
            group: 'A'
        },
        'gauteng-warriors': {
            teamKey: 'gauteng-warriors',
            teamName: 'Mambisa FC',
            captainName: '',
            email: 'gauteng.captain@5aside.com',
            pin: '4444',
            group: 'B'
        },
        'woza-madzala': {
            teamKey: 'woza-madzala',
            teamName: 'Ayoba fc',
            captainName: '',
            email: 'woza.captain@5aside.com',
            pin: '5555',
            group: 'B'
        },
        'areyeng-fc': {
            teamKey: 'areyeng-fc',
            teamName: 'Areyeng fc',
            captainName: '',
            email: 'areyeng.captain@5aside.com',
            pin: '6666',
            group: 'B'
        }
    }
};

export const getCaptainConfig = (): CaptainConfig => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(CAPTAINS_FILE)) {
            fs.writeFileSync(CAPTAINS_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
            return DEFAULT_CONFIG;
        }
        const raw = fs.readFileSync(CAPTAINS_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading captains.json, fallback to defaults:', err);
        return DEFAULT_CONFIG;
    }
};

export const saveCaptainConfig = (config: CaptainConfig): void => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(CAPTAINS_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error saving captains.json:', err);
    }
};

/**
 * Public listing of captains (never includes PINs)
 */
export const getPublicCaptains = () => {
    const config = getCaptainConfig();
    return Object.values(config.captains).map(({ pin, ...safe }) => safe);
};

/**
 * Full listing with PINs for Admin only
 */
export const getAdminCaptains = () => {
    const config = getCaptainConfig();
    return {
        deadline: config.deadline,
        captains: Object.values(config.captains)
    };
};

/**
 * Verify a Captain's PIN
 */
export const verifyCaptain = (teamKey: string, pin: string): CaptainEntry | null => {
    const config = getCaptainConfig();
    const entry = config.captains[teamKey];
    if (!entry) return null;
    if (entry.pin.trim() === pin.trim()) {
        return entry;
    }
    return null;
};

/**
 * Admin updates a team captain and/or PIN
 */
export const adminUpdateCaptain = (
    teamKey: string,
    updates: Partial<CaptainEntry>
): CaptainEntry => {
    const config = getCaptainConfig();
    if (!config.captains[teamKey]) {
        config.captains[teamKey] = {
            teamKey,
            teamName: updates.teamName || teamKey,
            captainName: updates.captainName || 'Assigned Captain',
            email: updates.email || '',
            pin: updates.pin || '1234',
            group: updates.group || 'A'
        };
    } else {
        config.captains[teamKey] = {
            ...config.captains[teamKey],
            ...updates
        };
    }
    saveCaptainConfig(config);
    return config.captains[teamKey];
};

/**
 * Admin updates the deadline (if ever needed)
 */
export const adminUpdateDeadline = (newDeadline: string): string => {
    const config = getCaptainConfig();
    config.deadline = newDeadline;
    saveCaptainConfig(config);
    return config.deadline;
};

/**
 * Check if the deadline (28 Oct 18:30) has passed
 */
export const isDeadlineExpired = (): boolean => {
    const config = getCaptainConfig();
    const deadlineTime = new Date(config.deadline).getTime();
    const currentTime = Date.now();
    return currentTime > deadlineTime;
};

/**
 * Deadline status info
 */
export const getDeadlineStatus = () => {
    const config = getCaptainConfig();
    const deadlineTime = new Date(config.deadline).getTime();
    const now = Date.now();
    const isExpired = now > deadlineTime;
    const remainingMs = Math.max(0, deadlineTime - now);

    return {
        deadline: config.deadline,
        now: new Date().toISOString(),
        isExpired,
        remainingMs
    };
};
