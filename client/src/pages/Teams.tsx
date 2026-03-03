import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Shield, Users, Trophy } from 'lucide-react';
import { getStandings } from '../services/api';
import { NavLink } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export const Teams = () => {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTeams = async () => {
        try {
            const data = await getStandings(1, 1);
            setTeams(data);
        } catch (error) {
            console.error("Failed to fetch teams", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();

        socket.on('scoreUpdate', () => {
            fetchTeams();
        });

        return () => {
            socket.off('scoreUpdate');
        };
    }, []);

    const totalTeams = teams.length;
    const leader = teams.length > 0 ? teams[0].teamName : '-';
    const totalGoals = teams.reduce((sum, t) => sum + (t.goalsFor || 0), 0);
    const mostWins = teams.length > 0 ? Math.max(...teams.map(t => t.won || 0)) : 0;

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Teams</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>{totalTeams} teams registered for the 2025/26 season.</p>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>Loading teams...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', paddingBottom: '2rem' }}>
                        {teams.map((team, index) => {
                            const pos = index + 1;
                            const isLeader = pos === 1;

                            return (
                                <div key={team.teamId} className="glass-card" style={{
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderColor: isLeader ? 'var(--color-primary)' : 'var(--color-border)',
                                    borderWidth: isLeader ? '2px' : '1px'
                                }}>
                                    {/* Card Header Image/Icons */}
                                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                        <div className="flex-center" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                            <Shield size={20} color="var(--color-primary)" />
                                        </div>
                                        <div className="flex-center" style={{
                                            width: '24px', height: '24px',
                                            backgroundColor: isLeader ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                                            color: isLeader ? '#050505' : 'white',
                                            borderRadius: '50%',
                                            fontWeight: 700,
                                            fontSize: '0.85rem'
                                        }}>
                                            {pos}
                                        </div>
                                    </div>

                                    {/* Team Info */}
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.teamName}</h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Captain: TBD</p>
                                    </div>

                                    {/* Main Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: isLeader ? 'var(--color-primary)' : 'white' }}>{team.points}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Points</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{team.played}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Played</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: team.goalDifference > 0 ? 'var(--color-primary)' : (team.goalDifference < 0 ? '#ef4444' : 'white') }}>
                                                {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>GD</div>
                                        </div>
                                    </div>

                                    {/* Form Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                        <div style={{ color: 'var(--color-primary)' }}>W: {team.won}</div>
                                        <div style={{ color: '#ca8a04' }}>D: {team.drawn}</div>
                                        <div style={{ color: '#ef4444' }}>L: {team.lost}</div>
                                    </div>

                                    {/* Goals */}
                                    <div className="flex-between" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                                        <span>⚽ GF: {team.goalsFor}</span>
                                        <span>GA: {team.goalsAgainst}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Team Stat Cards Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem', paddingBottom: '3rem' }}>
                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Users size={24} color="var(--color-primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{totalTeams}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Teams</div>
                        </div>
                    </div>

                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Trophy size={24} color="var(--color-primary)" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: '0.25rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{leader}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>League Leader</div>
                        </div>
                    </div>

                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{totalGoals}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Goals</div>
                        </div>
                    </div>

                    <div className="glass-card flex-center" style={{ padding: '2rem 1.5rem', justifyContent: 'flex-start', gap: '1.5rem' }}>
                        <div className="flex-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Shield size={24} color="var(--color-primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{mostWins}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Most Wins</div>
                        </div>
                    </div>
                </div>

                <footer style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div className="flex-center gap-2">
                            <div className="nav-logo-icon" style={{ padding: '0.2rem' }}><Trophy size={14} color="#050505" /></div>
                            <strong style={{ color: 'white' }}>5-A-Side League</strong>
                        </div>
                        <NavLink to="/login" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                            Referee Login
                        </NavLink>
                    </div>
                    <div className="flex-center gap-4">
                        <span>Standings</span><span>Fixtures</span><span>Results</span><span>Teams</span>
                    </div>
                    <div>Season 2025/26</div>
                </footer>
            </main>
        </div>
    );
};
