import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'derby-tournament.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const getDerbyData = (req: Request, res: Response) => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const data = JSON.parse(raw);
            res.json(data);
            return;
        }
        res.json({ teams: null, matches: null, players: null, goalEvents: null });
    } catch (err: any) {
        console.error('Failed to read derby tournament data:', err);
        res.status(500).json({ error: 'Failed to read tournament data' });
    }
};

export const saveDerbyData = (req: Request, res: Response) => {
    try {
        const { teams, matches, players, goalEvents } = req.body;
        const payload = {
            teams: teams || null,
            matches: matches || null,
            players: players || null,
            goalEvents: goalEvents || null,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');

        // Broadcast to all connected devices via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('derbyUpdate', payload);
        }

        res.json({ success: true, ...payload });
    } catch (err: any) {
        console.error('Failed to save derby tournament data:', err);
        res.status(500).json({ error: 'Failed to save tournament data' });
    }
};

export const resetDerbyData = (req: Request, res: Response) => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            fs.unlinkSync(DATA_FILE);
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('derbyReset', { reset: true });
        }

        res.json({ success: true, reset: true });
    } catch (err: any) {
        console.error('Failed to reset derby data:', err);
        res.status(500).json({ error: 'Failed to reset tournament data' });
    }
};
