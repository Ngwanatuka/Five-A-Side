import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { updateMatchScore } from '../services/api';

const socket = io('http://localhost:5000');

export const MatchDayConsole = () => {
    const [homeScore, setHomeScore] = useState(2);
    const [awayScore, setAwayScore] = useState(1);

    useEffect(() => {
        socket.on('scoreUpdate', (match) => {
            // In a real app we'd target by match ID
            setHomeScore(match.homeScore);
            setAwayScore(match.awayScore);
        });

        return () => {
            socket.off('scoreUpdate');
        };
    }, []);

    const handleUpdateScore = async (home: number, away: number) => {
        try {
            await updateMatchScore(1, home, away);
            // We could let the WebSocket update the state, or update it optimistically:
            // setHomeScore(home);
            // setAwayScore(away);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="gradient-text">Match Day Console</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Referee portal for live updates and roster checks.</p>
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Tigers FC vs Lions Utd</h3>
                    <span className="animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>LIVE</span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', margin: '2rem 0', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800 }}>{homeScore}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>-</div>
                    <div style={{ fontSize: '3rem', fontWeight: 800 }}>{awayScore}</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={() => handleUpdateScore(homeScore + 1, awayScore)}>Goal Tigers</button>
                    <button className="btn btn-secondary" onClick={() => handleUpdateScore(homeScore, awayScore + 1)}>Goal Lions</button>
                </div>
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button className="btn btn-primary" style={{ width: '100%' }}>Final Whistle</button>
                </div>
            </div>
        </div>
    );
};
