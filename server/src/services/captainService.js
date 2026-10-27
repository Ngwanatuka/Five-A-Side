"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeadlineStatus = exports.isDeadlineExpired = exports.adminUpdateDeadline = exports.adminUpdateCaptain = exports.verifyCaptain = exports.getAdminCaptains = exports.getPublicCaptains = exports.saveCaptainConfig = exports.getCaptainConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, '../../data');
const CAPTAINS_FILE = path_1.default.join(DATA_DIR, 'captains.json');
const DEFAULT_CONFIG = {
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
const getCaptainConfig = () => {
    try {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs_1.default.existsSync(CAPTAINS_FILE)) {
            fs_1.default.writeFileSync(CAPTAINS_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
            return DEFAULT_CONFIG;
        }
        const raw = fs_1.default.readFileSync(CAPTAINS_FILE, 'utf-8');
        return JSON.parse(raw);
    }
    catch (err) {
        console.error('Error reading captains.json, fallback to defaults:', err);
        return DEFAULT_CONFIG;
    }
};
exports.getCaptainConfig = getCaptainConfig;
const saveCaptainConfig = (config) => {
    try {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs_1.default.writeFileSync(CAPTAINS_FILE, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Error saving captains.json:', err);
    }
};
exports.saveCaptainConfig = saveCaptainConfig;
/**
 * Public listing of captains (never includes PINs)
 */
const getPublicCaptains = () => {
    const config = (0, exports.getCaptainConfig)();
    return Object.values(config.captains).map(({ pin, ...safe }) => safe);
};
exports.getPublicCaptains = getPublicCaptains;
/**
 * Full listing with PINs for Admin only
 */
const getAdminCaptains = () => {
    const config = (0, exports.getCaptainConfig)();
    return {
        deadline: config.deadline,
        captains: Object.values(config.captains)
    };
};
exports.getAdminCaptains = getAdminCaptains;
/**
 * Verify a Captain's PIN
 */
const verifyCaptain = (teamKey, pin) => {
    const config = (0, exports.getCaptainConfig)();
    const entry = config.captains[teamKey];
    if (!entry)
        return null;
    if (entry.pin.trim() === pin.trim()) {
        return entry;
    }
    return null;
};
exports.verifyCaptain = verifyCaptain;
/**
 * Admin updates a team captain and/or PIN
 */
const adminUpdateCaptain = (teamKey, updates) => {
    const config = (0, exports.getCaptainConfig)();
    if (!config.captains[teamKey]) {
        config.captains[teamKey] = {
            teamKey,
            teamName: updates.teamName || teamKey,
            captainName: updates.captainName || 'Assigned Captain',
            email: updates.email || '',
            pin: updates.pin || '1234',
            group: updates.group || 'A'
        };
    }
    else {
        config.captains[teamKey] = {
            ...config.captains[teamKey],
            ...updates
        };
    }
    (0, exports.saveCaptainConfig)(config);
    return config.captains[teamKey];
};
exports.adminUpdateCaptain = adminUpdateCaptain;
/**
 * Admin updates the deadline (if ever needed)
 */
const adminUpdateDeadline = (newDeadline) => {
    const config = (0, exports.getCaptainConfig)();
    config.deadline = newDeadline;
    (0, exports.saveCaptainConfig)(config);
    return config.deadline;
};
exports.adminUpdateDeadline = adminUpdateDeadline;
/**
 * Check if the deadline (28 Oct 18:30) has passed
 */
const isDeadlineExpired = () => {
    const config = (0, exports.getCaptainConfig)();
    const deadlineTime = new Date(config.deadline).getTime();
    const currentTime = Date.now();
    return currentTime > deadlineTime;
};
exports.isDeadlineExpired = isDeadlineExpired;
/**
 * Deadline status info
 */
const getDeadlineStatus = () => {
    const config = (0, exports.getCaptainConfig)();
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
exports.getDeadlineStatus = getDeadlineStatus;
//# sourceMappingURL=captainService.js.map